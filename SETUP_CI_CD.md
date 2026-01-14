# CI/CD Pipeline Setup Guide

This guide will help you set up automatic deployment from GitHub to your CapRover server.

## Step-by-Step Setup

### Step 1: Initialize Git Repository

```bash
cd /Users/urabbani/projects/Payroll-BOWC
git init
git add .
git commit -m "Initial commit - Payroll Calculator"
git branch -M main
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `payroll-calculator` (or any name)
3. Make it **Private** or **Public** (your choice)
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

### Step 3: Push Code to GitHub

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/payroll-calculator.git
git push -u origin main
```

### Step 4: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these 3 secrets:

#### Secret 1: CAPROVER_SERVER
- **Name**: `CAPROVER_SERVER`
- **Value**: Your CapRover dashboard URL
  - Example: `https://captain.square63.org` or `https://your-caprover-domain.com`
  - **Important**: This is your CapRover dashboard URL, NOT the app URL

#### Secret 2: CAPROVER_PASSWORD
- **Name**: `CAPROVER_PASSWORD`
- **Value**: Your CapRover dashboard password

#### Secret 3: CAPROVER_APP_NAME
- **Name**: `CAPROVER_APP_NAME`
- **Value**: `payroll-calculator` (or whatever you name your app in CapRover)

### Step 5: Create App in CapRover

1. Log into your CapRover dashboard
2. Go to **Apps** → **New App**
3. App name: `payroll-calculator` (must match CAPROVER_APP_NAME secret)
4. Click **Create New App**
5. The app will be created but empty (that's OK)

### Step 6: Configure Custom Domain

1. In CapRover, go to your app: `payroll-calculator`
2. Click **HTTP Settings** tab
3. Under **Custom Domain**, add: `payroll.square63.org`
4. Enable **"Force HTTPS by redirecting all HTTP traffic to HTTPS"**
5. Click **Save & Update**

### Step 7: Test the Pipeline

Make a small change and push:

```bash
# Make a test change
echo "<!-- Test deployment -->" >> index.html
git add .
git commit -m "Test CI/CD deployment"
git push
```

### Step 8: Monitor Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see a workflow run called "Deploy to CapRover"
4. Click on it to see the deployment progress
5. When it shows ✅ (green checkmark), deployment is complete!

### Step 9: Verify Deployment

Visit: http://payroll.square63.org/

You should see your Payroll Calculator app!

## How It Works

```
┌─────────────┐
│  Your Code  │
└──────┬──────┘
       │ git push
       ▼
┌─────────────┐
│   GitHub    │
└──────┬──────┘
       │ GitHub Actions triggers
       ▼
┌─────────────┐
│  CapRover   │
│   Server    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Live App   │
│payroll.square63.org│
└─────────────┘
```

## Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs:**
   - Go to repository → Actions tab
   - Click on the failed workflow
   - Check the error message

2. **Common issues:**
   - Wrong CAPROVER_SERVER URL (must be dashboard URL, not app URL)
   - Wrong CAPROVER_PASSWORD
   - App name doesn't exist in CapRover
   - CapRover server is down

### App Not Accessible

1. **Check CapRover dashboard:**
   - Go to your app
   - Check if it's running (should show "Running")
   - Check logs for errors

2. **Check domain settings:**
   - Verify custom domain is set correctly
   - Check DNS settings point to CapRover server

### Need to Update Secrets

1. Go to repository → Settings → Secrets and variables → Actions
2. Click on the secret you want to update
3. Click "Update" and enter new value

## Future Updates

Now whenever you make changes:

```bash
git add .
git commit -m "Your change description"
git push
```

The app will automatically deploy to http://payroll.square63.org/ within 1-2 minutes!

## Files Included in Deployment

- ✅ `index.html` - Main application
- ✅ `app.js` - Application logic
- ✅ `styles.css` - Styling
- ✅ `Dockerfile` - Docker configuration
- ✅ `captain-definition` - CapRover config
- ✅ `.github/workflows/deploy.yml` - CI/CD pipeline

## Security Notes

- GitHub Secrets are encrypted and only accessible during workflow runs
- Never commit passwords or secrets to your repository
- Use GitHub Secrets for all sensitive information

