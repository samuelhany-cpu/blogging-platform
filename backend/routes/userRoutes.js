const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUserArticles,
} = require("../controllers/userController.js");
const { authenticateToken } = require("../middlewares/auth.js");

router.get("/users/:id/profile", authenticateToken, getUserProfile);
router.get("/users/:id/articles", authenticateToken, getUserArticles);

module.exports = router;
