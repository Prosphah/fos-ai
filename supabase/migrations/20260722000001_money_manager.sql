-- Money Manager Migration
-- Creates: enums, tables, indexes, seed data, and RPC functions

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE category_type AS ENUM ('income', 'expense', 'both');
CREATE TYPE account_type AS ENUM ('cash', 'savings', 'investment', 'credit', 'other');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE savings_goal_status AS ENUM ('active', 'completed', 'paused');

-- =============================================
-- TABLES
-- =============================================

-- User settings: notification prefs + budget config
CREATE TABLE user_settings (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency         TEXT NOT NULL DEFAULT 'USD',
  monthly_budget   NUMERIC(12,2) NOT NULL DEFAULT 0,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time    TIME NOT NULL DEFAULT '19:00',
  reminder_days    INT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories: system defaults + user custom
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT,
  color      TEXT,
  type       category_type NOT NULL DEFAULT 'expense',
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Accounts: cash, savings, investment, credit
CREATE TABLE accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  type                 account_type NOT NULL,
  balance              NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'USD',
  is_active            BOOLEAN NOT NULL DEFAULT true,
  institution          TEXT,
  account_number_last4 TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions: single source of truth for daily cash flow
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id),
  account_id        UUID REFERENCES accounts(id),
  transfer_to_id    UUID REFERENCES accounts(id),
  type              transaction_type NOT NULL,
  amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description       TEXT NOT NULL,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  tags              TEXT[],
  is_recurring      BOOLEAN NOT NULL DEFAULT false,
  recurring_config  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_id);

-- Budgets: total + per-category monthly limits
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  month       INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

-- Savings goals: track progress toward specific targets
CREATE TABLE savings_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id     UUID REFERENCES accounts(id),
  name           TEXT NOT NULL,
  target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date    DATE,
  status         savings_goal_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- user_settings: users can only access their own
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- categories: system categories readable by all, custom by owner only
CREATE POLICY "Anyone can view system categories"
  ON categories FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own custom categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- accounts: users can only access their own
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- transactions: users can only access their own
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- budgets: users can only access their own
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- savings_goals: users can only access their own
CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- SEED SYSTEM CATEGORIES
-- =============================================

