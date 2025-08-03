const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { authenticateToken } = require("../middlewares/auth");

const {
  create,
  getAll,
  getById,
  update,
  delete: deleteArticle,
} = require("../controllers/articleController");

const { addComment } = require("../controllers/commentController");

// ✅ Only ONE route for article creation with upload middleware
router.post("/articles", authenticateToken, upload.single("cover"), create);

router.get("/articles", getAll);
router.get("/articles/:id", getById);
router.put("/articles/:id", authenticateToken, upload.single("cover"), update);
router.delete("/articles/:id", authenticateToken, deleteArticle);
router.post("/articles/:id/comments", authenticateToken, addComment);

module.exports = router;
