const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, refreshToken } = require("../controllers/authController");
const { authLimiter } = require('../middlewares/security');
const { validateUserRegistration, validateUserLogin } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');

// 🛡️ Apply rate limiting to authentication routes
router.use(authLimiter);

// 🛡️ Registration with validation
router.post("/register", validateUserRegistration, registerUser);

// 🛡️ Login with validation
router.post("/login", validateUserLogin, loginUser);

// 🛡️ Logout (requires authentication)
router.post("/logout", authenticateToken, logoutUser);

// 🛡️ Token refresh
router.post("/refresh", refreshToken);

module.exports = router;
