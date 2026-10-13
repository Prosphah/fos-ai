-- Fixes: "Current" account type crashes on insert
-- Found while fixing the currency bug (feedback 2026-10-09).
--
-- src/types/database.ts:106 and the Accounts page type picker both offer
-- "current", and createAccountSchema accepts it. But the account_type enum
-- was created without that label:
--   CREATE TYPE account_type AS ENUM ('cash','savings','investment','credit','other');
--
-- So any user who tapped "Current" got an invalid input value for enum
-- account_type and the account silently failed to save.
--
-- Adding the value is non-destructive: existing rows are untouched.

ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'current';

-- NOTE: on older PostgreSQL, ALTER TYPE ... ADD VALUE cannot run inside an
-- explicit transaction block. If the SQL Editor wraps this and errors with
-- "unsafe use of new value", run it with autocommit on (no BEGIN/COMMIT).
--
-- Verify:
--   SELECT unnest(enum_range(NULL::account_type));