const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { blacklistToken } = require('../middlewares/auth');
require("dotenv").config();

// 🛡️ **Secure JWT Configuration**
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access tokens
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// 🛡️ **Generate secure tokens**
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'blogging-platform',
    audience: 'blogging-platform-users'
  });

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' }, 
    JWT_SECRET, 
    { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'blogging-platform',
      audience: 'blogging-platform-users'
    }
  );

  return { accessToken, refreshToken };
};

// 🛡️ **Enhanced User Registration**
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists (prevent user enumeration)
    const [existing] = await db.query(
      `SELECT id FROM users WHERE email = ? OR username = ?`,
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: "User with this email or username already exists",
        code: "USER_EXISTS"
      });
    }

    // Hash password with higher cost factor
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, 'user', NOW())`,
      [username, email, hashedPassword]
    );

    // Log successful registration (for monitoring)
    console.log(`New user registered: ${username} (ID: ${result.insertId})`);

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username,
        email,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ 
      error: "Registration failed",
      code: "REGISTRATION_ERROR"
    });
  }
};

// 🛡️ **Enhanced User Login**
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user by email
    const [users] = await db.query(
      `SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      // Use same response time to prevent user enumeration
      await bcrypt.compare('dummy', '$2b$10$dummy.hash.to.prevent.timing.attacks');
      return res.status(401).json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in database (for revocation)
    await db.query(
      `UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?`,
      [refreshToken, user.id]
    );

    // Log successful login
    console.log(`User logged in: ${user.username} (ID: ${user.id})`);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ 
      error: "Login failed",
      code: "LOGIN_ERROR"
    });
  }
};

// 🛡️ **Secure Logout**
exports.logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.token;

    // Blacklist the current token
    if (token) {
      blacklistToken(token);
    }

    // Remove refresh token from database
    await db.query(
      `UPDATE users SET refresh_token = NULL WHERE id = ?`,
      [userId]
    );

    console.log(`User logged out: ${req.user.username} (ID: ${userId})`);

    res.json({ 
      message: "Logged out successfully",
      code: "LOGOUT_SUCCESS"
    });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ 
      error: "Logout failed",
      code: "LOGOUT_ERROR"
    });
  }
};

// 🛡️ **Token Refresh**
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ 
      error: "Refresh token required",
      code: "REFRESH_TOKEN_MISSING"
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: "Invalid token type",
        code: "INVALID_TOKEN_TYPE"
      });
    }

    // Get user and verify refresh token
    const [users] = await db.query(
      `SELECT id, username, email, role, refresh_token FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (users.length === 0 || users[0].refresh_token !== refreshToken) {
      return res.status(401).json({ 
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }

    const user = users[0];

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token in database
    await db.query(
      `UPDATE users SET refresh_token = ? WHERE id = ?`,
      [tokens.refreshToken, user.id]
    );

    res.json({
      message: "Token refreshed successfully",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(401).json({ 
      error: "Token refresh failed",
      code: "REFRESH_FAILED"
    });
  }
};
