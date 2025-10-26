const express = require("express");
const validate = require("../../middleware/validate");
const faucetValidation = require("../../validation/faucet.validation");
const faucetController = require("../../controller/faucet.controller");
const { faucetRequestLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

// Request tokens endpoint - rate limiting DISABLED for testing
router.post(
  "/request",
  faucetRequestLimiter,
  validate(faucetValidation.requestTokens),
  faucetController.requestTokens
);

// Blockfrost webhook endpoint - no rate limiting
router.post(
  "/webhook",
  validate(faucetValidation.blockfrostWebhook),
  faucetController.handleWebhook
);

// Get faucet status
router.get("/status", faucetController.getFaucetStatus);

module.exports = router;
