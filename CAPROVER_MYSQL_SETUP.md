# CapRover MySQL Connection Setup

## Overview

If you're using CapRover's MySQL one-click app (or a MySQL container), here's how to configure your payroll application to connect to it.

## Finding MySQL Connection Details in CapRover

### Method 1: Using CapRover's MySQL One-Click App

If you installed MySQL via CapRover's one-click apps:

1. **MySQL App Name**: Usually named `mysql` or `db`
2. **Internal Hostname**: Use the app name as the hostname (e.g., `mysql` or `db`)
3. **Port**: Usually `3306` (internal port, not exposed)
4. **Database Name**: The database you created (default might be `mysql`)
5. **Username**: Usually `root` or the username you configured
6. **Password**: The password you set during MySQL app creation

### Method 2: Check MySQL App Settings

1. Go to CapRover Dashboard
2. Click on your MySQL app (likely named `mysql` or `db`)
3. Go to **App Configs** tab
4. Look for environment variables:
   - `MYSQL_ROOT_PASSWORD` - This is your root password
   - `MYSQL_DATABASE` - Default database name
   - `MYSQL_USER` - Username (if custom user was created)

## Configuring Payroll App Environment Variables

In your **payroll** app settings in CapRover:

### Go to: App Configs → Environment Variables

Add these environment variables:

```env
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=payroll_bowc
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

### Important Notes:

1. **DB_HOST**: 
   - If MySQL app is named `mysql`, use: `mysql`
   - If MySQL app is named `db`, use: `db`
   - CapRover automatically resolves app names to internal IPs

2. **DB_PASSWORD**: 
   - Get this from your MySQL app's environment variables
   - Or the password you set during MySQL installation

3. **DB_NAME**: 
   - Create this database first (see below)
   - Or use an existing database name

## Creating the Database

### Option 1: Via MySQL Command Line (Recommended)

1. **Connect to MySQL container**:
   ```bash
   # SSH into your CapRover server
   docker exec -it captain-mysql-1 mysql -u root -p
   # Enter your MySQL root password
   ```

2. **Create database and run migration**:
   ```sql
   CREATE DATABASE IF NOT EXISTS payroll_bowc;
   USE payroll_bowc;
   ```

3. **Run the migration**:
   ```bash
   # Copy the migration file to the server, then:
   docker exec -i captain-mysql-1 mysql -u root -p payroll_bowc < database/migrations/001_initial_schema.sql
   ```

### Option 2: Via CapRover Terminal

1. Go to your MySQL app in CapRover
2. Click **Terminal** tab
3. Run:
   ```bash
   mysql -u root -p
   # Enter password
   ```
4. Then run SQL commands to create database

### Option 3: Via phpMyAdmin (if installed)

1. Access phpMyAdmin through CapRover
2. Create database `payroll_bowc`
3. Import the migration SQL file

## Persistent Directories (MySQL Data)

From your screenshot, I can see:
- **Path in App**: `/var/lib/mysql`
- **Label**: `db-db-data`

This is correct for MySQL data persistence. The MySQL app should already have this configured.

## Service Tags

The `db` tag you see is used for:
- Service discovery
- Linking containers
- Network configuration

Your payroll app doesn't need this tag unless you're using CapRover's service discovery features.

## Testing the Connection

### 1. Check if MySQL is accessible from payroll app:

Add a test endpoint to your `server.js` temporarily:

```javascript
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT 1 as test');
        res.json({ success: true, message: 'Database connected!', data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

Then visit: `https://payroll.square63.org/api/test-db`

### 2. Check MySQL logs:

In CapRover → MySQL app → Logs tab, you should see connection attempts.

## Common Issues

### Issue 1: "Can't connect to MySQL server"

**Solution**: 
- Verify `DB_HOST` matches your MySQL app name exactly
- Check if MySQL app is running (Status should be "Running")
- Ensure both apps are on the same CapRover network

### Issue 2: "Access denied for user"

**Solution**:
- Verify `DB_USER` and `DB_PASSWORD` are correct
- Check MySQL app's environment variables for the actual password
- Try connecting manually: `docker exec -it captain-mysql-1 mysql -u root -p`

### Issue 3: "Unknown database 'payroll_bowc'"

**Solution**:
- Create the database first (see "Creating the Database" above)
- Or change `DB_NAME` to an existing database

### Issue 4: "Table doesn't exist"

**Solution**:
- Run the migration SQL file to create tables
- Check if migration was successful

## Quick Setup Checklist

- [ ] MySQL app is running in CapRover
- [ ] Know your MySQL app name (usually `mysql` or `db`)
- [ ] Know your MySQL root password
- [ ] Created database `payroll_bowc` (or use existing)
- [ ] Ran migration SQL to create tables
- [ ] Set environment variables in payroll app:
  - [ ] `DB_HOST` = MySQL app name
  - [ ] `DB_USER` = root (or your MySQL user)
  - [ ] `DB_PASSWORD` = your MySQL password
  - [ ] `DB_NAME` = payroll_bowc
  - [ ] `DB_PORT` = 3306
- [ ] Restarted payroll app after setting environment variables
- [ ] Tested connection via `/api/test-db` endpoint

## Example Environment Variables

Based on a typical CapRover MySQL setup:

```env
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=MySecurePassword123
DB_NAME=payroll_bowc
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

**Note**: Replace `MySecurePassword123` with your actual MySQL root password.

