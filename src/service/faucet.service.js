const { BlockfrostProvider, MeshWallet, Transaction } = require("@meshsdk/core");
const config = require("../config/config");
const logger = require("../config/logger");
const httpStatus = require("http-status");
const ApiError = require("../util/ApiError");

// Initialize Blockfrost provider
const blockfrostProvider = new BlockfrostProvider(config.blockfrost.projectId);

// Initialize wallet
let faucetWallet;
try {
  faucetWallet = new MeshWallet({
    networkId: config.cardano.network === "mainnet" ? 1 : 0,
    fetcher: blockfrostProvider,
    submitter: blockfrostProvider,
  key: {
    type: 'mnemonic',
    words: config.cardano.adminMnemonic.split(',').map(word => word.trim()),
  },
  });
  logger.info("Faucet wallet initialized successfully");
} catch (error) {
  logger.error("Failed to initialize faucet wallet:", error);
}

/**
 * Process Blockfrost webhook for transaction
 * @param {Object} webhookData - Webhook payload from Blockfrost
 */
const processWebhook = async (webhookData) => {
  try {
    logger.info(`Processing webhook: ${webhookData.id}`);
    
    const { type, payload } = webhookData;
    
    // Handle transaction event
    if (type === "transaction") {
      // Blockfrost sends payload as an array, get the first transaction
      const txData = Array.isArray(payload) ? payload[0] : payload;
      const txHash = txData.tx?.hash || txData.hash;
      
      if (!txHash) {
        logger.error(`No transaction hash found in payload: ${JSON.stringify(payload)}`);
        return { success: false, message: "No transaction hash in payload" };
      }
      
      logger.info(`Processing transaction: ${txHash}`);
      
      // Get transaction details from Blockfrost
      const txDetails = await blockfrostProvider.get(`/txs/${txHash}`);
      const txUtxos = await blockfrostProvider.get(`/txs/${txHash}/utxos`);
      
      logger.info(`Transaction details: ${JSON.stringify(txDetails)}`);
      
      // Find outputs to our faucet wallet
      const outputsToFaucet = txUtxos.outputs.filter(
        (output) => output.address === config.faucet.walletAddress
      );
      
      if (outputsToFaucet.length === 0) {
        logger.info("Transaction does not include payment to faucet address");
        return { success: false, message: "No payment to faucet address" };
      }
      
      // Calculate total ADA sent to faucet
      const totalAdaSent = outputsToFaucet.reduce((sum, output) => {
        const adaAmount = output.amount.find((asset) => asset.unit === "lovelace");
        return sum + parseInt(adaAmount?.quantity || 0);
      }, 0);
      
      logger.info(`Total ADA sent to faucet: ${totalAdaSent} lovelace`);
      
      // Validate minimum ADA requirement
      const minimumRequired = parseInt(config.faucet.minimumAdaRequired);
      if (totalAdaSent < minimumRequired) {
        const message = `Insufficient ADA received. Minimum required: ${minimumRequired / 1000000} ADA (${minimumRequired} lovelace), but received: ${totalAdaSent / 1000000} ADA (${totalAdaSent} lovelace)`;
        logger.warn(message);
        return { success: false, message };
      }
      
      // Find the sender address (first input address)
      const senderAddress = txUtxos.inputs[0]?.address;
      
      if (!senderAddress) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Could not determine sender address");
      }
      
      logger.info(`Sender address: ${senderAddress}`);
      logger.info(`ADA requirement met. Proceeding to send ${config.faucet.amount} ALDEA tokens`);
      
      // Send ALDEA tokens back to sender
      const result = await sendAldeaTokens(senderAddress, totalAdaSent);
      
      return result;
    }
    
    return { success: false, message: "Unsupported webhook type" };
  } catch (error) {
    logger.error(`Error processing webhook: ${error.message}`);
    throw error;
  }
};

/**
 * Send ALDEA tokens to a recipient
 * @param {string} recipientAddress - Cardano address to send tokens to
 * @param {number} adaSent - Amount of ADA sent by the user (in lovelace)
 */
const sendAldeaTokens = async (recipientAddress, adaSent = 0) => {
  try {
    if (!faucetWallet) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Faucet wallet not initialized");
    }
    
    logger.info(`Preparing to send ${config.faucet.amount} ALDEA to ${recipientAddress}`);
    
    // Get wallet address
    const walletAddress = await faucetWallet.getChangeAddress();
    logger.info(`Faucet wallet address: ${walletAddress}`);
    
    // Build the asset ID
    const assetId = config.faucet.aldeaPolicyId + config.faucet.aldeaAssetName;
    
    // Create transaction
    const tx = new Transaction({ initiator: faucetWallet });
    
    // Send tokens to recipient
    tx.sendAssets(
      {
        address: recipientAddress,
        datum: undefined,
      },
      [
        {
          unit: assetId,
          quantity: config.faucet.amount,
        },
      ]
    );
    
    // Build and sign transaction
    const unsignedTx = await tx.build();
    const signedTx = await faucetWallet.signTx(unsignedTx);
    
    // Submit transaction
    const txHash = await faucetWallet.submitTx(signedTx);
    
    logger.info(`Transaction submitted successfully. Hash: ${txHash}`);
    
    return {
      success: true,
      txHash,
      recipient: recipientAddress,
      aldeaAmount: config.faucet.amount,
      adaSent: adaSent,
    };
  } catch (error) {
    logger.error(`Error sending ALDEA tokens: ${error.message}`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send tokens: ${error.message}`
    );
  }
};

/**
 * Get faucet wallet balance
 */
const getWalletBalance = async () => {
  try {
    if (!faucetWallet) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Faucet wallet not initialized");
    }
    
    const balance = await faucetWallet.getBalance();
    const assets = await faucetWallet.getAssets();
    
    return {
      lovelace: balance,
      assets,
    };
  } catch (error) {
    logger.error(`Error getting wallet balance: ${error.message}`);
    throw error;
  }
};

module.exports = {
  processWebhook,
  sendAldeaTokens,
  getWalletBalance,
};
