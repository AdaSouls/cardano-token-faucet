const rateLimit = require("express-rate-limit");
const config = require("../config/config");

// In-memory store for rate limiting
const requestStore = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = config.rateLimit.windowHours * 60 * 60 * 1000;
  
  for (const [key, value] of requestStore.entries()) {
    if (now - value.resetTime > windowMs) {
      requestStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

const customStore = {
  init: (options) => {},
  increment: (key) => {
    const now = Date.now();
    const windowMs = config.rateLimit.windowHours * 60 * 60 * 1000;
    
    if (!requestStore.has(key)) {
      requestStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        totalHits: 1,
        resetTime: new Date(now + windowMs),
      };
    }
    
    const record = requestStore.get(key);
    
    // Check if window has expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }
    
    return {
      totalHits: record.count,
      resetTime: new Date(record.resetTime),
    };
  },
  decrement: (key) => {
    const record = requestStore.get(key);
    if (record && record.count > 0) {
      record.count -= 1;
    }
  },
  resetKey: (key) => {
    requestStore.delete(key);
  },
  resetAll: () => {
    requestStore.clear();
  },
};

const faucetRequestLimiter = rateLimit({
  windowMs: config.rateLimit.windowHours * 60 * 60 * 1000, // 12 hours by default
  max: 1, // 1 request per window
  standardHeaders: true,
  legacyHeaders: false,
  store: customStore,
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      message: `Too many requests. You can only request ALDEA tokens once every ${config.rateLimit.windowHours} hours. Please try again later.`,
    });
  },
});

module.exports = {
  faucetRequestLimiter,
};
