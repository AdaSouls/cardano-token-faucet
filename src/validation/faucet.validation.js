const Joi = require("joi");

const requestTokens = {
  body: Joi.object().keys({
    walletAddress: Joi.string().required(),
  }),
};

const blockfrostWebhook = {
  body: Joi.object().keys({
    id: Joi.string().required(),
    webhook_id: Joi.string().required(),
    created: Joi.number().required(),
    api_version: Joi.number().optional(),
    type: Joi.string().required(),
    payload: Joi.alternatives().try(
      Joi.array().items(Joi.object()),
      Joi.object()
    ).required(),
  }),
};

module.exports = {
  requestTokens,
  blockfrostWebhook,
};
