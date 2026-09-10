-- Update income category colors to be more diverse
-- Previously all income categories were the same green (#22C55E)
UPDATE categories SET color = '#946103' WHERE name = 'Salary' AND is_system = true;
UPDATE categories SET color = '#695AFF' WHERE name = 'Freelance' AND is_system = true;
UPDATE categories SET color = '#3B82F6' WHERE name = 'Investment Returns' AND is_system = true;
UPDATE categories SET color = '#F59E0B' WHERE name = 'Other Income' AND is_system = true;
