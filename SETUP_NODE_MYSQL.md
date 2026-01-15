# Node.js + MySQL Setup Guide

## Overview

The application has been migrated from a frontend-only static site to a full-stack Node.js application with MySQL database backend.

## Architecture

- **Frontend**: HTML/CSS/JavaScript (served from `public/` directory)
- **Backend**: Node.js + Express
- **Database**: MySQL
- **File Processing**: Server-side CSV/Excel parsing

## Prerequisites

1. Node.js 18+ installed
2. MySQL server installed and running
3. Access to MySQL database

## Setup Steps

### 1. Database Setup

Run the migration script to create the database and tables:

```bash
mysql -u root -p < database/migrations/001_initial_schema.sql
```

Or manually:

```sql
mysql -u root -p
```

Then run:
```sql
source database/migrations/001_initial_schema.sql
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payroll_bowc
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

**Development:**
```bash
npm start
```

The server will start on `http://localhost:3000`

**Production:**
The application is containerized with Docker and can be deployed via CapRover.

## Database Schema

### Tables Created:

1. **employees** - Stores employee names and levels
2. **configurations** - Stores application settings (level percentages, trainee wage, etc.)
3. **payroll_runs** - Stores payroll run metadata
4. **payroll_results** - Stores individual job results per payroll run
5. **employee_totals** - Stores employee summary totals per payroll run

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Configuration
- `GET /api/config` - Get all configuration values
- `PUT /api/config` - Update configuration values

### Payroll
- `POST /api/payroll/process` - Upload and process payroll file
- `POST /api/payroll/save` - Save processed payroll to database
- `GET /api/payroll/history` - Get payroll history
- `GET /api/payroll/history/:id` - Get specific payroll run details

## Deployment

### CapRover Deployment

1. Ensure MySQL is accessible from your CapRover server
2. Set environment variables in CapRover dashboard:
   - `DB_HOST` - MySQL host (may be `mysql` if using CapRover's MySQL one-click app)
   - `DB_USER` - MySQL username
   - `DB_PASSWORD` - MySQL password
   - `DB_NAME` - Database name
   - `DB_PORT` - MySQL port (usually 3306)
   - `PORT` - Application port (CapRover will set this automatically)

3. The Dockerfile is already configured for Node.js

### Database Connection from CapRover

If MySQL is running on the same server as CapRover:
- Use `mysql` as `DB_HOST` if using CapRover's MySQL one-click app
- Use `localhost` or the server IP if MySQL is installed directly

If MySQL is on a different server:
- Use the MySQL server's IP address or hostname
- Ensure MySQL allows remote connections
- Update MySQL `bind-address` in `/etc/mysql/mysql.conf.d/mysqld.cnf` if needed

## Migration Notes

### What Changed:

1. **Frontend**: Now uses API calls instead of in-memory storage
2. **Backend**: All payroll processing happens on the server
3. **Database**: Employee configurations and payroll history are persisted
4. **File Processing**: CSV/Excel parsing moved to backend

### Backward Compatibility:

- The payroll calculation logic remains identical
- Results format is the same
- UI/UX is unchanged

## Troubleshooting

### Database Connection Issues

1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check credentials in `.env`
3. Test connection: `mysql -u [user] -p -h [host] [database]`
4. Check firewall rules if connecting remotely

### Port Conflicts

If port 3000 is in use, change `PORT` in `.env`

### File Upload Issues

- Maximum file size: 10MB (configured in `routes/payroll.js`)
- Supported formats: CSV, XLS, XLSX

## Next Steps

1. Run database migration
2. Configure `.env` file
3. Install dependencies: `npm install`
4. Start server: `npm start`
5. Access application at `http://localhost:3000`

