# RSA Keys Generated for Deployment

## Keys Created

I've generated RSA keys for you:
- **Private Key**: `deploy_key` (DO NOT share or commit this!)
- **Public Key**: `deploy_key.pub` (this can be shared)

## Important Security Notes

⚠️ **NEVER commit the private key (`deploy_key`) to GitHub!**
- It's already added to `.gitignore`
- Keep it secure and local

## However, for CapRover CLI...

**CapRover CLI uses password authentication, not SSH keys.**

The error you're seeing is:
```
error: option `-p, --caproverPassword <value>' argument missing
```

This means the `CAPROVER_PASSWORD` secret is missing or empty in GitHub.

## Fix the Current Issue

### Option 1: Use Password (Recommended for CapRover)

1. Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions
2. Check if `CAPROVER_PASSWORD` exists
3. If missing, add it with your CapRover dashboard password
4. If exists, verify the value is correct (no extra spaces)

### Option 2: Use SSH Keys (If CapRover Supports It)

If your CapRover setup supports SSH deployment:

1. **Add public key to CapRover:**
   - Copy the public key: `deploy_key.pub`
   - Add it to your CapRover server's authorized keys

2. **Update GitHub Secrets:**
   - Add `DEPLOY_PRIVATE_KEY` secret with the contents of `deploy_key`
   - Update workflow to use SSH instead of password

## Current Workflow Issue

The workflow is failing because `CAPROVER_PASSWORD` secret is missing.

**Quick Fix:**
1. Go to GitHub Secrets
2. Add/verify `CAPROVER_PASSWORD` secret
3. Push again

## RSA Keys Location

- Private key: `/Users/urabbani/projects/Payroll-BOWC/deploy_key`
- Public key: `/Users/urabbani/projects/Payroll-BOWC/deploy_key.pub`

## If You Want to Use SSH Deployment

I can update the workflow to use SSH keys instead of password authentication. Let me know if you want that approach!

