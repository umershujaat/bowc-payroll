# Push Code to GitHub

Your code is ready to push! Follow these steps:

## Step 1: Push to GitHub

Run this command in your terminal:

```bash
cd /Users/urabbani/projects/Payroll-BOWC
git push -u origin main
```

If prompted for credentials:
- Use your GitHub username
- Use a Personal Access Token (not your password)
  - Create one at: https://github.com/settings/tokens
  - Select "repo" scope

## Step 2: Configure GitHub Secrets

After pushing, go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions

Click "New repository secret" and add these 3 secrets:

### Secret 1: CAPROVER_SERVER
- **Name**: `CAPROVER_SERVER`
- **Value**: Your CapRover dashboard URL
  - Example: `https://captain.square63.org` or your main CapRover domain
  - **NOT** the app URL (payroll.square63.org), but the dashboard URL

### Secret 2: CAPROVER_PASSWORD
- **Name**: `CAPROVER_PASSWORD`
- **Value**: Your CapRover dashboard password

### Secret 3: CAPROVER_APP_NAME
- **Name**: `CAPROVER_APP_NAME`
- **Value**: `payroll` (your existing CapRover app name)

## Step 3: Verify App in CapRover

1. Log into your CapRover dashboard
2. Verify the app `payroll` exists
3. Make sure it's set up correctly

## Step 4: Set Custom Domain (if not already set)

1. In CapRover → Your app (`payroll`) → **HTTP Settings**
2. Under **Custom Domain**, add: `payroll.square63.org`
3. Enable **"Force HTTPS by redirecting all HTTP traffic to HTTPS"**
4. Click **Save & Update**

## Step 5: Test Deployment

After setting up secrets, make a small change and push:

```bash
echo "<!-- Deployed via CI/CD -->" >> index.html
git add index.html
git commit -m "Test CI/CD deployment"
git push
```

Then:
1. Go to: https://github.com/umershujaat/bowc-payroll/actions
2. Watch the deployment workflow run
3. When it shows ✅, visit: http://payroll.square63.org/

## What's Included

✅ All application files (index.html, app.js, styles.css)
✅ Dockerfile for deployment
✅ CapRover configuration
✅ GitHub Actions CI/CD pipeline
✅ Documentation files

## Next Steps After First Push

1. ✅ Code pushed to GitHub
2. ⏳ Add GitHub Secrets (Step 2)
3. ⏳ Create app in CapRover (Step 3)
4. ⏳ Set custom domain (Step 4)
5. ⏳ Test deployment (Step 5)

Once secrets are configured, every `git push` will automatically deploy!

