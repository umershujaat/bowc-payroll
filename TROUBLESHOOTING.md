# Troubleshooting Failed Deployments

## Check GitHub Actions Logs

1. Go to: https://github.com/umershujaat/bowc-payroll/actions
2. Click on the failed workflow (red X)
3. Click on "Deploy to CapRover" job
4. Expand the steps to see error messages

## Common Issues & Solutions

### Issue 1: Missing GitHub Secrets

**Error:** "Secret not found" or authentication fails

**Solution:**
1. Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions
2. Verify you have all 3 secrets:
   - `CAPROVER_SERVER`
   - `CAPROVER_PASSWORD`
   - `CAPROVER_APP_NAME`

### Issue 2: Wrong CapRover Server URL

**Error:** "Cannot connect to server" or "Invalid server"

**Solution:**
- `CAPROVER_SERVER` should be your CapRover dashboard URL
- Example: `https://captain.square63.org` or `https://your-caprover-domain.com`
- **NOT** the app URL (payroll.square63.org)
- Must include `https://` protocol

### Issue 3: Wrong Password

**Error:** "Authentication failed" or "Invalid password"

**Solution:**
- Verify `CAPROVER_PASSWORD` is correct
- This is your CapRover dashboard password
- Make sure there are no extra spaces

### Issue 4: App Name Mismatch

**Error:** "App not found" or "App does not exist"

**Solution:**
- `CAPROVER_APP_NAME` must exactly match your CapRover app name
- Your app is called: `payroll`
- Make sure the secret value is exactly: `payroll` (lowercase, no spaces)

### Issue 5: Deployment Method Issue

**Error:** "Deployment failed" or "Build failed"

**Solution:**
- Make sure your CapRover app is configured to use Dockerfile
- In CapRover dashboard → Your app → Deployment
- Method should be "Dockerfile" or "captain-definition"

## Step-by-Step Debugging

### 1. Verify Secrets

```bash
# Check if secrets are set (you can't see values, just verify they exist)
# Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions
```

### 2. Test CapRover Connection Locally

```bash
# Install CapRover CLI locally
npm install -g caprover

# Try to login
caprover login
# Enter your server URL and password

# Try to deploy
caprover deploy -a payroll
```

If this works locally, the issue is with GitHub Secrets.

### 3. Check CapRover App Settings

1. Log into CapRover dashboard
2. Go to app: `payroll`
3. Check:
   - App exists and is running
   - Deployment method is set correctly
   - Custom domain is configured

### 4. Check Workflow Logs

In GitHub Actions, look for:
- Authentication errors
- Connection errors
- Deployment errors
- Build errors

## Quick Fix Checklist

- [ ] All 3 GitHub Secrets are set
- [ ] `CAPROVER_SERVER` is the dashboard URL (with https://)
- [ ] `CAPROVER_PASSWORD` is correct
- [ ] `CAPROVER_APP_NAME` is exactly `payroll`
- [ ] CapRover app `payroll` exists
- [ ] You can login to CapRover dashboard manually

## Still Having Issues?

1. **Check the exact error message** in GitHub Actions logs
2. **Share the error** and I can help debug
3. **Try manual deployment** first to verify CapRover setup:
   ```bash
   caprover login
   caprover deploy -a payroll
   ```

