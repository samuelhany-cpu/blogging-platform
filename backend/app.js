const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
require("dotenv").config();

// 🛡 Allow requests from frontend (adjust origin for production)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// 📦 Body parser for JSON
app.use(express.json());

// 🖼 Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🚏 Import route files
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");

// 🔗 Mount routes
app.use("/api/auth", authRoutes);
app.use("/api", articleRoutes);
app.use("/api", commentRoutes);
app.use("/api", userRoutes);

module.exports = app;
