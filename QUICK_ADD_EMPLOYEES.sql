-- Quick SQL to add all employees
-- Copy and paste this entire block into MySQL terminal

USE payroll_bowc;

INSERT INTO employees (name, level) VALUES
    ('Henry Rios', 'L4'),
    ('Danny Brown', 'L4'),
    ('Kevin Cooper', 'L4'),
    ('Yong Lee', 'L4'),
    ('David Mestas', 'L3'),
    ('Rick Fox', 'L3'),
    ('Paul Pate', 'L3'),
    ('Joshua Ryan', 'L1')
ON DUPLICATE KEY UPDATE level = VALUES(level);

-- Verify they were added
SELECT * FROM employees ORDER BY name;

