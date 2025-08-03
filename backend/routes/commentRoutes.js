const express = require("express");
const router = express.Router();
const {
  addComment,
  getCommentsByArticleId,
  deleteComment,
  editComment,
} = require("../controllers/commentController");

// Comment routes
router.get("/articles/:id/comments", getCommentsByArticleId);
router.delete("/comments/:id", deleteComment);
router.put("/comments/:id", editComment);

module.exports = router;
