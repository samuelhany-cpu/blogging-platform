// backend/middlewares/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');

// 🛡️ **1. HELMET - Security Headers**
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow images from different origins
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// 🛡️ **2. RATE LIMITING - DoS Protection**
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for successful requests in development
  skip: (req, res) => process.env.NODE_ENV === 'development' && res.statusCode < 400
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many upload attempts, please try again later.',
    retryAfter: '1 hour'
  }
});

// 🛡️ **3. SLOW DOWN - Gradual Response Delay**
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: () => 500, // Fixed: Use function for new behavior
  validate: { delayMs: false } // Disable warning
});

// 🛡️ **4. HTTP Parameter Pollution Protection**
const hppProtection = hpp({
  whitelist: ['tags', 'category'] // Allow arrays for these parameters
});

// 🛡️ **5. Request Logging**
const requestLogger = morgan('combined', {
  // Log only 4xx and 5xx responses for security monitoring
  skip: function (req, res) { 
    return res.statusCode < 400 && process.env.NODE_ENV !== 'development';
  }
});

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  uploadLimiter,
  speedLimiter,
  hppProtection,
  requestLogger,
  compression: compression()
};
