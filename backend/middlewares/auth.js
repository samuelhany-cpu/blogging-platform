// ✅ Enhanced auth.js
const jwt = require("jsonwebtoken");
const rateLimit = require('express-rate-limit');

// 🛡️ **Token Blacklist (In production, use Redis)**
const tokenBlacklist = new Set();

// 🛡️ **Rate limiting for token verification attempts**
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth attempts per windowMs
  message: { error: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ **Enhanced Token Authentication**
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      error: "Access token missing",
      code: "TOKEN_MISSING" 
    });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ 
      error: "Token has been revoked",
      code: "TOKEN_REVOKED" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration with grace period
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ 
        error: "Token expired",
        code: "TOKEN_EXPIRED" 
      });
    }

    // Attach user info to request
    req.user = decoded;
    req.token = token; // Store token for potential blacklisting
    next();
  } catch (error) {
    let errorMessage = "Invalid token";
    let errorCode = "TOKEN_INVALID";

    if (error.name === 'JsonWebTokenError') {
      errorMessage = "Malformed token";
      errorCode = "TOKEN_MALFORMED";
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = "Token expired";
      errorCode = "TOKEN_EXPIRED";
    }

    return res.status(403).json({ 
      error: errorMessage,
      code: errorCode 
    });
  }
};

// 🛡️ **Role-based Authorization**
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "AUTH_REQUIRED" 
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// 🛡️ **Ownership Verification**
exports.verifyOwnership = (resourceField = 'user_id') => {
  return (req, res, next) => {
    const userId = req.user?.id;
    const resourceUserId = req.body[resourceField] || req.params[resourceField];

    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "AUTH_REQUIRED" 
      });
    }

    if (parseInt(userId) !== parseInt(resourceUserId) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: "Access denied - not resource owner",
        code: "NOT_OWNER" 
      });
    }

    next();
  };
};

// 🛡️ **Token Blacklisting (for logout)**
exports.blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Auto-cleanup after token would expire anyway (24 hours)
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000);
};

// 🛡️ **Rate limiting middleware export**
exports.authRateLimit = authRateLimit;
