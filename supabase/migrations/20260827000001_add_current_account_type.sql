-- Add 'current' to the account_type enum
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'current';