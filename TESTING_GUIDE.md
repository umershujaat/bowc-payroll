# Testing Guide

## Option 1: Test on Deployed Link (Easiest)

### Steps:
1. **Access your app**: https://payroll.square63.org
2. **Check if employees load**: 
   - Click "Show Employees" button
   - You should see the 8 default employees
3. **Test employee management**:
   - Click "Add Employee" → Add a test employee → Save
   - Click "Edit" on an employee → Modify → Save
   - Click "Delete" on a test employee → Confirm
4. **Test level configuration**:
   - Click "Show Levels" button
   - Change a level percentage → Should auto-save
5. **Test payroll processing**:
   - Upload a CSV/Excel file
   - Enter Marketing Spend and Insurance Spend
   - Process payroll
   - Check results display
   - Click "Save to Database" to save results

### Advantages:
- ✅ No local setup needed
- ✅ Uses production database
- ✅ Tests full deployment

---

## Option 2: Test Locally (For Development)

### Prerequisites:
1. Node.js 18+ installed
2. MySQL database accessible (local or remote)
3. `.env` file configured

### Setup Steps:

#### 1. Install Dependencies
```bash
cd /Users/urabbani/projects/Payroll-BOWC
npm install
```

#### 2. Create `.env` File
Create `.env` in project root:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payroll_bowc
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

**For CapRover MySQL:**
```env
DB_HOST=mysql          # or "db" if that's your MySQL app name
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=payroll_bowc
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

#### 3. Set Up Database
```bash
# Run migration to create tables
mysql -u root -p < database/migrations/001_initial_schema.sql

# Or if using CapRover MySQL:
docker exec -i captain-mysql-1 mysql -u root -p < database/migrations/001_initial_schema.sql
```

#### 4. Seed Employees (if not in migration)
```bash
# Option A: SQL script
mysql -u root -p payroll_bowc < database/seed_employees.sql

# Option B: Node.js script
npm run seed:employees
```

#### 5. Start Server
```bash
npm start
```

#### 6. Access Application
Open browser: **http://localhost:3000**

### Test Checklist (Local):

- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Employees load from database
- [ ] Can add/edit/delete employees
- [ ] Level configuration saves
- [ ] Can upload and process payroll file
- [ ] Results display correctly
- [ ] Can save payroll to database

---

## Option 3: Test API Directly (Advanced)

### Test with curl or Postman:

#### Health Check
```bash
curl http://localhost:3000/api/health
# or
curl https://payroll.square63.org/api/health
```

#### Get Employees
```bash
curl http://localhost:3000/api/employees
```

#### Add Employee
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Employee","level":"L2"}'
```

#### Get Configuration
```bash
curl http://localhost:3000/api/config
```

#### Process Payroll
```bash
curl -X POST http://localhost:3000/api/payroll/process \
  -F "file=@/path/to/payroll.csv" \
  -F "marketing_spend=100" \
  -F "insurance_spend=50"
```

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
- Check `.env` file has correct credentials
- Verify MySQL is running
- Test connection: `mysql -u root -p -h localhost payroll_bowc`

### Issue: "No employees showing"
**Solution:**
- Run seed script: `npm run seed:employees`
- Or check database: `SELECT * FROM employees;`

### Issue: "502 Bad Gateway" (on deployed link)
**Solution:**
- Check CapRover logs
- Verify Container Port is set to `3000`
- Check environment variables are set
- Ensure server is binding to `0.0.0.0`

### Issue: "Port 3000 already in use" (local)
**Solution:**
- Change PORT in `.env` to different port (e.g., 3001)
- Or kill process using port 3000

---

## Quick Test Commands

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check employees
curl http://localhost:3000/api/employees

# Check config
curl http://localhost:3000/api/config

# View server logs
# (if running locally, logs appear in terminal)
```

---

## Recommended Testing Flow

1. **Start with deployed link** (easiest)
   - Test basic functionality
   - Verify database connection works

2. **If issues, test locally**
   - Debug database connection
   - Test API endpoints
   - Check logs

3. **Test full workflow**
   - Add employees
   - Configure levels
   - Process payroll
   - Save to database
   - View history

---

## Need Help?

- Check server logs for errors
- Verify database connection
- Test API endpoints individually
- Check browser console for frontend errors

