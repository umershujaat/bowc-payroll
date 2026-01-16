-- Migration: Create levels table for better level management
-- Run this after 001_initial_schema.sql

USE payroll_bowc;

-- Create levels table
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_code VARCHAR(10) NOT NULL UNIQUE,
    level_name VARCHAR(100) NOT NULL,
    type ENUM('Trainee', 'Junior Technician', 'Senior Technician', 'Crew Lead') NOT NULL DEFAULT 'Junior Technician',
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    hourly_wage DECIMAL(10,2) DEFAULT NULL,
    is_trainee BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_level_code (level_code),
    INDEX idx_type (type)
);

-- Migrate existing configuration data to levels table
INSERT INTO levels (level_code, level_name, type, percentage, hourly_wage, is_trainee) VALUES
    ('L1', 'Trainee', 'Trainee', 0.20, 20.00, TRUE),
    ('L2', 'Level 2', 'Junior Technician', 0.25, NULL, FALSE),
    ('L3', 'Level 3', 'Senior Technician', 0.27, NULL, FALSE),
    ('L4', 'Level 4', 'Crew Lead', 0.30, NULL, FALSE)
ON DUPLICATE KEY UPDATE 
    percentage = VALUES(percentage),
    type = VALUES(type),
    is_trainee = VALUES(is_trainee);

