# GitHub Actions CI/CD Setup

This workflow automatically deploys your Payroll Calculator to CapRover when you push to the main branch.

## Setup Instructions

### 1. Create GitHub Repository

```bash
cd /Users/urabbani/projects/Payroll-BOWC
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/payroll-calculator.git
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

1. **CAPROVER_SERVER**
   - Value: Your CapRover server URL (e.g., `https://captain.yourdomain.com` or your main CapRover domain)
   - This is NOT the app URL, but your CapRover dashboard URL

2. **CAPROVER_PASSWORD**
   - Value: Your CapRover password (the one you use to login to the dashboard)

3. **CAPROVER_APP_NAME**
   - Value: The name of your app in CapRover (e.g., `payroll-calculator`)

### 3. Create App in CapRover (if not exists)

1. Log into CapRover dashboard
2. Go to "Apps" → "New App"
3. App name: `payroll-calculator` (must match CAPROVER_APP_NAME secret)
4. Deploy method: "Dockerfile"
5. The app will be created but won't deploy until the first GitHub push

### 4. Set Custom Domain

1. In CapRover dashboard → Your App → HTTP Settings
2. Add custom domain: `payroll.square63.org`
3. Enable "Force HTTPS by redirecting all HTTP traffic to HTTPS"

### 5. Test the Pipeline

```bash
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "Test deployment"
git push
```

Check GitHub Actions tab to see the deployment progress!

## How It Works

1. You push code to GitHub (main/master branch)
2. GitHub Actions triggers automatically
3. Workflow checks out code, installs CapRover CLI
4. Logs into your CapRover server
5. Deploys the app using the Dockerfile
6. Your app is live at http://payroll.square63.org/

## Troubleshooting

- **Deployment fails**: Check GitHub Actions logs
- **Can't login**: Verify CAPROVER_SERVER and CAPROVER_PASSWORD secrets
- **App not found**: Make sure CAPROVER_APP_NAME matches the app name in CapRover
- **Domain not working**: Check CapRover app settings for custom domain configuration

