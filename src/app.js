const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const xss = require("xss-clean");
const httpStatus = require("http-status");
const path = require("path");
const config = require("./config/config");
const morgan = require("./config/morgan");
const routesV1 = require("./route/v1");
const { errorConverter, errorHandler } = require("./middleware/error");
const ApiError = require("./util/ApiError");

const app = express();

// morgan logger
if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers with CSP configuration for inline scripts and CDN
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://esm.sh", "https://cdn.jsdelivr.net"],
        scriptSrcElem: ["'self'", "'unsafe-inline'", "https://esm.sh", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://cardano-preprod.blockfrost.io", "https://cardano-mainnet.blockfrost.io", "https://esm.sh", "https://cdn.jsdelivr.net"],
        workerSrc: ["'self'", "blob:"],
      },
    },
  })
);

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors - allow configured frontend URL and same-origin
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Allow configured frontend URL
      if (origin === config.frontendUrl) {
        return callback(null, true);
      }
      
      // Allow same-origin requests (frontend served from same server)
      const serverUrl = `http://${config.host}:${config.port}`;
      if (origin === serverUrl || origin.startsWith(`http://localhost:${config.port}`)) {
        return callback(null, true);
      }
      
      // Allow Railway and custom domains
      if (origin.includes('railway.app') || origin.includes('aldea.world')) {
        return callback(null, true);
      }
      
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.options("*", cors());

// see "Troubleshooting Proxy" section here https://www.npmjs.com/package/express-rate-limit
app.set("trust proxy", 2);

// serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// health check endpoint
app.get("/health", (req, res) => {
  res.status(httpStatus.OK).json({ status: "ok", timestamp: new Date().toISOString() });
});

// v1 api routes
app.use("/api/v1", routesV1);

// send back a 404 error for any unknown api request (but not for frontend routes)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
  } else {
    // Serve index.html for any non-API routes (SPA fallback)
    res.sendFile(path.join(__dirname, "../public/index.html"));
  }
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
