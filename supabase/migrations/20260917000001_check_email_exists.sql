-- Remove check_email_exists to avoid email enumeration vulnerability
DROP FUNCTION IF EXISTS public.check_email_exists(TEXT);
