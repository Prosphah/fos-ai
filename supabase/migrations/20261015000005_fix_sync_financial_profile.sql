-- Stop sync_financial_profile from treating "no data" as a fact about the user.

-- Two defects, both caused by wrapping every aggregate in COALESCE(..., 0) and
-- then writing the result back onto the profile:
--
--   1. Someone who typed an income at onboarding but has not connected an account
--      had monthly_income overwritten with 0, their assets overwritten with 0, and
--      their savings rate then read 100% because expenses had zeroed as well.
--   2. Liabilities were summed from the six per category debt columns only, so a
--      user who records one total owed was scored as debt free.
--
-- Fix: only replace a value when there is real data behind it, and take liabilities
-- from total_debt when it is set, falling back to the six legacy columns.

CREATE OR REPLACE FUNCTION sync_financial_profile(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
  v_current_score NUMERIC;
  v_previous_score_month DATE;

  -- Real data found, and the aggregate of it
  v_income_rows INTEGER;
  v_income_sum NUMERIC;
  v_expense_rows INTEGER;
  v_expense_sum NUMERIC;
  v_savings_rows INTEGER;
  v_savings_accounts NUMERIC;
  v_investment_rows INTEGER;
  v_investment_accounts NUMERIC;
  v_cash_rows INTEGER;
  v_cash_accounts NUMERIC;

  -- Values already on the profile
  v_monthly_income NUMERIC;
  v_monthly_expenses NUMERIC;
  v_total_savings NUMERIC;
  v_total_investments NUMERIC;
  v_total_cash NUMERIC;
  v_total_retirement NUMERIC;
  v_total_property NUMERIC;
  v_total_business NUMERIC;
  v_total_other_assets NUMERIC;
  v_total_debt_column NUMERIC;
  v_credit_card_debt NUMERIC;
  v_personal_loan_debt NUMERIC;
  v_student_loan_debt NUMERIC;
  v_mortgage_debt NUMERIC;
  v_car_loan_debt NUMERIC;
  v_other_debts NUMERIC;
  v_risk_score NUMERIC;

  -- Derived
  v_legacy_liabilities NUMERIC;
  v_total_liabilities NUMERIC;
  v_total_assets NUMERIC;
  v_net_worth NUMERIC;
  v_debt_ratio NUMERIC;
  v_savings_rate NUMERIC;
  v_ef_months NUMERIC;
  v_fhs NUMERIC;
BEGIN
  SELECT
    id,
    COALESCE(monthly_income, 0),
    COALESCE(monthly_expenses, 0),
    COALESCE(total_savings, 0),
    COALESCE(total_investments, 0),
    COALESCE(total_cash, 0),
    COALESCE(total_retirement_accounts, 0),
    COALESCE(total_property_value, 0),
    COALESCE(total_business_ownership, 0),
    COALESCE(total_other_assets, 0),
    total_debt,
    COALESCE(credit_card_debt, 0),
    COALESCE(personal_loan_debt, 0),
    COALESCE(student_loan_debt, 0),
    COALESCE(mortgage_debt, 0),
    COALESCE(car_loan_debt, 0),
    COALESCE(other_debts, 0),
    COALESCE(risk_score, 50),
    financial_health_score,
    previous_score_month
  INTO
    v_profile_id,
    v_monthly_income,
    v_monthly_expenses,
    v_total_savings,
    v_total_investments,
    v_total_cash,
    v_total_retirement,
    v_total_property,
    v_total_business,
    v_total_other_assets,
    v_total_debt_column,
    v_credit_card_debt,
    v_personal_loan_debt,
    v_student_loan_debt,
    v_mortgage_debt,
    v_car_loan_debt,
    v_other_debts,
    v_risk_score,
    v_current_score,
    v_previous_score_month
  FROM financial_profiles
  WHERE user_id = p_user_id;

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  -- Income and expenses over the last 30 days. Count the rows as well as summing
  -- them, so an empty result leaves the typed figure alone instead of zeroing it.
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO v_income_rows, v_income_sum
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';

  IF v_income_rows > 0 THEN
    v_monthly_income := v_income_sum;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO v_expense_rows, v_expense_sum
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';

  IF v_expense_rows > 0 THEN
    v_monthly_expenses := v_expense_sum;
  END IF;

  -- Account balances follow the same rule: accounts win when they exist, otherwise
  -- whatever is already on the profile stands.
  SELECT COUNT(*), COALESCE(SUM(balance), 0)
  INTO v_savings_rows, v_savings_accounts
  FROM accounts
  WHERE user_id = p_user_id AND type = 'savings' AND is_active = true;

  IF v_savings_rows > 0 THEN
    v_total_savings := v_savings_accounts;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(balance), 0)
  INTO v_investment_rows, v_investment_accounts
  FROM accounts
  WHERE user_id = p_user_id AND type = 'investment' AND is_active = true;

  IF v_investment_rows > 0 THEN
    v_total_investments := v_investment_accounts;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(balance), 0)
  INTO v_cash_rows, v_cash_accounts
  FROM accounts
  WHERE user_id = p_user_id AND type IN ('cash', 'current') AND is_active = true;

  IF v_cash_rows > 0 THEN
    v_total_cash := v_cash_accounts;
  END IF;

  -- Month boundary: save the current score as "previous" on the first sync of a month.
  IF v_previous_score_month IS NULL
     OR v_previous_score_month < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE financial_profiles SET
      previous_financial_health_score = v_current_score,
      previous_score_month = CURRENT_DATE
    WHERE id = v_profile_id;
  END IF;

  -- Savings rate.
  IF v_monthly_income > 0 THEN
    v_savings_rate := ROUND(((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100);
  ELSE
    v_savings_rate := 0;
  END IF;

  -- Liabilities: the single total recorded at onboarding wins, otherwise the six
  -- legacy per category columns. Without this, someone who owes money reads as
  -- debt free and picks up the full 25% debt points.
  v_legacy_liabilities := v_credit_card_debt + v_personal_loan_debt + v_student_loan_debt
    + v_mortgage_debt + v_car_loan_debt + v_other_debts;
  v_total_liabilities := COALESCE(v_total_debt_column, v_legacy_liabilities);

  -- Asset components are counted once each. `total_savings` is deliberately NOT
  -- included: onboarding writes it as the sum of cash, investments, property and
  -- business, so adding it alongside those four would count most of the balance
  -- sheet twice. This mirrors calculateNetWorth and totalAssets in
  -- src/services/onboarding.service.ts, and the two must stay in step.
  v_total_assets := v_total_cash + v_total_investments
    + v_total_retirement + v_total_property + v_total_business + v_total_other_assets;

  v_net_worth := v_total_assets - v_total_liabilities;

  IF v_total_assets > 0 THEN
    v_debt_ratio := ROUND((v_total_liabilities / v_total_assets) * 100) / 100;
  ELSE
    v_debt_ratio := 0;
  END IF;

  IF v_monthly_expenses > 0 THEN
    v_ef_months := ROUND((v_total_cash / v_monthly_expenses) * 10) / 10;
  ELSE
    v_ef_months := 0;
  END IF;

  v_fhs := ROUND(LEAST(
    LEAST(v_savings_rate, 100) * 0.3
    + GREATEST(0, (1 - v_debt_ratio) * 100) * 0.25
    + LEAST(v_ef_months * 10, 100) * 0.25
    + v_risk_score * 0.2
  , 100));

  UPDATE financial_profiles SET
    monthly_income = v_monthly_income,
    monthly_expenses = v_monthly_expenses,
    total_savings = v_total_savings,
    total_investments = v_total_investments,
    savings_rate = v_savings_rate,
    net_worth = v_net_worth,
    debt_ratio = v_debt_ratio,
    emergency_fund_months = v_ef_months,
    financial_health_score = v_fhs,
    updated_at = now()
  WHERE id = v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;