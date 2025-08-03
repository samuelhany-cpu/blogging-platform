// backend/middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");

// Sanitize filenames (remove special characters)
const sanitizeFilename = (filename) => filename.replace(/[^a-zA-Z0-9.-]/g, "_");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const sanitized = sanitizeFilename(base);
    cb(null, `${Date.now()}-${sanitized}${ext}`);
  },
});

// Enhanced file type filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  if (!isValid) {
    return cb(
      new Error("Only image files (JPEG, PNG, GIF) are allowed"),
      false,
    );
  }

  // Check MIME type as well
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type detected"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (optional)
  },
});

module.exports = upload;
