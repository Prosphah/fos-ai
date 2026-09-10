-- Track previous month's financial health score so the UI can show "+N this month"

ALTER TABLE financial_profiles
  ADD COLUMN IF NOT EXISTS previous_financial_health_score NUMERIC,
  ADD COLUMN IF NOT EXISTS previous_score_month DATE;

CREATE OR REPLACE FUNCTION sync_financial_profile(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_monthly_income NUMERIC;
  v_monthly_expenses NUMERIC;
  v_total_savings NUMERIC;
  v_total_investments NUMERIC;
  v_total_cash NUMERIC;
  v_profile_id UUID;
  v_net_worth NUMERIC;
  v_savings_rate NUMERIC;
  v_total_other_assets NUMERIC;
  v_total_retirement NUMERIC;
  v_total_property NUMERIC;
  v_total_business NUMERIC;
  v_credit_card_debt NUMERIC;
  v_personal_loan_debt NUMERIC;
  v_student_loan_debt NUMERIC;
  v_mortgage_debt NUMERIC;
  v_car_loan_debt NUMERIC;
  v_other_debts NUMERIC;
  v_risk_score NUMERIC;
  v_total_assets NUMERIC;
  v_total_liabilities NUMERIC;
  v_debt_ratio NUMERIC;
  v_ef_months NUMERIC;
  v_fhs NUMERIC;
  v_current_score NUMERIC;
  v_previous_score_month DATE;
BEGIN
  -- Aggregate last 30 days income
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_income
  FROM transactions
  WHERE user_id = p_user_id AND type = 'income'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Aggregate last 30 days expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_expenses
  FROM transactions
  WHERE user_id = p_user_id AND type = 'expense'
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Aggregate account balances by type
  SELECT COALESCE(SUM(balance), 0) INTO v_total_savings
  FROM accounts WHERE user_id = p_user_id AND type = 'savings' AND is_active = true;

  SELECT COALESCE(SUM(balance), 0) INTO v_total_investments
  FROM accounts WHERE user_id = p_user_id AND type = 'investment' AND is_active = true;

  SELECT COALESCE(SUM(balance), 0) INTO v_total_cash
  FROM accounts WHERE user_id = p_user_id AND type IN ('cash', 'current') AND is_active = true;

  -- Get existing profile (static fields + risk_score + score tracking)
  SELECT
    id,
    COALESCE(total_retirement_accounts, 0),
    COALESCE(total_property_value, 0),
    COALESCE(total_business_ownership, 0),
    COALESCE(total_other_assets, 0),
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
    v_total_retirement,
    v_total_property,
    v_total_business,
    v_total_other_assets,
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

  IF v_profile_id IS NOT NULL THEN
    -- Month-boundary check: save current score as "previous" on first sync of a new month
    IF v_previous_score_month IS NULL OR v_previous_score_month < DATE_TRUNC('month', CURRENT_DATE) THEN
      UPDATE financial_profiles SET
        previous_financial_health_score = v_current_score,
        previous_score_month = CURRENT_DATE
      WHERE id = v_profile_id;
    END IF;

    -- Savings rate
    IF v_monthly_income > 0 THEN
      v_savings_rate := ROUND(((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100);
    ELSE
      v_savings_rate := 0;
    END IF;

    -- Net worth
    v_net_worth := (v_total_savings + v_total_investments) - (
      v_credit_card_debt + v_personal_loan_debt + v_student_loan_debt
      + v_mortgage_debt + v_car_loan_debt + v_other_debts
    );

    -- Debt ratio
    v_total_assets := v_total_cash + v_total_savings + v_total_investments
      + v_total_retirement + v_total_property + v_total_business + v_total_other_assets;
    v_total_liabilities := v_credit_card_debt + v_personal_loan_debt + v_student_loan_debt
      + v_mortgage_debt + v_car_loan_debt + v_other_debts;

    IF v_total_assets > 0 THEN
      v_debt_ratio := ROUND((v_total_liabilities / v_total_assets) * 100) / 100;
    ELSE
      v_debt_ratio := 0;
    END IF;

    -- Emergency fund months
    IF v_monthly_expenses > 0 THEN
      v_ef_months := ROUND((v_total_cash / v_monthly_expenses) * 10) / 10;
    ELSE
      v_ef_months := 0;
    END IF;

    -- Financial health score
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
