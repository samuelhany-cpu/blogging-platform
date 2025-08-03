const fs = require("fs").promises;
const path = require("path");

// Delete cover image file
exports.deleteCover = async (filename) => {
  if (!filename) return;

  try {
    const filePath = path.join(__dirname, "..", "uploads", filename);
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, which is fine
    console.error("Error deleting cover file:", error.message);
  }
};

// Get cover image URL
exports.getCoverUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Validate file type
exports.validateFileType = (file) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  return allowedTypes.includes(file.mimetype);
};

// Validate file size (5MB limit)
exports.validateFileSize = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return file.size <= maxSize;
};
