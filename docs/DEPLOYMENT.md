# Railway Deployment Guide

## Prerequisites
- GitHub account with this repository pushed
- Railway account (sign up at https://railway.app)

## Deployment Steps

### 1. Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select the `cardano-token-faucet` repository

### 2. Configure Environment Variables

Railway will auto-detect your Node.js app. Now add your environment variables:

1. In Railway dashboard, click on your project
2. Go to **"Variables"** tab
3. Add the following variables (copy from your `.env` file):

```
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
FRONTEND_URL=https://your-app.railway.app

CARDANO_NETWORK=preprod
CARDANO_ADMIN_MNEMONIC=your_private_key_here
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
BLOCKFROST_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
BLOCKFROST_WEBHOOK_AUTH_TOKEN=your_webhook_auth_token

FAUCET_WALLET_ADDRESS=your_faucet_wallet_address
ALDEA_POLICY_ID=your_aldea_policy_id
ALDEA_ASSET_NAME=ALDEA
FAUCET_AMOUNT=250
MINIMUM_ADA_REQUIRED=2000000

RATE_LIMIT_WINDOW_HOURS=12
```

**Important:** After adding variables, update `FRONTEND_URL` with your actual Railway URL (see step 3).

### 3. Get Your Railway URL

1. Railway will automatically deploy your app
2. Click **"Settings"** → **"Networking"** → **"Generate Domain"**
3. Copy the generated URL (e.g., `https://aldea-faucet-production.up.railway.app`)
4. Go back to **"Variables"** and update `FRONTEND_URL` with this URL

### 4. Configure Blockfrost Webhook

1. Go to [Blockfrost Dashboard](https://blockfrost.io)
2. Navigate to **Webhooks**
3. Create a new webhook:
   - **URL:** `https://your-railway-url.railway.app/api/v1/faucet/webhook`
   - **Auth Token:** Your `BLOCKFROST_WEBHOOK_AUTH_TOKEN` value
   - **Event Type:** Transaction (for your faucet wallet address)

### 5. Test Your Deployment

1. Visit your Railway URL
2. Connect a wallet
3. Test the faucet flow
4. Check Railway logs: **"Deployments"** → **"View Logs"**

## Railway Features

- ✅ **Auto-deploy on git push** - Push to main branch = automatic deployment
- ✅ **Free tier** - $5/month free credit (usually enough for small apps)
- ✅ **Easy scaling** - Upgrade plan if needed
- ✅ **Logs** - Real-time logs in dashboard
- ✅ **Metrics** - CPU, Memory, Network usage

## Troubleshooting

### Deployment Failed
- Check Railway logs for errors
- Ensure all environment variables are set
- Verify your `package.json` has correct start script

### App Not Loading
- Check if Railway generated a domain
- Verify `FRONTEND_URL` matches your Railway URL
- Check CORS settings in `src/app.js`

### Webhook Not Working
- Verify webhook URL in Blockfrost dashboard
- Check `BLOCKFROST_WEBHOOK_AUTH_TOKEN` matches
- View Railway logs when webhook fires

## Updating Your App

1. Push changes to GitHub: `git push origin main`
2. Railway auto-deploys the new version
3. Watch deployment progress in Railway dashboard

## Local Development

Run locally with:
```bash
npm run dev
```

Use production-like environment:
```bash
npm start
```
