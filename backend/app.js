// 🛡️ Enhanced app.js with Security
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
require("dotenv").config();

// 🛡️ Import security middlewares
const {
  helmetConfig,
  generalLimiter,
  speedLimiter,
  hppProtection,
  requestLogger,
  compression
} = require('./middlewares/security');
const { sanitizeInput } = require('./middlewares/validation');
const errorHandler = require('./middlewares/errorHandler');

// 🛡️ **1. SECURITY HEADERS (First)**
app.use(helmetConfig);

// 🛡️ **2. REQUEST LOGGING**
app.use(requestLogger);

// 🛡️ **3. COMPRESSION**
app.use(compression);

// 🛡️ **4. CORS Configuration**
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// 🛡️ **5. RATE LIMITING & SECURITY**
app.use(generalLimiter);
app.use(speedLimiter);
app.use(hppProtection);

// �️ **6. BODY PARSING (with limits)**
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '10mb'
}));

// 🛡️ **7. INPUT SANITIZATION**
app.use(sanitizeInput);

// 🛡️ **8. SECURE STATIC FILE SERVING**
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Prevent script execution in upload directory
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    
    // Only allow images
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      res.status(403).end();
    }
  }
}));

// 🛡️ **9. SECURITY HEADERS FOR API**
app.use('/api', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 🚏 Import route files
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");

// 🔗 Mount routes
app.use("/api/auth", authRoutes);
app.use("/api", articleRoutes);
app.use("/api", commentRoutes);
app.use("/api", userRoutes);

// 🛡️ **10. 404 Handler**
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 🛡️ **11. ERROR HANDLER (Last)**
app.use(errorHandler);

module.exports = app;
