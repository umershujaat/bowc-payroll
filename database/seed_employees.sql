-- Seed default employees into the database
USE payroll_bowc;

-- Insert default employees (ignore duplicates if they already exist)
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

-- Verify employees were inserted
SELECT * FROM employees ORDER BY name;

