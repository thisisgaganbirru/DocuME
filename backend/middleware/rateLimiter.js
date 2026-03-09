const rateLimit = require('express-rate-limit');

let config;
try { config = require('../config'); } catch(e) { config = { rateLimit: { windowMs: 15 * 60 * 1000, max: 100 } }; }

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes'
  },
  handler: (req, res, next, options) => {
    let logger;
    try { logger = require('../utils/logger'); } catch(e) { logger = console; }
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Stricter limit for conversion endpoints
const conversionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 conversions per 15 min
  message: { error: 'Conversion limit reached, please wait before converting more files.' }
});

module.exports = { limiter, conversionLimiter };
