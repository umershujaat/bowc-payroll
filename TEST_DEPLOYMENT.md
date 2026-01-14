# How to Test CI/CD Deployment

## Quick Test Steps

### 1. Verify GitHub Secrets are Set

Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions

Make sure you have all 3 secrets:
- ✅ `CAPROVER_SERVER` - Your CapRover dashboard URL
- ✅ `CAPROVER_PASSWORD` - Your CapRover password
- ✅ `CAPROVER_APP_NAME` - Value: `payroll`

### 2. Make a Test Change

Run these commands:

```bash
cd /Users/urabbani/projects/Payroll-BOWC

# Make a small test change
echo "<!-- Test deployment $(date) -->" >> index.html

# Commit and push
git add index.html
git commit -m "Test CI/CD deployment"
git push
```

### 3. Monitor the Deployment

1. **Go to GitHub Actions:**
   - https://github.com/umershujaat/bowc-payroll/actions
   - You should see a new workflow run called "Deploy to CapRover"

2. **Click on the workflow run** to see details:
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed (check logs)

3. **Watch the logs:**
   - Click on "Deploy to CapRover" job
   - You'll see real-time deployment progress

### 4. Verify Your App

After deployment completes (usually 1-2 minutes):

1. **Visit your app:**
   - http://payroll.square63.org/

2. **Check if it's working:**
   - Page should load
   - Try uploading a CSV/Excel file
   - Verify all features work

### 5. Check CapRover Dashboard

1. Log into CapRover dashboard
2. Go to your app: `payroll`
3. Check:
   - Status should be "Running"
   - Check logs for any errors
   - Verify deployment time matches GitHub Actions

## What Success Looks Like

✅ GitHub Actions shows green checkmark
✅ CapRover app shows "Running"
✅ http://payroll.square63.org/ loads correctly
✅ All features work (upload, calculate, download)

## Troubleshooting

### Deployment Fails in GitHub Actions

**Check the logs:**
1. Go to Actions tab
2. Click on failed workflow
3. Click on "Deploy to CapRover" job
4. Read the error message

**Common issues:**
- ❌ Wrong `CAPROVER_SERVER` URL
- ❌ Wrong `CAPROVER_PASSWORD`
- ❌ App name doesn't match (`payroll`)
- ❌ CapRover server is down

### App Not Loading

1. **Check CapRover:**
   - Is app running?
   - Check app logs
   - Verify custom domain is set

2. **Check DNS:**
   - Is `payroll.square63.org` pointing to CapRover?
   - DNS propagation can take a few minutes

### Need to Re-deploy

Just push again:
```bash
git push
```

The workflow will automatically trigger!

## Test Checklist

Before testing, verify:
- [ ] GitHub Secrets are configured
- [ ] CapRover app `payroll` exists
- [ ] Custom domain `payroll.square63.org` is set
- [ ] You can access CapRover dashboard

After testing, verify:
- [ ] GitHub Actions workflow completed successfully
- [ ] App is accessible at http://payroll.square63.org/
- [ ] All features work correctly
- [ ] Changes are reflected on the live site

## Next Steps After Successful Test

Once deployment works:
- ✅ Every `git push` will auto-deploy
- ✅ No manual deployment needed
- ✅ Changes go live in 1-2 minutes
- ✅ You can focus on development!

