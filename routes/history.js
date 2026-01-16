const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get payroll history (list of all runs) with filters
router.get('/', async (req, res) => {
    try {
        const { search, year, quarter, startDate, endDate } = req.query;
        
        let query = `
            SELECT pr.*, 
             COUNT(pr2.id) as job_count
             FROM payroll_runs pr
             LEFT JOIN payroll_results pr2 ON pr.id = pr2.payroll_run_id
             WHERE 1=1
        `;
        const params = [];
        
        // Search by period name
        if (search) {
            query += ` AND pr.period_name LIKE ?`;
            params.push(`%${search}%`);
        }
        
        // Filter by year
        if (year) {
            query += ` AND pr.year = ?`;
            params.push(year);
        }
        
        // Filter by quarter
        if (quarter) {
            query += ` AND pr.quarter = ?`;
            params.push(quarter);
        }
        
        // Filter by date range
        if (startDate) {
            query += ` AND pr.period_start_date >= ?`;
            params.push(startDate);
        }
        
        if (endDate) {
            query += ` AND pr.period_end_date <= ?`;
            params.push(endDate);
        }
        
        query += ` GROUP BY pr.id ORDER BY pr.created_at DESC`;
        
        const [rows] = await db.execute(query, params);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching payroll history:', error);
        res.status(500).json({ error: 'Failed to fetch payroll history' });
    }
});

// Search payrolls by period name
router.get('/search', async (req, res) => {
    try {
        const { query: searchQuery } = req.query;
        
        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const [rows] = await db.execute(
            `SELECT pr.*, 
             COUNT(pr2.id) as job_count
             FROM payroll_runs pr
             LEFT JOIN payroll_results pr2 ON pr.id = pr2.payroll_run_id
             WHERE pr.period_name LIKE ?
             GROUP BY pr.id
             ORDER BY pr.created_at DESC`,
            [`%${searchQuery}%`]
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error searching payroll history:', error);
        res.status(500).json({ error: 'Failed to search payroll history' });
    }
});

// Get specific payroll run details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get payroll run
        const [runs] = await db.execute(
            'SELECT * FROM payroll_runs WHERE id = ?',
            [id]
        );
        
        if (runs.length === 0) {
            return res.status(404).json({ error: 'Payroll run not found' });
        }
        
        // Get payroll results
        const [results] = await db.execute(
            'SELECT * FROM payroll_results WHERE payroll_run_id = ? ORDER BY id',
            [id]
        );
        
        // Get employee totals
        const [totals] = await db.execute(
            'SELECT * FROM employee_totals WHERE payroll_run_id = ? ORDER BY employee_name',
            [id]
        );
        
        // Parse result_data JSON
        const parsedResults = results.map(result => ({
            ...result,
            resultData: JSON.parse(result.result_data)
        }));
        
        res.json({
            run: runs[0],
            results: parsedResults,
            employeeTotals: totals
        });
    } catch (error) {
        console.error('Error fetching payroll run:', error);
        res.status(500).json({ error: 'Failed to fetch payroll run' });
    }
});

module.exports = router;

