# Testing the ALDEA Faucet

## Quick Start Guide

### 1. Install Dependencies

```bash
cd /Users/matifalcone/Projects/aldea-faucet
npm install
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
# Required
CARDANO_NETWORK=preprod
CARDANO_ADMIN_MNEMONIC=your,mnemonic,words,here
BLOCKFROST_PROJECT_ID=your_project_id
BLOCKFROST_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
BLOCKFROST_WEBHOOK_AUTH_TOKEN=your_webhook_secret_token
FAUCET_WALLET_ADDRESS=addr_test1...
ALDEA_POLICY_ID=your_aldea_policy_id

# Optional (defaults shown)
FRONTEND_URL=http://localhost:3000
ALDEA_ASSET_NAME=ALDEA
FAUCET_AMOUNT=250
MINIMUM_ADA_REQUIRED=2000000
RATE_LIMIT_WINDOW_HOURS=12
```

### 3. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### 4. Open the Frontend

Open your browser and go to: **http://localhost:4000**

You should see a beautiful gradient interface with the ALDEA Faucet.

## Testing the Flow

### Step 1: Request Tokens
1. Enter a valid Cardano address (starts with `addr1` or `addr_test1`)
2. Click "Request Tokens"
3. You should see the faucet address and requirements

### Step 2: Send ADA
1. Copy the faucet address using the copy button
2. Send at least 2 ADA from your wallet to this address
3. Wait for transaction confirmation

### Step 3: Receive ALDEA (Automatic)
1. Once the transaction is confirmed on-chain
2. Blockfrost webhook will trigger
3. The faucet will automatically send 250 ALDEA tokens to your wallet

## Testing Rate Limiting

Try requesting tokens again from the same IP:
- You should receive a 429 error
- Error message will show remaining wait time
- Frontend displays a user-friendly rate limit message

## API Testing with curl

### Request Tokens
```bash
curl -X POST http://localhost:4000/api/v1/faucet/request \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"addr_test1..."}'
```

### Check Faucet Status
```bash
curl http://localhost:4000/api/v1/faucet/status
```

### Test Webhook (locally)
```bash
curl -X POST http://localhost:4000/api/v1/faucet/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_webhook_token" \
  -d '{
    "id": "test-webhook-123",
    "webhook_id": "webhook-id",
    "created": 1234567890,
    "type": "transaction",
    "payload": {
      "tx": {
        "hash": "test-tx-hash"
      }
    }
  }'
```

## Setting up Blockfrost Webhook

For the automatic ALDEA distribution to work, you need to set up a Blockfrost webhook:

1. Go to https://blockfrost.io
2. Navigate to your project → Webhooks
3. Click "Create Webhook"
4. Configure:
   - **Webhook URL**: `https://your-domain.com/api/v1/faucet/webhook`
   - **Trigger**: Transaction
   - **Conditions**: Address equals your faucet wallet address
   - **Auth Header**: `Bearer your_webhook_auth_token`

## Troubleshooting

### Frontend not loading
- Check that the server is running
- Verify `public/` directory exists
- Check browser console for errors

### "Invalid wallet address" error
- Ensure address starts with `addr1` (mainnet) or `addr_test1` (testnet)
- Address should be at least 50 characters

### Webhook not triggering
- Verify Blockfrost webhook is configured correctly
- Check webhook auth token matches your `.env`
- Ensure webhook URL is publicly accessible
- Check server logs for webhook requests

### Rate limit issues
- Rate limit is per IP address
- Default: 12 hours between requests
- Clear by restarting server (in-memory store)
- Wait for the configured time period

### Transaction not found
- Ensure transaction is confirmed on-chain
- Check Blockfrost API is accessible
- Verify `BLOCKFROST_PROJECT_ID` is correct

## Development Tips

### Watch Logs
```bash
tail -f log/log.txt
```

### Check Wallet Balance
Visit: http://localhost:4000/api/v1/faucet/status

### Test with Different IPs
Use a proxy or VPN to test rate limiting with different IP addresses.

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `FRONTEND_URL` to your production domain
3. Configure Blockfrost webhook with production URL
4. Use PM2 for process management:

```bash
npm start
```

## Need Help?

- Check the main README.md for detailed documentation
- Review server logs in `log/log.txt`
- Ensure all environment variables are set correctly
