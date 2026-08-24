-- Fix savings rate: use category-based calculation instead of income-expense ratio
-- Savings rate = (sum of |amount| from Savings/Investment category transactions) / income * 100

CREATE OR REPLACE FUNCTION sync_financial_profile(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_monthly_income NUMERIC;
  v_monthly_expenses NUMERIC;
  v_total_savings NUMERIC;
  v_total_investments NUMERIC;
  v_total_debt NUMERIC;
  v_profile_id UUID;
  v_net_worth NUMERIC;
  v_savings_rate NUMERIC;
  v_category_savings NUMERIC;
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

  -- Aggregate savings account balances
  SELECT COALESCE(SUM(balance), 0) INTO v_total_savings
  FROM accounts WHERE user_id = p_user_id AND type = 'savings' AND is_active = true;

  -- Aggregate investment account balances
  SELECT COALESCE(SUM(balance), 0) INTO v_total_investments
  FROM accounts WHERE user_id = p_user_id AND type = 'investment' AND is_active = true;

  -- Get existing profile
  SELECT id INTO v_profile_id FROM financial_profiles WHERE user_id = p_user_id;

  IF v_profile_id IS NOT NULL THEN
    -- Sum |amount| of transactions with Savings or Investment category
    SELECT COALESCE(SUM(ABS(t.amount)), 0) INTO v_category_savings
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = p_user_id
      AND c.name IN ('Savings', 'Investment')
      AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Savings rate = category savings / income
    IF v_monthly_income > 0 THEN
      v_savings_rate := ROUND((v_category_savings / v_monthly_income) * 100);
    ELSE
      v_savings_rate := 0;
    END IF;

    v_net_worth := (v_total_savings + v_total_investments) - COALESCE(
      (SELECT total_debt FROM financial_profiles WHERE id = v_profile_id), 0
    );

    UPDATE financial_profiles SET
      monthly_income = v_monthly_income,
      monthly_expenses = v_monthly_expenses,
      total_savings = v_total_savings,
      total_investments = v_total_investments,
      savings_rate = v_savings_rate,
      net_worth = v_net_worth,
      updated_at = now()
    WHERE id = v_profile_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
