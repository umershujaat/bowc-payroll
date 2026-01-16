#!/usr/bin/env node

/**
 * Seed default employees into the database
 * Run with: node scripts/seed-employees.js
 */

require('dotenv').config();
const db = require('../config/database');

const defaultEmployees = [
    { name: 'Henry Rios', level: 'L4' },
    { name: 'Danny Brown', level: 'L4' },
    { name: 'Kevin Cooper', level: 'L4' },
    { name: 'Yong Lee', level: 'L4' },
    { name: 'David Mestas', level: 'L3' },
    { name: 'Rick Fox', level: 'L3' },
    { name: 'Paul Pate', level: 'L3' },
    { name: 'Joshua Ryan', level: 'L1' }
];

async function seedEmployees() {
    try {
        console.log('🌱 Seeding default employees...\n');
        
        for (const emp of defaultEmployees) {
            try {
                // Try to insert, update if exists
                await db.execute(
                    'INSERT INTO employees (name, level) VALUES (?, ?) ON DUPLICATE KEY UPDATE level = ?',
                    [emp.name, emp.level, emp.level]
                );
                console.log(`✅ ${emp.name} (${emp.level}) - Added/Updated`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    // Update existing
                    await db.execute(
                        'UPDATE employees SET level = ? WHERE name = ?',
                        [emp.level, emp.name]
                    );
                    console.log(`🔄 ${emp.name} (${emp.level}) - Updated`);
                } else {
                    console.error(`❌ Error adding ${emp.name}:`, error.message);
                }
            }
        }
        
        // Show all employees
        console.log('\n📋 Current employees in database:');
        const [employees] = await db.execute('SELECT * FROM employees ORDER BY name');
        employees.forEach(emp => {
            console.log(`   - ${emp.name} (${emp.level})`);
        });
        
        console.log(`\n✅ Successfully seeded ${employees.length} employees!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding employees:', error);
        process.exit(1);
    }
}

seedEmployees();