INSERT INTO categories (user_id, name, icon, color, type, is_system) VALUES
  (NULL, 'Salary',            'briefcase',      '#059669', 'income',   true),
  (NULL, 'Freelance',         'code',           '#695AFF', 'income',   true),
  (NULL, 'Investment Returns','trending-up',    '#3B82F6', 'income',   true),
  (NULL, 'Other Income',      'plus-circle',    '#F59E0B', 'income',   true),
  (NULL, 'Food & Dining',     'utensils',       '#EF4444', 'expense',  true),
  (NULL, 'Transportation',    'car',            '#F97316', 'expense',  true),
  (NULL, 'Housing',           'home',           '#695AFF', 'expense',  true),
  (NULL, 'Utilities',         'zap',            '#EAB308', 'expense',  true),
  (NULL, 'Entertainment',     'film',           '#EC4899', 'expense',  true),
  (NULL, 'Healthcare',        'heart',          '#14B8A6', 'expense',  true),
  (NULL, 'Education',         'book-open',      '#3B82F6', 'expense',  true),
  (NULL, 'Shopping',          'shopping-bag',   '#F59E0B', 'expense',  true),
  (NULL, 'Insurance',         'shield',         '#6366F1', 'expense',  true),
  (NULL, 'Debt Repayment',    'credit-card',    '#EF4444', 'expense',  true),
  (NULL, 'Gift',              'gift',           '#D946EF', 'expense',  true),
  (NULL, 'Savings',           'piggy-bank',     '#c5227c', 'both',     true),
  (NULL, 'Investment',        'bar-chart',      '#3B82F6', 'both',     true),
  (NULL, 'Other Expense',     'more-horizontal', '#6B7280', 'expense',  true);

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Record a transaction + update account balance atomically
CREATE OR REPLACE FUNCTION record_transaction(
  p_user_id UUID,
  p_category_id UUID,
  p_account_id UUID,
  p_type transaction_type,
  p_amount NUMERIC,
  p_description TEXT,
  p_date DATE,
  p_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_transfer_to_id UUID DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT false,
  p_recurring_config JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
  v_delta NUMERIC;
BEGIN
  -- Validate transfer requires both accounts
  IF p_type = 'transfer' AND (p_account_id IS NULL OR p_transfer_to_id IS NULL) THEN
    RAISE EXCEPTION 'Transfers require both source and destination accounts';
  END IF;

  -- Calculate balance delta for source account
  v_delta := CASE p_type
    WHEN 'income' THEN p_amount
    WHEN 'expense' THEN -p_amount
    WHEN 'transfer' THEN -p_amount
  END;

  -- Insert transaction
  INSERT INTO transactions (user_id, category_id, account_id, transfer_to_id, type, amount, description, transaction_date, notes, tags, is_recurring, recurring_config)
  VALUES (p_user_id, p_category_id, p_account_id, p_transfer_to_id, p_type, p_amount, p_description, p_date, p_notes, p_tags, p_is_recurring, p_recurring_config)
  RETURNING id INTO v_tx_id;

  -- Update source account balance
  IF p_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + v_delta, updated_at = now() WHERE id = p_account_id;
  END IF;

  -- Update destination account for transfers
  IF p_type = 'transfer' AND p_transfer_to_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + p_amount, updated_at = now() WHERE id = p_transfer_to_id;
  END IF;

  -- Sync aggregated metrics to financial_profiles
  PERFORM sync_financial_profile(p_user_id);

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete a transaction and reverse its balance effect
CREATE OR REPLACE FUNCTION delete_transaction(
  p_tx_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_tx transactions%ROWTYPE;
  v_delta NUMERIC;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_tx_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Reverse balance effect
  IF v_tx.account_id IS NOT NULL THEN
    v_delta := CASE v_tx.type
      WHEN 'income' THEN -v_tx.amount
      WHEN 'expense' THEN v_tx.amount
      WHEN 'transfer' THEN v_tx.amount
    END;
    UPDATE accounts SET balance = balance + v_delta, updated_at = now() WHERE id = v_tx.account_id;
  END IF;

  IF v_tx.type = 'transfer' AND v_tx.transfer_to_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - v_tx.amount, updated_at = now() WHERE id = v_tx.transfer_to_id;
  END IF;

  DELETE FROM transactions WHERE id = p_tx_id;

  PERFORM sync_financial_profile(p_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record or update a budget entry
CREATE OR REPLACE FUNCTION upsert_budget(
  p_user_id UUID,
  p_category_id UUID,
  p_month INT,
  p_year INT,
  p_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_budget_id UUID;
BEGIN
  INSERT INTO budgets (user_id, category_id, month, year, amount)
  VALUES (p_user_id, p_category_id, p_month, p_year, p_amount)
  ON CONFLICT (user_id, category_id, month, year)
  DO UPDATE SET amount = p_amount, updated_at = now()
  RETURNING id INTO v_budget_id;

  RETURN v_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sync aggregated metrics from transactions + accounts to financial_profiles
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
    -- Calculate derived metrics
    IF v_monthly_income > 0 THEN
      v_savings_rate := ROUND(((v_monthly_income - v_monthly_expenses) / v_monthly_income) * 100);
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

-- Create or update user settings
CREATE OR REPLACE FUNCTION upsert_user_settings(
  p_user_id UUID,
  p_currency TEXT DEFAULT NULL,
  p_monthly_budget NUMERIC DEFAULT NULL,
  p_reminder_enabled BOOLEAN DEFAULT NULL,
  p_reminder_time TIME DEFAULT NULL,
  p_reminder_days INT[] DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_settings (user_id, currency, monthly_budget, reminder_enabled, reminder_time, reminder_days)
  VALUES (p_user_id, p_currency, p_monthly_budget, p_reminder_enabled, p_reminder_time, p_reminder_days)
  ON CONFLICT (user_id) DO UPDATE SET
    currency = COALESCE(p_currency, user_settings.currency),
    monthly_budget = COALESCE(p_monthly_budget, user_settings.monthly_budget),
    reminder_enabled = COALESCE(p_reminder_enabled, user_settings.reminder_enabled),
    reminder_time = COALESCE(p_reminder_time, user_settings.reminder_time),
    reminder_days = COALESCE(p_reminder_days, user_settings.reminder_days),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
