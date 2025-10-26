const httpStatus = require("http-status");
const catchAsync = require("../util/catchAsync");
const faucetService = require("../service/faucet.service");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../util/ApiError");
const { verifyWebhookSignature } = require("@blockfrost/blockfrost-js");

/**
 * Request tokens from faucet (endpoint called by frontend)
 * This endpoint is rate-limited per IP
 */
const requestTokens = catchAsync(async (req, res) => {
  const { walletAddress } = req.body;
  
  logger.info(`Token request from IP: ${req.ip} for wallet: ${walletAddress}`);
  
  const minimumAdaInAda = parseInt(config.faucet.minimumAdaRequired) / 1000000;
  
  // Return the faucet address where user should send payment
  res.status(httpStatus.OK).json({
    success: true,
    message: `Please send at least ${minimumAdaInAda} ADA to the following address. After confirmation, you will receive ${config.faucet.amount} ALDEA tokens.`,
    faucetAddress: config.faucet.walletAddress,
    walletAddress,
    aldeaAmount: config.faucet.amount,
    minimumAdaRequired: minimumAdaInAda,
  });
});

/**
 * Handle Blockfrost webhook
 * This endpoint receives transaction notifications from Blockfrost
 */
const handleWebhook = catchAsync(async (req, res) => {
  // Verify webhook authentication  
  const signatureHeader = req.headers["blockfrost-signature"];
  try {
    verifyWebhookSignature(
      JSON.stringify(req.body), // Stringified request.body (Note: In AWS Lambda you don't need to call JSON.stringify as event.body is already stringified)
      signatureHeader,
      config.blockfrost.webhookAuthToken,
      600 // Optional param to customize maximum allowed age of the webhook event, defaults to 600s
    );
    // Signature is valid, process the event
  } catch (error) {
    // In case of invalid signature verifyWebhookSignature will throw SignatureVerificationError
    // for easier debugging you can access passed signatureHeader and webhookPayload values (error.detail.signatureHeader, error.detail.webhookPayload)
    console.error(error);
    return response.status(400).send("Invalid webhook authentication");
  }
  
  logger.info("Received Blockfrost webhook");
  logger.debug(`Webhook payload: ${JSON.stringify(req.body)}`);
  
  // Process the webhook
  const result = await faucetService.processWebhook(req.body);
  
  res.status(httpStatus.OK).json({
    success: true,
    result,
  });
});

/**
 * Get faucet status and balance
 */
const getFaucetStatus = catchAsync(async (req, res) => {
  const balance = await faucetService.getWalletBalance();
  
  res.status(httpStatus.OK).json({
    success: true,
    faucetAddress: config.faucet.walletAddress,
    balance,
    aldeaAmount: config.faucet.amount,
    minimumAdaRequired: parseInt(config.faucet.minimumAdaRequired) / 1000000,
    rateLimitHours: config.rateLimit.windowHours,
    blockfrost: {
      projectId: config.blockfrost.projectId,
      network: config.cardano.network,
    },
  });
});

module.exports = {
  requestTokens,
  handleWebhook,
  getFaucetStatus,
};
