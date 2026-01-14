# Deploying to CapRover Server

## Quick Deploy via CapRover Dashboard

### Option 1: One-Click Deploy (Recommended)

1. **Prepare your files:**
   - Make sure you have: `index.html`, `app.js`, `styles.css`, `Dockerfile`, `captain-definition`

2. **Create a Git repository:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   git init
   git add index.html app.js styles.css Dockerfile captain-definition .dockerignore
   git commit -m "Initial commit"
   ```

3. **Push to GitHub:**
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/payroll-calculator.git
   git push -u origin main
   ```

4. **Deploy via CapRover:**
   - Log into your CapRover dashboard
   - Go to "Apps" → "One-Click Apps/Dockerfile"
   - Select "Deploy from GitHub"
   - Enter your GitHub repository URL
   - Set app name to: `payroll-calculator` (or any name)
   - Click "Deploy"

### Option 2: Deploy via CapRover CLI

1. **Install CapRover CLI:**
   ```bash
   npm install -g caprover
   ```

2. **Login to your CapRover instance:**
   ```bash
   caprover login
   # Enter your CapRover URL: http://payroll.square63.org
   # Enter your password
   ```

3. **Deploy the app:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   caprover deploy
   ```

### Option 3: Manual Docker Build & Deploy

1. **Build the Docker image:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   docker build -t payroll-calculator .
   ```

2. **Tag and push to your registry (if using):**
   ```bash
   docker tag payroll-calculator your-registry/payroll-calculator
   docker push your-registry/payroll-calculator
   ```

3. **Deploy via CapRover dashboard:**
   - Go to "Apps" → "New App"
   - App name: `payroll-calculator`
   - Deploy method: "Dockerfile"
   - Point to your repository or upload files

## Setting Up Custom Domain

1. **In CapRover Dashboard:**
   - Go to your app settings
   - Under "HTTP Settings" → "Custom Domain"
   - Add domain: `payroll.square63.org`
   - Enable "Force HTTPS by redirecting all HTTP traffic to HTTPS"

2. **DNS Configuration:**
   - Point `payroll.square63.org` to your CapRover server IP
   - Or use CNAME to your main CapRover domain

## Files Needed for Deployment

Essential files:
- ✅ `index.html` - Main HTML file
- ✅ `app.js` - Application logic
- ✅ `styles.css` - Styling
- ✅ `Dockerfile` - Docker configuration
- ✅ `captain-definition` - CapRover configuration

Optional files:
- `README.md` - Documentation
- `.dockerignore` - Exclude unnecessary files

## Verification

After deployment, visit: http://payroll.square63.org

You should see the Payroll Calculator application.

## Troubleshooting

1. **App not loading:**
   - Check CapRover logs: Dashboard → Your App → Logs
   - Verify all files are in the repository
   - Check Dockerfile is correct

2. **404 errors:**
   - Ensure `index.html` is in the correct location
   - Check nginx configuration in Dockerfile

3. **JavaScript errors:**
   - Check browser console for errors
   - Verify CDN links in `index.html` are accessible

