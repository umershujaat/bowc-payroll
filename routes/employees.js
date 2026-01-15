const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM employees ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Add new employee
router.post('/', async (req, res) => {
    try {
        const { name, level } = req.body;
        
        if (!name || !level) {
            return res.status(400).json({ error: 'Name and level are required' });
        }
        
        if (!['L1', 'L2', 'L3', 'L4'].includes(level)) {
            return res.status(400).json({ error: 'Invalid level. Must be L1, L2, L3, or L4' });
        }
        
        const [result] = await db.execute(
            'INSERT INTO employees (name, level) VALUES (?, ?)',
            [name, level]
        );
        
        const [newEmployee] = await db.execute(
            'SELECT * FROM employees WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json(newEmployee[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Employee already exists' });
        }
        console.error('Error adding employee:', error);
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, level } = req.body;
        
        if (!name || !level) {
            return res.status(400).json({ error: 'Name and level are required' });
        }
        
        if (!['L1', 'L2', 'L3', 'L4'].includes(level)) {
            return res.status(400).json({ error: 'Invalid level. Must be L1, L2, L3, or L4' });
        }
        
        await db.execute(
            'UPDATE employees SET name = ?, level = ? WHERE id = ?',
            [name, level, id]
        );
        
        const [updated] = await db.execute(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );
        
        res.json(updated[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Employee name already exists' });
        }
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.execute('DELETE FROM employees WHERE id = ?', [id]);
        
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;

