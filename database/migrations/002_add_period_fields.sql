-- Migration: Add period tracking fields to payroll_runs table
-- Run this after 001_initial_schema.sql

USE payroll_bowc;

-- Add period tracking fields
ALTER TABLE payroll_runs 
    ADD COLUMN period_name VARCHAR(255) AFTER run_date,
    ADD COLUMN period_start_date DATE AFTER period_name,
    ADD COLUMN period_end_date DATE AFTER period_start_date,
    ADD COLUMN period_number INT AFTER period_end_date,
    ADD COLUMN year INT AFTER period_number,
    ADD COLUMN quarter INT AFTER year,
    ADD COLUMN notes TEXT AFTER quarter,
    ADD COLUMN total_expenses DECIMAL(10,2) AFTER insurance_spend,
    ADD COLUMN net_profit DECIMAL(10,2) AFTER total_expenses,
    ADD COLUMN profit_margin DECIMAL(5,2) AFTER net_profit;

-- Add indexes for performance
CREATE INDEX idx_year_quarter ON payroll_runs(year, quarter);
CREATE INDEX idx_period_name ON payroll_runs(period_name);
CREATE INDEX idx_period_dates ON payroll_runs(period_start_date, period_end_date);

-- Update existing records (if any) to have default values
UPDATE payroll_runs 
SET 
    period_name = CONCAT('Payroll - ', DATE_FORMAT(run_date, '%M %d, %Y')),
    period_start_date = run_date,
    period_end_date = run_date,
    year = YEAR(run_date),
    quarter = QUARTER(run_date),
    total_expenses = total_payroll + marketing_spend + insurance_spend,
    net_profit = total_revenue - (total_payroll + marketing_spend + insurance_spend),
    profit_margin = CASE 
        WHEN total_revenue > 0 
        THEN ((total_revenue - (total_payroll + marketing_spend + insurance_spend)) / total_revenue * 100)
        ELSE 0 
    END
WHERE period_name IS NULL;

