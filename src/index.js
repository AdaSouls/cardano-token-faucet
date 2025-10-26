const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");

let server;

/*
|--------------------------------------------------------------------------
| Error handling.
|--------------------------------------------------------------------------
*/

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

server = app.listen(config.port, () => {
  logger.info(`Listening to port ${config.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Faucet address: ${config.faucet.walletAddress}`);
  logger.info(`Rate limit: ${config.rateLimit.windowHours} hours`);
});

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
