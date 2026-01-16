const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all levels
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM levels ORDER BY level_code');
        res.json(rows);
    } catch (error) {
        // If levels table doesn't exist, fall back to configurations
        try {
            const [configRows] = await db.execute('SELECT config_key, config_value FROM configurations WHERE config_key LIKE "level_%" OR config_key = "trainee_wage"');
            const levels = [];
            const config = {};
            configRows.forEach(row => {
                config[row.config_key] = row.config_value;
            });
            
            // Convert to levels format
            if (config.level_L1) levels.push({ level_code: 'L1', level_name: 'Trainee', percentage: parseFloat(config.level_L1), hourly_wage: parseFloat(config.trainee_wage || 20), is_trainee: true });
            if (config.level_L2) levels.push({ level_code: 'L2', level_name: 'Level 2', percentage: parseFloat(config.level_L2), hourly_wage: null, is_trainee: false });
            if (config.level_L3) levels.push({ level_code: 'L3', level_name: 'Level 3', percentage: parseFloat(config.level_L3), hourly_wage: null, is_trainee: false });
            if (config.level_L4) levels.push({ level_code: 'L4', level_name: 'Level 4', percentage: parseFloat(config.level_L4), hourly_wage: null, is_trainee: false });
            
            res.json(levels);
        } catch (fallbackError) {
            console.error('Error fetching levels:', error);
            res.status(500).json({ error: 'Failed to fetch levels' });
        }
    }
});

// Add new level
router.post('/', async (req, res) => {
    try {
        const { level_code, level_name, percentage, hourly_wage, is_trainee } = req.body;
        
        if (!level_code || !level_name || percentage === undefined) {
            return res.status(400).json({ error: 'Level code, name, and percentage are required' });
        }
        
        if (!/^L\d+$/.test(level_code)) {
            return res.status(400).json({ error: 'Level code must be in format L1, L2, L3, etc.' });
        }
        
        if (percentage < 0 || percentage > 1) {
            return res.status(400).json({ error: 'Percentage must be between 0 and 1' });
        }
        
        try {
            const [result] = await db.execute(
                'INSERT INTO levels (level_code, level_name, percentage, hourly_wage, is_trainee) VALUES (?, ?, ?, ?, ?)',
                [level_code.toUpperCase(), level_name, percentage, hourly_wage || null, is_trainee || false]
            );
            
            // Also update configurations table for backward compatibility
            await db.execute(
                'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                [`level_${level_code.toUpperCase()}`, percentage.toString(), percentage.toString()]
            );
            
            if (is_trainee && hourly_wage) {
                await db.execute(
                    'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    ['trainee_wage', hourly_wage.toString(), hourly_wage.toString()]
                );
            }
            
            const [newLevel] = await db.execute('SELECT * FROM levels WHERE id = ?', [result.insertId]);
            res.status(201).json(newLevel[0]);
        } catch (dbError) {
            // If levels table doesn't exist, use configurations
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                await db.execute(
                    'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    [`level_${level_code.toUpperCase()}`, percentage.toString(), percentage.toString()]
                );
                
                if (is_trainee && hourly_wage) {
                    await db.execute(
                        'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                        ['trainee_wage', hourly_wage.toString(), hourly_wage.toString()]
                    );
                }
                
                res.status(201).json({
                    level_code: level_code.toUpperCase(),
                    level_name,
                    percentage,
                    hourly_wage: hourly_wage || null,
                    is_trainee: is_trainee || false
                });
            } else {
                throw dbError;
            }
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Level already exists' });
        }
        console.error('Error adding level:', error);
        res.status(500).json({ error: 'Failed to add level' });
    }
});

// Update level
router.put('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { level_name, percentage, hourly_wage, is_trainee } = req.body;
        
        if (percentage === undefined) {
            return res.status(400).json({ error: 'Percentage is required' });
        }
        
        if (percentage < 0 || percentage > 1) {
            return res.status(400).json({ error: 'Percentage must be between 0 and 1' });
        }
        
        try {
            await db.execute(
                'UPDATE levels SET level_name = ?, percentage = ?, hourly_wage = ?, is_trainee = ? WHERE level_code = ?',
                [level_name, percentage, hourly_wage || null, is_trainee || false, code.toUpperCase()]
            );
            
            // Also update configurations table
            await db.execute(
                'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                [`level_${code.toUpperCase()}`, percentage.toString(), percentage.toString()]
            );
            
            if (is_trainee && hourly_wage) {
                await db.execute(
                    'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    ['trainee_wage', hourly_wage.toString(), hourly_wage.toString()]
                );
            }
            
            const [updated] = await db.execute('SELECT * FROM levels WHERE level_code = ?', [code.toUpperCase()]);
            res.json(updated[0]);
        } catch (dbError) {
            // If levels table doesn't exist, use configurations
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                await db.execute(
                    'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    [`level_${code.toUpperCase()}`, percentage.toString(), percentage.toString()]
                );
                
                if (is_trainee && hourly_wage) {
                    await db.execute(
                        'INSERT INTO configurations (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                        ['trainee_wage', hourly_wage.toString(), hourly_wage.toString()]
                    );
                }
                
                res.json({
                    level_code: code.toUpperCase(),
                    level_name: level_name || `Level ${code}`,
                    percentage,
                    hourly_wage: hourly_wage || null,
                    is_trainee: is_trainee || false
                });
            } else {
                throw dbError;
            }
        }
    } catch (error) {
        console.error('Error updating level:', error);
        res.status(500).json({ error: 'Failed to update level' });
    }
});

// Delete level
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        try {
            await db.execute('DELETE FROM levels WHERE level_code = ?', [code.toUpperCase()]);
            
            // Also remove from configurations
            await db.execute('DELETE FROM configurations WHERE config_key = ?', [`level_${code.toUpperCase()}`]);
            
            res.json({ message: 'Level deleted successfully' });
        } catch (dbError) {
            // If levels table doesn't exist, use configurations
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                await db.execute('DELETE FROM configurations WHERE config_key = ?', [`level_${code.toUpperCase()}`]);
                res.json({ message: 'Level deleted successfully' });
            } else {
                throw dbError;
            }
        }
    } catch (error) {
        console.error('Error deleting level:', error);
        res.status(500).json({ error: 'Failed to delete level' });
    }
});

module.exports = router;

