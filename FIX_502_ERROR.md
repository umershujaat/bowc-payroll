# Fix 502 Bad Gateway Error

## Problem
After deploying, you get a 502 Bad Gateway error when accessing the app.

## Solution

### Step 1: Check Container Port in CapRover

1. Go to CapRover Dashboard
2. Click on your **payroll** app
3. Go to **HTTP Settings** tab
4. Under **Container Port**, set it to: `3000`
5. Click **Save & Update**

### Step 2: Verify Environment Variables

Make sure these are set in your app's **App Configs → Environment Variables**:

```env
PORT=3000
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=payroll_bowc
DB_PORT=3306
NODE_ENV=production
```

### Step 3: Check App Logs

1. Go to your app in CapRover
2. Click **Logs** tab
3. Look for:
   - `🚀 Server running on port 3000`
   - `🌐 Listening on 0.0.0.0:3000`
   - Any error messages

### Step 4: Common Issues

#### Issue: App crashed on startup
**Check logs for:**
- Database connection errors
- Missing environment variables
- Module not found errors

**Solution:**
- Verify all environment variables are set
- Check database is accessible
- Ensure MySQL app is running

#### Issue: Wrong port
**Symptoms:**
- Logs show app running on different port
- Container port mismatch

**Solution:**
- Set Container Port to `3000` in HTTP Settings
- Ensure `PORT=3000` in environment variables

#### Issue: Database connection failing
**Symptoms:**
- App starts but API calls fail
- Logs show MySQL connection errors

**Solution:**
- Verify `DB_HOST` matches your MySQL app name
- Check MySQL app is running
- Verify database `payroll_bowc` exists
- Test connection manually

### Step 5: Test Health Endpoint

After fixing, test:
```
https://payroll.square63.org/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Payroll API is running"
}
```

## Quick Fix Checklist

- [ ] Container Port set to `3000` in HTTP Settings
- [ ] `PORT=3000` in environment variables
- [ ] Server binding to `0.0.0.0` (fixed in latest code)
- [ ] All database environment variables set
- [ ] MySQL app is running
- [ ] Database `payroll_bowc` exists
- [ ] App logs show "Server running on port 3000"
- [ ] `/api/health` endpoint responds

## After Fixing

1. **Redeploy** the app (or it will auto-deploy from GitHub)
2. **Wait** for build to complete
3. **Check logs** to verify app started
4. **Test** the health endpoint
5. **Access** your app URL

