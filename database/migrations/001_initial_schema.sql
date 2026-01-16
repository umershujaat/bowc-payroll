-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS payroll_bowc;
USE payroll_bowc;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    level ENUM('L1', 'L2', 'L3', 'L4') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_level (level)
);

-- Configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
);

-- Payroll runs table
CREATE TABLE IF NOT EXISTS payroll_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    run_date DATE NOT NULL,
    marketing_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    insurance_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_payroll DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_run_date (run_date),
    INDEX idx_created_at (created_at)
);

-- Payroll results table (stores individual job results)
CREATE TABLE IF NOT EXISTS payroll_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id INT NOT NULL,
    job_number VARCHAR(100),
    job_status VARCHAR(100),
    address TEXT,
    job_amount DECIMAL(10,2) DEFAULT 0.00,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    completed_date DATE,
    result_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_job_number (job_number)
);

-- Employee totals table (summary per employee per payroll run)
CREATE TABLE IF NOT EXISTS employee_totals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    total_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_wages DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_tips DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    avg_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    INDEX idx_payroll_run_id (payroll_run_id),
    INDEX idx_employee_name (employee_name)
);

-- Insert default configuration values
INSERT INTO configurations (config_key, config_value) VALUES
    ('level_L1', '0.20'),
    ('level_L2', '0.25'),
    ('level_L3', '0.27'),
    ('level_L4', '0.30'),
    ('trainee_wage', '20.00'),
    ('margin_error', '0.25'),
    ('decimal_points', '2')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- Insert default employees
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

