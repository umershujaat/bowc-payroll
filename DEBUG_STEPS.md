# How to Debug the Failed Deployment

## Step 1: View Detailed Error Logs

1. Go to: https://github.com/umershujaat/bowc-payroll/actions
2. Click on the failed workflow: "Fix deployment workflow #4"
3. Click on the **"deploy"** job (the one with the red X)
4. Expand each step to see the error messages

Look for errors in:
- "Install CapRover CLI" step
- "Deploy to CapRover" step (most likely)

## Step 2: Common Error Messages & Fixes

### Error: "Secret not found" or "Required secret is missing"
**Fix:** Go to Settings → Secrets → Actions and add the missing secret

### Error: "Cannot connect to server" or "ECONNREFUSED"
**Fix:** Check `CAPROVER_SERVER` - must be your CapRover dashboard URL with `https://`

### Error: "Authentication failed" or "Invalid password"
**Fix:** Check `CAPROVER_PASSWORD` - verify it's correct

### Error: "App not found" or "App does not exist"
**Fix:** Check `CAPROVER_APP_NAME` - must be exactly `payroll` (lowercase)

### Error: "Deployment failed" or "Build failed"
**Fix:** Check CapRover app settings - make sure it's configured for Dockerfile deployment

## Step 3: Verify Secrets

Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions

You should see 3 secrets:
- ✅ CAPROVER_SERVER
- ✅ CAPROVER_PASSWORD
- ✅ CAPROVER_APP_NAME

If any are missing, click "New repository secret" to add them.

## Step 4: Check Secret Values

**CAPROVER_SERVER:**
- Should be: `https://captain.square63.org` or your CapRover dashboard URL
- Must include `https://`
- NOT the app URL (payroll.square63.org)

**CAPROVER_PASSWORD:**
- Your CapRover dashboard password
- No extra spaces

**CAPROVER_APP_NAME:**
- Must be exactly: `payroll` (lowercase, no spaces)

## Step 5: Test Locally

To verify your CapRover setup works:

```bash
npm install -g caprover
caprover login
# Enter your server URL and password
caprover deploy -a payroll
```

If this works locally, the issue is with GitHub Secrets configuration.

## What to Share

If you need help, share:
1. The exact error message from the "Deploy to CapRover" step
2. Whether all 3 secrets are set
3. Whether local deployment works

