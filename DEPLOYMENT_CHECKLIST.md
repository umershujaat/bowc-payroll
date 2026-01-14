# Deployment Checklist for http://www.payroll.square63.org/

## Current Status
- ❌ Site shows "Nothing here yet :/" - Deployment not successful
- ❌ All GitHub Actions workflows are failing

## Step 1: Fix GitHub Secrets

Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions

### Required Secrets:

1. **CAPROVER_SERVER**
   - Value: Your CapRover dashboard URL
   - Example: `https://captain.square63.org` or your main CapRover domain
   - Must include `https://`
   - **NOT** the app URL (www.payroll.square63.org)

2. **CAPROVER_PASSWORD**
   - Value: Your CapRover dashboard password

3. **CAPROVER_APP_NAME**
   - Value: `payroll` (exactly as shown, lowercase)

## Step 2: Check CapRover App Configuration

1. Log into CapRover dashboard
2. Go to app: `payroll`
3. Check:
   - App exists
   - Custom domain is set: `www.payroll.square63.org` (with www)
   - Deployment method is "Dockerfile" or "captain-definition"

## Step 3: Verify Domain Configuration

Since your URL is `www.payroll.square63.org` (with www):

1. In CapRover → App `payroll` → HTTP Settings
2. Custom Domain should include: `www.payroll.square63.org`
3. Or add both: `payroll.square63.org` and `www.payroll.square63.org`

## Step 4: Debug GitHub Actions

1. Go to: https://github.com/umershujaat/bowc-payroll/actions
2. Click on the latest failed workflow
3. Click on "deploy" job
4. Expand "Deploy to CapRover" step
5. Look for the exact error message

Common errors:
- "Secret not found" → Add missing secret
- "Cannot connect" → Wrong CAPROVER_SERVER URL
- "Authentication failed" → Wrong password
- "App not found" → Wrong app name

## Step 5: Test Deployment

After fixing secrets:

```bash
cd /Users/urabbani/projects/Payroll-BOWC
git add .
git commit -m "Test deployment after fixing secrets"
git push
```

Then:
1. Watch: https://github.com/umershujaat/bowc-payroll/actions
2. Wait for green checkmark ✅
3. Visit: http://www.payroll.square63.org/

## Alternative: Manual Deployment

If CI/CD continues to fail, deploy manually:

```bash
npm install -g caprover
caprover login
# Enter your server URL and password
cd /Users/urabbani/projects/Payroll-BOWC
caprover deploy -a payroll
```

## What Should Happen

After successful deployment:
- ✅ GitHub Actions shows green checkmark
- ✅ CapRover app shows "Running"
- ✅ http://www.payroll.square63.org/ shows your Payroll Calculator
- ✅ All features work (upload CSV/Excel, calculate payroll)

## Next Steps

1. **First priority:** Check GitHub Secrets are all set correctly
2. **Second priority:** Check the error logs in GitHub Actions
3. **Third priority:** Verify CapRover app configuration

Once secrets are correct, the next push should deploy successfully!

