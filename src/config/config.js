const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "local", "test")
      .required(),
    HOST: Joi.string().default("localhost"),
    PORT: Joi.number().default(4000),
    FRONTEND_URL: Joi.string().required().description("Frontend URL for CORS"),
    LOG_FILE: Joi.string().default("log/log.txt"),
    
    // Cardano/Blockfrost
    CARDANO_NETWORK: Joi.string()
      .valid("mainnet", "preprod", "preview")
      .required(),
    CARDANO_ADMIN_MNEMONIC: Joi.string().required(),
    BLOCKFROST_PROJECT_ID: Joi.string().required(),
    BLOCKFROST_BASE_URL: Joi.string().required(),
    BLOCKFROST_WEBHOOK_AUTH_TOKEN: Joi.string().required().description("Token to verify webhook requests"),
    
    // Faucet settings
    FAUCET_WALLET_ADDRESS: Joi.string().required().description("Address to monitor for incoming payments"),
    ALDEA_POLICY_ID: Joi.string().required().description("ALDEA token policy ID"),
    ALDEA_ASSET_NAME: Joi.string().default("ALDEA").description("ALDEA token asset name"),
    FAUCET_AMOUNT: Joi.string().default("250").description("Amount of ALDEA to send (in smallest unit)"),
    MINIMUM_ADA_REQUIRED: Joi.string().default("2000000").description("Minimum ADA required in lovelace (default: 2 ADA)"),
    
    // Rate limiting
    RATE_LIMIT_WINDOW_HOURS: Joi.number().default(12).description("Rate limit window in hours"),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  host: envVars.HOST,
  port: envVars.PORT,
  frontendUrl: envVars.FRONTEND_URL,
  logFile: envVars.LOG_FILE,
  
  cardano: {
    network: envVars.CARDANO_NETWORK,
    adminMnemonic: envVars.CARDANO_ADMIN_MNEMONIC,
  },
  
  blockfrost: {
    projectId: envVars.BLOCKFROST_PROJECT_ID,
    baseUrl: envVars.BLOCKFROST_BASE_URL,
    webhookAuthToken: envVars.BLOCKFROST_WEBHOOK_AUTH_TOKEN,
  },
  
  faucet: {
    walletAddress: envVars.FAUCET_WALLET_ADDRESS,
    aldeaPolicyId: envVars.ALDEA_POLICY_ID,
    aldeaAssetName: envVars.ALDEA_ASSET_NAME,
    amount: envVars.FAUCET_AMOUNT,
    minimumAdaRequired: envVars.MINIMUM_ADA_REQUIRED,
  },
  
  rateLimit: {
    windowHours: envVars.RATE_LIMIT_WINDOW_HOURS,
  },
};
