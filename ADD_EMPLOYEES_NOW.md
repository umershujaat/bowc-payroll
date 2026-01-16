# Add Employees to Database - Step by Step

## Quick Method: Via CapRover Dashboard

### Step 1: Access MySQL Terminal in CapRover

1. Go to your CapRover dashboard
2. Find your **MySQL app** (usually named `mysql` or `db`)
3. Click on it
4. Go to **Terminal** tab
5. Click **Connect to Terminal**

### Step 2: Connect to MySQL

In the terminal, run:
```bash
mysql -u root -p
```
Enter your MySQL root password when prompted.

### Step 3: Select Database

```sql
USE payroll_bowc;
```

### Step 4: Add Employees

Copy and paste this SQL:

```sql
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
```

### Step 5: Verify

```sql
SELECT * FROM employees;
```

You should see 8 employees listed.

### Step 6: Refresh Your App

Go to https://payroll.square63.org and click "Show Employees"

---

## Alternative: Via SSH

If you have SSH access to your CapRover server:

```bash
# SSH into your server
ssh user@your-server

# Run the seed script
docker exec -i captain-mysql-1 mysql -u root -p payroll_bowc < /path/to/database/seed_employees.sql
```

---

## Troubleshooting

### If database doesn't exist:
```sql
CREATE DATABASE IF NOT EXISTS payroll_bowc;
USE payroll_bowc;
```

### If employees table doesn't exist:
Run the migration first:
```bash
docker exec -i captain-mysql-1 mysql -u root -p < database/migrations/001_initial_schema.sql
```

### If you get "Access denied":
- Check your MySQL root password
- Verify you're using the correct MySQL container name
- Check CapRover MySQL app environment variables

