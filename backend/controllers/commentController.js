const db = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const getUserFromToken = (authHeader) => {
  if (!authHeader) throw new Error("No token provided");
  const token = authHeader.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ✅ Add Comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const articleId = req.params.id;
    const { id: userId } = getUserFromToken(req.headers.authorization);

    if (!content) return res.status(400).json({ error: "Content is required" });

    const [result] = await db.query(
      "INSERT INTO comments (user_id, article_id, content) VALUES (?, ?, ?)",
      [userId, articleId, content],
    );

    const [comment] = await db.query("SELECT * FROM comments WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(comment[0]);
  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get Comments for an Article (with usernames)
exports.getCommentsByArticleId = async (req, res) => {
  try {
    const articleId = req.params.id;

    const [comments] = await db.query(
      `
      SELECT comments.*, users.username 
      FROM comments 
      JOIN users ON comments.user_id = users.id 
      WHERE comments.article_id = ?
      ORDER BY comments.created_at ASC
      `,
      [articleId],
    );

    res.status(200).json(comments);
  } catch (err) {
    console.error("Get Comments Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete Comment (owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { id: userId, role } = getUserFromToken(req.headers.authorization);

    let query = "DELETE FROM comments WHERE id = ?";
    const values = [commentId];

    if (role !== "admin") {
      query += " AND user_id = ?";
      values.push(userId);
    }

    const [result] = await db.query(query, values);
    if (result.affectedRows === 0)
      return res
        .status(403)
        .json({ error: "Not authorized or comment not found" });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Edit Comment (only owner)
exports.editComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    const { id: userId } = getUserFromToken(req.headers.authorization);

    const [result] = await db.query(
      "UPDATE comments SET content = ? WHERE id = ? AND user_id = ?",
      [content, commentId, userId],
    );

    if (result.affectedRows === 0)
      return res
        .status(403)
        .json({ error: "Not authorized or comment not found" });

    const [updated] = await db.query("SELECT * FROM comments WHERE id = ?", [
      commentId,
    ]);
    res.json(updated[0]);
  } catch (err) {
    console.error("Edit Comment Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
