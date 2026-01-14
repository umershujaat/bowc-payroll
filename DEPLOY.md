# How to Share the Payroll Calculator Tool

## Option 1: GitHub Pages (Free & Easy - Recommended)

1. **Create a GitHub account** (if you don't have one): https://github.com

2. **Create a new repository:**
   - Go to GitHub and click "New repository"
   - Name it: `payroll-calculator` (or any name you like)
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README

3. **Upload your files:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   git init
   git add index.html app.js styles.css README.md
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/payroll-calculator.git
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "main" branch
   - Click "Save"
   - Your site will be live at: `https://YOUR_USERNAME.github.io/payroll-calculator`

5. **Share the URL** with your co-workers!

## Option 2: Netlify (Free, Drag & Drop)

1. Go to https://www.netlify.com
2. Sign up for free account
3. Drag and drop your project folder onto Netlify
4. Get instant URL to share!

## Option 3: Vercel (Free)

1. Go to https://vercel.com
2. Sign up for free account
3. Import your project folder
4. Get instant URL to share!

## Option 4: Share Files Directly

1. **Zip the files:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   zip -r payroll-calculator.zip index.html app.js styles.css README.md
   ```

2. **Share via:**
   - Email the zip file
   - Google Drive / Dropbox
   - USB drive
   - Company shared drive

3. **Co-workers extract and:**
   - Open `index.html` in their browser, OR
   - Run: `python3 -m http.server 8000` and open `http://localhost:8000`

## Option 5: Local Network Sharing (Same Office Network)

1. **On your computer, start a server:**
   ```bash
   cd /Users/urabbani/projects/Payroll-BOWC
   python3 -m http.server 8000
   ```

2. **Find your IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   (Look for something like `192.168.1.100`)

3. **Share the URL:** `http://YOUR_IP_ADDRESS:8000`
   - Co-workers on the same network can access it!

## Option 6: Company Web Server

If your company has a web server, ask IT to host it there.

---

## Recommended: GitHub Pages

GitHub Pages is the easiest and most professional option. It's:
- ✅ Free
- ✅ Always accessible (no need for your computer to be on)
- ✅ Easy to update (just push changes)
- ✅ Professional URL
- ✅ No server maintenance needed

