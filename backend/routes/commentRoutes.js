const express = require('express');
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");
const { validateComment, validateId } = require('../middlewares/validation');

const {
  addComment,
  getCommentsByArticleId,
  deleteComment,
  editComment
} = require('../controllers/commentController');

// 🛡️ **Public Routes**
router.get('/articles/:id/comments', validateId, getCommentsByArticleId);

// 🛡️ **Protected Routes**
router.post('/articles/:id/comments', 
  authenticateToken, 
  validateComment, 
  addComment
);

router.put('/comments/:id', 
  authenticateToken, 
  validateId,
  validateComment, 
  editComment
);

router.delete('/comments/:id', 
  authenticateToken, 
  validateId, 
  deleteComment
);

module.exports = router;
