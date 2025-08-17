// backend/middlewares/validation.js
const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// 🛡️ **Custom Validation Helper**
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// 🛡️ **Sanitization Middleware**
const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs to prevent XSS
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Basic XSS protection - strip HTML tags but preserve content
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return sanitizeValue(obj);
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  next();
};

// 🛡️ **User Registration Validation**
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .custom(async (value) => {
      // Check for reserved usernames
      const reservedNames = ['admin', 'root', 'api', 'www', 'mail', 'support'];
      if (reservedNames.includes(value.toLowerCase())) {
        throw new Error('Username is reserved');
      }
      return true;
    }),

  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email too long'),

  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain: lowercase, uppercase, number, and special character'),

  handleValidationErrors
];

// 🛡️ **User Login Validation**
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ max: 128 })
    .withMessage('Password too long'),

  handleValidationErrors
];

// 🛡️ **Article Validation**
const validateArticle = [
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be 3-255 characters')
    .trim(),

  body('content')
    .isLength({ min: 10, max: 50000 })
    .withMessage('Content must be 10-50000 characters')
    .custom((value) => {
      // Allow some HTML but sanitize dangerous elements
      const cleaned = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: []
      });
      return cleaned;
    }),

  body('category')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be 1-100 characters')
    .matches(/^[a-zA-Z0-9\s-_]+$/)
    .withMessage('Category can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),

  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        if (value.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
        value.forEach(tag => {
          if (typeof tag !== 'string' || tag.length > 50) {
            throw new Error('Each tag must be a string under 50 characters');
          }
        });
      } else if (typeof value === 'string') {
        if (value.length > 500) {
          throw new Error('Tags string too long');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// 🛡️ **Comment Validation**
const validateComment = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be 1-1000 characters')
    .trim(),

  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid article ID required'),

  handleValidationErrors
];

// 🛡️ **ID Parameter Validation**
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID required'),

  handleValidationErrors
];

// 🛡️ **Search Query Validation**
const validateSearch = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query too long')
    .trim(),

  query('tag')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tag too long')
    .matches(/^[a-zA-Z0-9\s-_]+$/)
    .withMessage('Invalid tag format'),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Invalid page number'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Invalid limit'),

  handleValidationErrors
];

module.exports = {
  sanitizeInput,
  validateUserRegistration,
  validateUserLogin,
  validateArticle,
  validateComment,
  validateId,
  validateSearch,
  handleValidationErrors
};
