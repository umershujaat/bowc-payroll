const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all configuration values
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT config_key, config_value FROM configurations');
        
        const config = {};
        rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });
        
        res.json(config);
    } catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// Update configuration values
router.put('/', async (req, res) => {
    try {
        const updates = req.body;
        
        for (const [key, value] of Object.entries(updates)) {
            await db.execute(
                'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                [key, value, value]
            );
        }
        
        // Fetch updated config
        const [rows] = await db.execute('SELECT config_key, config_value FROM configurations');
        const config = {};
        rows.forEach(row => {
            config[row.config_key] = row.config_value;
        });
        
        res.json(config);
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

module.exports = router;

