const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('../config/database');
const { processPayrollFile } = require('../controllers/payrollController');

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Process payroll file
router.post('/process', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Get employees from database
        const [employees] = await db.execute('SELECT name, level FROM employees ORDER BY name');
        
        if (employees.length === 0) {
            return res.status(400).json({ error: 'Please add at least one employee' });
        }
        
        // Get levels from levels table or fallback to configurations
        let levelsObj = {};
        try {
            const [levelRows] = await db.execute('SELECT level_code, percentage FROM levels');
            levelRows.forEach(row => {
                levelsObj[row.level_code] = parseFloat(row.percentage);
            });
        } catch (error) {
            // Fallback to configurations if levels table doesn't exist
            const [configRows] = await db.execute('SELECT config_key, config_value FROM configurations WHERE config_key LIKE "level_%"');
            const config = {};
            configRows.forEach(row => {
                config[row.config_key] = row.config_value;
            });
            levelsObj = {
                'L1': parseFloat(config.level_L1 || '0.20'),
                'L2': parseFloat(config.level_L2 || '0.25'),
                'L3': parseFloat(config.level_L3 || '0.27'),
                'L4': parseFloat(config.level_L4 || '0.30')
            };
        }
        
        // Get trainee wage
        let traineeWage = '20.00';
        try {
            const [traineeRows] = await db.execute('SELECT hourly_wage FROM levels WHERE is_trainee = TRUE LIMIT 1');
            if (traineeRows.length > 0 && traineeRows[0].hourly_wage) {
                traineeWage = traineeRows[0].hourly_wage.toString();
            }
        } catch (error) {
            // Fallback to configurations
            const [configRows] = await db.execute('SELECT config_value FROM configurations WHERE config_key = "trainee_wage"');
            if (configRows.length > 0) {
                traineeWage = configRows[0].config_value;
            }
        }
        
        const config = {
            trainee_wage: traineeWage,
            margin_error: '0.25',
            decimal_points: '2'
        };
        
        // Get other config values
        try {
            const [configRows] = await db.execute('SELECT config_key, config_value FROM configurations WHERE config_key IN ("margin_error", "decimal_points")');
            configRows.forEach(row => {
                config[row.config_key] = row.config_value;
            });
        } catch (error) {
            // Use defaults
        }
        
        // Process the file
        const result = await processPayrollFile(
            req.file.buffer,
            req.file.originalname,
            employees,
            levelsObj,
            {
                trainee_wage: traineeWage,
                margin_error: config.margin_error || '0.25',
                decimal_points: config.decimal_points || '2',
                marketing_spend: req.body.marketing_spend || '0',
                insurance_spend: req.body.insurance_spend || '0',
                technology_spend: req.body.technology_spend || '0',
                office_staff_spend: req.body.office_staff_spend || '0'
            }
        );
        
        res.json(result);
    } catch (error) {
        console.error('Error processing payroll:', error);
        res.status(500).json({ error: error.message || 'Failed to process payroll file' });
    }
});

// Save processed payroll to database
router.post('/save', async (req, res) => {
    try {
        const { 
            results, 
            employeeTotals, 
            businessSummary, 
            runDate,
            periodName,
            periodStartDate,
            periodEndDate,
            notes
        } = req.body;
        
        if (!results || !employeeTotals || !businessSummary) {
            return res.status(400).json({ error: 'Missing required data' });
        }
        
        if (!periodName) {
            return res.status(400).json({ error: 'Period name is required' });
        }
        
        // Calculate derived fields
        const runDateValue = runDate || new Date().toISOString().split('T')[0];
        const startDate = periodStartDate || runDateValue;
        const endDate = periodEndDate || runDateValue;
        const year = new Date(startDate).getFullYear();
        const quarter = Math.floor((new Date(startDate).getMonth() + 3) / 3);
        
        // Calculate totals
        const totalExpenses = businessSummary.totalPayroll + businessSummary.marketingSpend + businessSummary.insuranceSpend;
        const netProfit = businessSummary.totalRevenue - totalExpenses;
        const profitMargin = businessSummary.totalRevenue > 0 
            ? ((netProfit / businessSummary.totalRevenue) * 100).toFixed(2)
            : 0;
        
        // Get next period number for this year
        const [periodCount] = await db.execute(
            'SELECT COALESCE(MAX(period_number), 0) + 1 as next_period FROM payroll_runs WHERE year = ?',
            [year]
        );
        const periodNumber = periodCount[0].next_period;
        
        // Start transaction
        await db.execute('START TRANSACTION');
        
        try {
            // Insert payroll run with period information
            const [runResult] = await db.execute(
                `INSERT INTO payroll_runs 
                (run_date, period_name, period_start_date, period_end_date, period_number, year, quarter, 
                 marketing_spend, insurance_spend, total_revenue, total_payroll, total_expenses, 
                 net_profit, profit_margin, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    runDateValue,
                    periodName,
                    startDate,
                    endDate,
                    periodNumber,
                    year,
                    quarter,
                    businessSummary.marketingSpend,
                    businessSummary.insuranceSpend,
                    businessSummary.totalRevenue,
                    businessSummary.totalPayroll,
                    totalExpenses,
                    netProfit,
                    profitMargin,
                    notes || null
                ]
            );
            
            const payrollRunId = runResult.insertId;
            
            // Insert payroll results
            for (const result of results) {
                await db.execute(
                    `INSERT INTO payroll_results 
                    (payroll_run_id, job_number, job_status, address, job_amount, tip_amount, completed_date, result_data) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        payrollRunId,
                        result.jobNumber,
                        result.jobStatus,
                        result.address,
                        result.jobAmount,
                        result.tipAmount,
                        result.completedDate,
                        JSON.stringify({
                            hours: result.hours,
                            wages: result.wages,
                            tips: result.tips
                        })
                    ]
                );
            }
            
            // Insert employee totals
            for (const [employeeName, totals] of Object.entries(employeeTotals)) {
                await db.execute(
                    `INSERT INTO employee_totals 
                    (payroll_run_id, employee_name, total_hours, total_wages, total_tips, avg_hourly_rate) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        payrollRunId,
                        employeeName,
                        totals.totalHours,
                        totals.totalWages,
                        totals.totalTips,
                        totals.avgHourlyRate
                    ]
                );
            }
            
            await db.execute('COMMIT');
            
            res.json({ 
                message: 'Payroll saved successfully',
                payrollRunId 
            });
        } catch (error) {
            await db.execute('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error saving payroll:', error);
        res.status(500).json({ error: 'Failed to save payroll' });
    }
});

module.exports = router;

