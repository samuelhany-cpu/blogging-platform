const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
