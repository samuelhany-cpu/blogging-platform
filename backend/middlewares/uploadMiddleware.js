// 🛡️ Enhanced uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// 🛡️ **File Type Validation**
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/webp"
];

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

// 🛡️ **Secure filename generation**
const generateSecureFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomBytes}${ext}`;
};

// 🛡️ **File signature validation (Magic bytes)**
const validateFileSignature = (buffer, mimetype) => {
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46],
    'image/webp': [0x52, 0x49, 0x46, 0x46] // First 4 bytes of RIFF
  };

  const signature = signatures[mimetype];
  if (!signature) return false;

  return signature.every((byte, index) => buffer[index] === byte);
};

// 🛡️ **Enhanced storage configuration**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads");
    
    // Ensure upload directory exists and is secure
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  },
});

// 🛡️ **Enhanced file filter**
const fileFilter = (req, file, cb) => {
  // 1. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`),
      false
    );
  }

  // 2. Check file extension
  if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
    return cb(
      new Error("Invalid file extension"),
      false
    );
  }

  // 3. Check for dangerous filenames
  const dangerousPatterns = [
    /\.php/i, /\.js$/i, /\.html$/i, /\.htm$/i, 
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i,
    /\..\//g, /\.\.\\/g, // Directory traversal
    /[<>:"|?*]/g // Invalid characters
  ];

  if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
    return cb(
      new Error("Filename contains dangerous patterns"),
      false
    );
  }

  cb(null, true);
};

// 🛡️ **Main upload configuration**
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file per request
    fields: 10, // Limit form fields
    fieldNameSize: 50, // Limit field name length
    fieldSize: 1024 * 1024, // Limit field value size to 1MB
  },
});

// 🛡️ **File validation middleware (after upload)**
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return next(); // No file uploaded, continue
  }

  const filePath = req.file.path;
  
  try {
    // Read first 32 bytes to check file signature
    const buffer = fs.readFileSync(filePath, { start: 0, end: 31 });
    
    // Validate file signature
    if (!validateFileSignature(buffer, req.file.mimetype)) {
      // Delete invalid file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "File signature validation failed - file may be corrupted or malicious"
      });
    }

    // Additional security: Check file size matches what multer recorded
    const stats = fs.statSync(filePath);
    if (stats.size !== req.file.size) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "File size mismatch detected"
      });
    }

    next();
  } catch (validationError) {
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return res.status(500).json({
      error: "File validation error",
      details: process.env.NODE_ENV === 'development' ? validationError.message : undefined
    });
  }
};

// 🛡️ **Error handling middleware**
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ error: 'Too many files' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ error: 'Unexpected file field' });
      default:
        return res.status(400).json({ error: 'Upload error: ' + error.message });
    }
  }
  
  if (error.message.includes('File type not allowed') || 
      error.message.includes('Invalid file extension') ||
      error.message.includes('dangerous patterns')) {
    return res.status(400).json({ error: error.message });
  }

  next(error);
};

module.exports = {
  upload,
  validateUploadedFile,
  handleUploadError
};
