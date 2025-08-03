const db = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper to extract userId from token
const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    throw new Error("Invalid token");
  }
}; // make sure this function is defined

exports.create = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const cover = req.file?.filename || null;

    // Check token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Token missing" });

    const userId = getUserIdFromToken(token);

    // Enhanced input validation
    if (!title || !content || !category) {
      return res
        .status(400)
        .json({ message: "Title, content, and category are required" });
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim().substring(0, 255);
    const sanitizedContent = content.trim();
    const sanitizedCategory = category.trim().substring(0, 100);

    if (sanitizedTitle.length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }

    if (sanitizedContent.length < 10) {
      return res
        .status(400)
        .json({ message: "Content must be at least 10 characters long" });
    }

    // Format tags as comma-separated string
    const formattedTags = Array.isArray(tags) ? tags.join(",") : tags;

    // Insert article
    const [result] = await db.query(
      "INSERT INTO articles (title, content, category, tags, user_id, cover) VALUES (?, ?, ?, ?, ?,?)",
      [
        sanitizedTitle,
        sanitizedContent,
        sanitizedCategory,
        formattedTags,
        userId,
        cover,
      ],
    );

    // Fetch inserted article
    const [article] = await db.query("SELECT * FROM articles WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(article[0]);
  } catch (error) {
    console.error("Create Error:", error);
    if (error.message === "Invalid token") {
      res.status(403).json({ message: "Unauthorized" }); // 🔁 consistent key
    } else {
      res.status(500).json({ message: "Internal Server Error" }); // 🔁
    }
  }
};

exports.getAll = async (req, res) => {
  try {
    const { tag, search } = req.query;

    let query = `
      SELECT 
        articles.id,
        articles.title,
        articles.content,
        articles.category,
        articles.tags,
        articles.cover,
        articles.created_at,
        users.username AS author
      FROM articles
      LEFT JOIN users ON articles.user_id = users.id
    `;

    const params = [];
    const conditions = [];

    if (tag) {
      conditions.push(`articles.tags LIKE ?`);
      params.push(`%${tag}%`);
    }

    if (search) {
      conditions.push(`(articles.title LIKE ? OR articles.content LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY articles.created_at DESC`;

    const [articles] = await db.query(query, params);
    res.status(200).json(articles);
  } catch (error) {
    console.error("🔍 getAll Articles Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [article] = await db.query("SELECT * FROM articles WHERE id = ?", [
      id,
    ]);

    if (article.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.status(200).json(article[0]);
  } catch (error) {
    console.error("GetById Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, removeCover } = req.body;
    const cover = req.file?.filename || null;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Token missing" });

    const userId = getUserIdFromToken(token);

    // Enhanced input validation
    if (!title || !content || !category) {
      return res
        .status(400)
        .json({ message: "Title, content, and category are required" });
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim().substring(0, 255);
    const sanitizedContent = content.trim();
    const sanitizedCategory = category.trim().substring(0, 100);

    if (sanitizedTitle.length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }

    if (sanitizedContent.length < 10) {
      return res
        .status(400)
        .json({ message: "Content must be at least 10 characters long" });
    }

    const formattedTags = Array.isArray(tags) ? tags.join(",") : tags;

    // Build update query based on cover handling
    let updateQuery, updateParams;

    if (removeCover === "true") {
      // If user wants to remove cover, set cover to NULL
      updateQuery =
        "UPDATE articles SET title = ?, content = ?, category = ?, tags = ?, cover = NULL WHERE id = ? AND user_id = ?";
      updateParams = [
        sanitizedTitle,
        sanitizedContent,
        sanitizedCategory,
        formattedTags,
        id,
        userId,
      ];
    } else if (cover) {
      // If new cover is uploaded, update with cover
      updateQuery =
        "UPDATE articles SET title = ?, content = ?, category = ?, tags = ?, cover = ? WHERE id = ? AND user_id = ?";
      updateParams = [
        sanitizedTitle,
        sanitizedContent,
        sanitizedCategory,
        formattedTags,
        cover,
        id,
        userId,
      ];
    } else {
      // If no new cover, update without changing cover
      updateQuery =
        "UPDATE articles SET title = ?, content = ?, category = ?, tags = ? WHERE id = ? AND user_id = ?";
      updateParams = [
        sanitizedTitle,
        sanitizedContent,
        sanitizedCategory,
        formattedTags,
        id,
        userId,
      ];
    }

    const [result] = await db.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Article not found or not authorized" });
    }

    const [updated] = await db.query("SELECT * FROM articles WHERE id = ?", [
      id,
    ]);
    res.status(200).json(updated[0]);
  } catch (error) {
    console.error("Update Error:", error.message);
    console.error("Request body:", req.body);
    console.error("Request file:", req.file);
    if (error.message === "Invalid token") {
      res.status(403).json({ error: "Unauthorized" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

exports.delete = async (req, res) => {
  try {
    const articleId = req.params.id;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Token missing" });

    let userId;
    try {
      userId = getUserIdFromToken(token);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const [[user]] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (!user) return res.status(403).json({ message: "User not found" });

    const [[article]] = await db.query("SELECT * FROM articles WHERE id = ?", [
      articleId,
    ]);
    if (!article) return res.status(404).json({ message: "Article not found" });

    // This is the key line
    if (user.id !== article.user_id && user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: not author or admin" }); // ✅ Fix: 403
    }

    await db.query("DELETE FROM articles WHERE id = ?", [articleId]);
    res.status(200).json({ message: "Article deleted" });
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
