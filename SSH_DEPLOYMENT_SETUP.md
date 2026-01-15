# SSH Key Deployment Setup

## Overview

This setup uses SSH keys (public/private) for authentication instead of passwords.

## Step 1: Add Private Key to GitHub Secrets

1. Go to: https://github.com/umershujaat/bowc-payroll/settings/secrets/actions

2. Click **"New repository secret"**

3. Add these secrets:

### Secret 1: DEPLOY_PRIVATE_KEY
- **Name**: `DEPLOY_PRIVATE_KEY`
- **Value**: Copy the entire contents of your `deploy_key` file
  ```bash
  cat /Users/urabbani/projects/Payroll-BOWC/deploy_key
  ```
  Copy everything including:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ... (all the content) ...
  -----END OPENSSH PRIVATE KEY-----
  ```

### Secret 2: CAPROVER_SERVER
- **Name**: `CAPROVER_SERVER`
- **Value**: Your CapRover dashboard URL
  - Example: `https://captain.square63.org`
  - Must include `https://`

### Secret 3: CAPROVER_APP_NAME
- **Name**: `CAPROVER_APP_NAME`
- **Value**: `payroll`

### Secret 4: SSH_HOST (Optional - if different from CapRover server)
- **Name**: `SSH_HOST`
- **Value**: Your server's SSH hostname/IP
  - Example: `captain.square63.org` or IP address
  - Only needed if SSH host is different from CapRover server

### Secret 5: SSH_USER (Optional - defaults to root)
- **Name**: `SSH_USER`
- **Value**: SSH username (usually `root` or `captain`)
  - Default: `root` if not set

## Step 2: Add Public Key to CapRover Server

You need to add your public key to the CapRover server's authorized_keys:

1. **Get your public key:**
   ```bash
   cat /Users/urabbani/projects/Payroll-BOWC/deploy_key.pub
   ```

2. **Add to CapRover server:**
   - SSH into your CapRover server
   - Add the public key to `~/.ssh/authorized_keys`
   ```bash
   # On your CapRover server
   echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDjkRfT2DwTsqyeNZpSCbCdeqEkLW6bMiUJaq8uHmugFc7Mf4n+6YdHl1XDqIPfAdllYXLPUCqCB1Ky0DZCg5yCAwCazeGCaWbhlQgDkKbMf0rWUiTkNJS1AWCsCEDv02ua2dC2MNVQmsRrEr5D38XMq347th4ouqKj7chH4xF80oVZjhuQXyYxJb4YweSaMeLwa04ojcmwAxzrffXoYjyUZAWUHh/mLPC8HXgMsyuF6DtDCvDhFUIQ6qPP8U7KqgawQ8huPRS3IdcDoyNBRpJ055uJL+56JGYU5l1+iblbP+jaVR7fQLLhc0ZtdXNNG8My+kLVdsiR/sn0NB9W2GBZQFwim7mjXyWsF/FLe0gz2NH7GG+ntan8GHH/6TMu0AedtMYqgRpn3f1gSwDskU4fHUXj8YkKIAVwPzbot6gi/WUfVlZ8MiMv534zYRJGcb3zz8f7oiWDz6+/y1zOtL8qZIvWOmaLZ9WQP2Uy/rxtVEKV+yl85jDd/rof+eqc6dnWaYPAFOabsi1p+xzqlJApstV6Z5PK28EO+zQGruqWWUmqk9u5lzJg5EhKAzNDDE4j5fNjcmuv1lY7UMUVFeV1UCetITY2RqHTjyjtj1Ec7JkSeqsj0hNJRhkmJ/U3ngW5oTa+PY0kyep/4mIVNeSItLLEwbJI4nc52EXhy6S4hQ== caprover-deploy-key" >> ~/.ssh/authorized_keys
   ```

## Step 3: Alternative - Direct Docker Deployment via SSH

If CapRover CLI over SSH doesn't work, we can deploy directly:

The workflow will:
1. SSH into your server
2. Clone/pull the repository
3. Build Docker image
4. Deploy using CapRover CLI on the server

## Step 4: Test Deployment

After setting up secrets:

```bash
cd /Users/urabbani/projects/Payroll-BOWC
git add .
git commit -m "Test SSH key deployment"
git push
```

Check:
- GitHub Actions: https://github.com/umershujaat/bowc-payroll/actions
- Your site: http://www.payroll.square63.org/

## Your Public Key

Your public key is:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDjkRfT2DwTsqyeNZpSCbCdeqEkLW6bMiUJaq8uHmugFc7Mf4n+6YdHl1XDqIPfAdllYXLPUCqCB1Ky0DZCg5yCAwCazeGCaWbhlQgDkKbMf0rWUiTkNJS1AWCsCEDv02ua2dC2MNVQmsRrEr5D38XMq347th4ouqKj7chH4xF80oVZjhuQXyYxJb4YweSaMeLwa04ojcmwAxzrffXoYjyUZAWUHh/mLPC8HXgMsyuF6DtDCvDhFUIQ6qPP8U7KqgawQ8huPRS3IdcDoyNBRpJ055uJL+56JGYU5l1+iblbP+jaVR7fQLLhc0ZtdXNNG8My+kLVdsiR/sn0NB9W2GBZQFwim7mjXyWsF/FLe0gz2NH7GG+ntan8GHH/6TMu0AedtMYqgRpn3f1gSwDskU4fHUXj8YkKIAVwPzbot6gi/WUfVlZ8MiMv534zYRJGcb3zz8f7oiWDz6+/y1zOtL8qZIvWOmaLZ9WQP2Uy/rxtVEKV+yl85jDd/rof+eqc6dnWaYPAFOabsi1p+xzqlJApstV6Z5PK28EO+zQGruqWWUmqk9u5lzJg5EhKAzNDDE4j5fNjcmuv1lY7UMUVFeV1UCetITY2RqHTjyjtj1Ec7JkSeqsj0hNJRhkmJ/U3ngW5oTa+PY0kyep/4mIVNeSItLLEwbJI4nc52EXhy6S4hQ== caprover-deploy-key
```

Add this to your CapRover server's `~/.ssh/authorized_keys` file.

