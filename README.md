# ALDEA Faucet Server

A Cardano-based faucet server that automatically sends ALDEA tokens to users who send ADA to the faucet address. Built with Express.js, Blockfrost webhooks, and MeshSDK. **Includes a beautiful web interface for easy testing.**

## Features

- **Beautiful Web Interface**: Modern, gradient UI for easy testing and interaction
- **Blockfrost Webhook Integration**: Listens for incoming transactions via Blockfrost webhooks
- **Automatic Token Distribution**: Sends ALDEA tokens to users who send at least 2 ADA to the faucet
- **Minimum ADA Validation**: Ensures users send the required amount before distributing tokens
- **IP-based Rate Limiting**: Prevents abuse with configurable rate limits (default: 12 hours)
- **Secure**: Built with helmet, xss-clean, and proper authentication for webhooks
- **Production Ready**: Includes PM2 configuration, logging with Winston, and proper error handling

## Tech Stack

- **Node.js** with **Express.js**
- **@meshsdk/core** for Cardano transactions
- **Blockfrost** for blockchain data and webhooks
- **express-rate-limit** for IP-based rate limiting
- **Winston** for logging
- **PM2** for process management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AdaSouls/cardano-token-faucet.git
cd cardano-token-faucet
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - Set your Cardano admin private key
   - Set your Blockfrost project ID and webhook auth token
   - Set your faucet wallet address
   - Set your ALDEA token policy ID
   - Configure rate limiting and other settings

## Configuration

### Environment Variables

- **CARDANO_ADMIN_MNEMONIC**: Mnemonic words for the faucet wallet (comma-separated)
- **BLOCKFROST_PROJECT_ID**: Your Blockfrost project ID
- **BLOCKFROST_WEBHOOK_AUTH_TOKEN**: Authentication token for webhook requests
- **FAUCET_WALLET_ADDRESS**: The Cardano address that receives payments
- **ALDEA_POLICY_ID**: The policy ID of the ALDEA token
- **ALDEA_ASSET_NAME**: The asset name of the ALDEA token (default: ALDEA)
- **FAUCET_AMOUNT**: Amount of ALDEA to send (default: 250)
- **MINIMUM_ADA_REQUIRED**: Minimum ADA required in lovelace (default: 2000000 = 2 ADA)
- **RATE_LIMIT_WINDOW_HOURS**: Hours between requests from the same IP (default: 12)

### Setting up Blockfrost Webhook

1. Go to [Blockfrost Dashboard](https://blockfrost.io)
2. Navigate to Webhooks
3. Create a new webhook with:
   - **URL**: `https://your-domain.com/api/v1/faucet/webhook`
   - **Type**: Transaction
   - **Filter**: Your faucet wallet address
   - **Auth Header**: `Bearer YOUR_WEBHOOK_AUTH_TOKEN`

## Deployment

### Railway (Recommended)

For production deployment, we recommend **Railway.app** which handles Express apps perfectly.

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Railway deployment guide.**

Quick start:
1. Push your code to GitHub
2. Create a Railway project from your repo
3. Add environment variables
4. Railway auto-deploys! 🚀

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Once the server is running, the frontend will be available at:
- **Local**: `http://localhost:4000`
- **Production**: Your deployed domain (e.g., Railway URL)

## Frontend

A simple web interface is included at `/public` for testing the faucet:

### Features
- Clean, modern UI with gradient design
- Wallet address validation
- Copy faucet address to clipboard
- Real-time error handling and rate limit display
- Mobile responsive

### Using the Frontend

1. Open `http://localhost:4000` in your browser
2. Enter your Cardano wallet address
3. Click "Request Tokens"
4. Copy the faucet address and send the minimum required ADA
5. Wait for Blockfrost webhook to confirm and send ALDEA tokens automatically

## API Endpoints

### POST `/api/v1/faucet/request`

Request ALDEA tokens from the faucet. Rate limited per IP.

**Request Body:**
```json
{
  "walletAddress": "addr1..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Please send at least 2 ADA to the following address. After confirmation, you will receive 250 ALDEA tokens.",
  "faucetAddress": "addr1...",
  "walletAddress": "addr1...",
  "amount": "250"
}
```

### POST `/api/v1/faucet/webhook`

Blockfrost webhook endpoint. Requires authentication header.

**Headers:**
```
Authorization: Bearer YOUR_WEBHOOK_AUTH_TOKEN
```

### GET `/api/v1/faucet/status`

Get faucet status and balance.

**Response:**
```json
{
  "success": true,
  "faucetAddress": "addr1...",
  "balance": {
    "lovelace": "1000000000",
    "assets": [...]
  },
  "aldeaAmount": "250",
  "rateLimitHours": 12
}
```

### GET `/health`

Health check endpoint.

## How It Works

1. **User Request**: User calls `/api/v1/faucet/request` with their wallet address (rate limited per IP)
2. **Payment**: User sends at least 2 ADA (configurable) to the faucet wallet address
3. **Blockfrost Webhook**: When transaction is confirmed, Blockfrost sends webhook to `/api/v1/faucet/webhook`
4. **Validation**: Server validates that the minimum ADA requirement was met
5. **Token Distribution**: Server automatically sends 250 ALDEA tokens (configurable) back to the sender's address
6. **Rate Limiting**: Same IP cannot request again for 12 hours (configurable)

## Security

- Minimum ADA requirement prevents spam and ensures commitment
- Rate limiting prevents abuse (12-hour cooldown per IP)
- Webhook authentication ensures only Blockfrost can trigger token distribution
- Input validation on all endpoints
- Helmet for security headers
- XSS protection
- CORS configured for specific frontend origin

## Logging

Logs are written to:
- Console (with colors in development)
- File specified in `LOG_FILE` environment variable

## Project Structure

```
cardano-token-faucet/
├── src/
│   ├── config/           # Configuration files
│   ├── controller/       # Request handlers
│   ├── middleware/       # Express middleware
│   ├── route/            # API routes
│   ├── service/          # Business logic
│   ├── util/             # Utility functions
│   ├── validation/       # Request validation schemas
│   ├── app.js            # Express app setup
│   └── index.js          # Server entry point
├── public/               # Frontend static files
│   ├── index.html        # Main HTML page
│   ├── styles.css        # CSS styling
│   └── script.js         # Frontend JavaScript
├── log/                  # Log files
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md             # This file
```

## License

MIT
