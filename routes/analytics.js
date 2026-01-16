const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get quarterly summary
router.get('/quarterly', async (req, res) => {
    try {
        const { year, quarter } = req.query;
        
        if (!year || !quarter) {
            return res.status(400).json({ error: 'Year and quarter are required' });
        }
        
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as payroll_count,
                SUM(total_revenue) as total_revenue,
                SUM(total_payroll) as total_payroll,
                SUM(marketing_spend) as total_marketing,
                SUM(insurance_spend) as total_insurance,
                SUM(total_expenses) as total_expenses,
                SUM(net_profit) as total_profit,
                AVG(profit_margin) as avg_margin
             FROM payroll_runs
             WHERE year = ? AND quarter = ?
             GROUP BY year, quarter`,
            [year, quarter]
        );
        
        // Get employee totals for the quarter
        const [employeeTotals] = await db.execute(
            `SELECT 
                et.employee_name,
                SUM(et.total_hours) as total_hours,
                SUM(et.total_wages) as total_wages,
                SUM(et.total_tips) as total_tips,
                AVG(et.avg_hourly_rate) as avg_hourly_rate
             FROM employee_totals et
             INNER JOIN payroll_runs pr ON et.payroll_run_id = pr.id
             WHERE pr.year = ? AND pr.quarter = ?
             GROUP BY et.employee_name
             ORDER BY et.employee_name`,
            [year, quarter]
        );
        
        res.json({
            year: parseInt(year),
            quarter: parseInt(quarter),
            summary: rows[0] || {},
            employeeTotals: employeeTotals
        });
    } catch (error) {
        console.error('Error fetching quarterly analytics:', error);
        res.status(500).json({ error: 'Failed to fetch quarterly analytics' });
    }
});

// Get annual summary
router.get('/annual', async (req, res) => {
    try {
        const { year } = req.query;
        
        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }
        
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as payroll_count,
                SUM(total_revenue) as total_revenue,
                SUM(total_payroll) as total_payroll,
                SUM(marketing_spend) as total_marketing,
                SUM(insurance_spend) as total_insurance,
                SUM(total_expenses) as total_expenses,
                SUM(net_profit) as total_profit,
                AVG(profit_margin) as avg_margin
             FROM payroll_runs
             WHERE year = ?
             GROUP BY year`,
            [year]
        );
        
        // Get quarterly breakdown
        const [quarterly] = await db.execute(
            `SELECT 
                quarter,
                COUNT(*) as payroll_count,
                SUM(total_revenue) as total_revenue,
                SUM(total_payroll) as total_payroll,
                SUM(net_profit) as total_profit,
                AVG(profit_margin) as avg_margin
             FROM payroll_runs
             WHERE year = ?
             GROUP BY quarter
             ORDER BY quarter`,
            [year]
        );
        
        // Get employee totals for the year
        const [employeeTotals] = await db.execute(
            `SELECT 
                et.employee_name,
                SUM(et.total_hours) as total_hours,
                SUM(et.total_wages) as total_wages,
                SUM(et.total_tips) as total_tips,
                AVG(et.avg_hourly_rate) as avg_hourly_rate
             FROM employee_totals et
             INNER JOIN payroll_runs pr ON et.payroll_run_id = pr.id
             WHERE pr.year = ?
             GROUP BY et.employee_name
             ORDER BY et.employee_name`,
            [year]
        );
        
        res.json({
            year: parseInt(year),
            summary: rows[0] || {},
            quarterly: quarterly,
            employeeTotals: employeeTotals
        });
    } catch (error) {
        console.error('Error fetching annual analytics:', error);
        res.status(500).json({ error: 'Failed to fetch annual analytics' });
    }
});

// Get employee performance over time
router.get('/employee/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT 
                pr.period_name,
                pr.period_start_date,
                pr.period_end_date,
                pr.year,
                pr.quarter,
                et.total_hours,
                et.total_wages,
                et.total_tips,
                et.avg_hourly_rate,
                (et.total_wages + et.total_tips) as total_earnings
             FROM employee_totals et
             INNER JOIN payroll_runs pr ON et.payroll_run_id = pr.id
             WHERE et.employee_name = ?
        `;
        const params = [name];
        
        if (startDate) {
            query += ` AND pr.period_start_date >= ?`;
            params.push(startDate);
        }
        
        if (endDate) {
            query += ` AND pr.period_end_date <= ?`;
            params.push(endDate);
        }
        
        query += ` ORDER BY pr.period_start_date DESC`;
        
        const [rows] = await db.execute(query, params);
        
        // Calculate totals
        const totals = rows.reduce((acc, row) => ({
            totalHours: acc.totalHours + parseFloat(row.total_hours || 0),
            totalWages: acc.totalWages + parseFloat(row.total_wages || 0),
            totalTips: acc.totalTips + parseFloat(row.total_tips || 0),
            totalEarnings: acc.totalEarnings + parseFloat(row.total_earnings || 0)
        }), { totalHours: 0, totalWages: 0, totalTips: 0, totalEarnings: 0 });
        
        totals.avgHourlyRate = totals.totalHours > 0 
            ? totals.totalWages / totals.totalHours 
            : 0;
        
        res.json({
            employeeName: name,
            periods: rows,
            totals: totals
        });
    } catch (error) {
        console.error('Error fetching employee analytics:', error);
        res.status(500).json({ error: 'Failed to fetch employee analytics' });
    }
});

module.exports = router;

