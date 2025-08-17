const express = require("express");
const router = express.Router();
const { upload, validateUploadedFile, handleUploadError } = require("../middlewares/uploadMiddleware");
const { authenticateToken } = require("../middlewares/auth");
const { uploadLimiter } = require('../middlewares/security');
const { 
  validateArticle, 
  validateId, 
  validateSearch 
} = require('../middlewares/validation');

const {
  create,
  getAll,
  getById,
  update,
  delete: deleteArticle,
} = require("../controllers/articleController");

// 🛡️ **Public Routes (with search validation)**
router.get("/articles", validateSearch, getAll);
router.get("/articles/:id", validateId, getById);

// 🛡️ **Protected Routes (require authentication)**
router.post("/articles", 
  authenticateToken,
  uploadLimiter, // Rate limit uploads
  upload.single("cover"),
  handleUploadError,
  validateUploadedFile,
  validateArticle,
  create
);

router.put("/articles/:id", 
  authenticateToken,
  validateId,
  uploadLimiter, // Rate limit uploads
  upload.single("cover"),
  handleUploadError,
  validateUploadedFile,
  validateArticle,
  update
);

router.delete("/articles/:id", 
  authenticateToken,
  validateId,
  deleteArticle
);

module.exports = router;
