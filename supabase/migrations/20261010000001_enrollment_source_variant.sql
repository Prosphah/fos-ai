-- A/B attribution for the Money Mastery Code storefront
-- Records which storefront variant produced each paid purchase, so
-- conversion can be compared between the control page and /money-mastery-code/v2.
--
-- Existing rows stay null: they were all sold before the test existed and
-- attributing them to a variant would invent data.

alter table enrollments add column if not exists source_variant text;

create index if not exists enrollments_source_variant_idx
  on enrollments (source_variant)
  where source_variant is not null;

-- Reading the test:
--
--   select source_variant,
--          count(*) filter (where status in ('paid', 'active')) as paid,
--          count(*) as started
--     from enrollments
--    group by source_variant;
--
-- 'control' is written into Paystack metadata by the checkout route for
-- traffic that arrives without a variant flag. The webhook whitelists a, b
-- and c before storing, so 'control' is discarded and recorded as null rather
-- than being kept as a fourth value that looks comparable to the others.