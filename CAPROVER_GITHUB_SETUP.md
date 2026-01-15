# CapRover GitHub Integration Setup

## Fix the Error 1110

The error "Missing required Github/BitBucket/Gitlab field" usually means:

1. **Branch name mismatch** - Your repo uses `main` but CapRover might be set to `master`
2. **Repository URL format** - Should be the full GitHub URL
3. **Missing webhook** - Need to add the webhook URL to GitHub

## Step-by-Step Fix

### Step 1: Update CapRover Settings

In CapRover dashboard → Your app `payroll` → Deployment:

1. **Repository:** `https://github.com/umershujaat/bowc-payroll`
   - ✅ This looks correct

2. **Branch:** Change from `master` to `main`
   - ⚠️ This is likely the issue!
   - Your repository uses `main` branch, not `master`

3. **SSH Key:** Your private key is already added ✅

4. Click **"Save & Restart"**

### Step 2: Add Webhook to GitHub

After saving in CapRover:

1. **Copy the webhook URL** from CapRover (it will appear after you save)
2. Go to: https://github.com/umershujaat/bowc-payroll/settings/hooks
3. Click **"Add webhook"**
4. **Payload URL:** Paste the webhook URL from CapRover
5. **Content type:** `application/json`
6. **Which events:** Select "Just the push event"
7. Click **"Add webhook"**

### Step 3: Test

After setting up:

1. Make a small change:
   ```bash
   echo "<!-- Test webhook -->" >> index.html
   git add .
   git commit -m "Test CapRover webhook"
   git push
   ```

2. Check CapRover dashboard - it should automatically start building

## Alternative: Use GitHub Actions (Current Method)

If the webhook method doesn't work, we can keep using GitHub Actions with SSH keys. The workflow is already set up for that.

## Quick Checklist

- [ ] Branch in CapRover is set to `main` (not `master`)
- [ ] Repository URL is correct: `https://github.com/umershujaat/bowc-payroll`
- [ ] SSH private key is added
- [ ] Webhook URL is added to GitHub
- [ ] Clicked "Save & Restart" in CapRover

