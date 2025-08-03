const db = require("../config/db");

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user
    const [users] = await db.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [userId],
    );
    if (users.length === 0)
      return res.status(404).json({ error: "User not found" });

    // Fetch articles
    const [articles] = await db.query(
      "SELECT id, title, created_at FROM articles WHERE user_id = ?",
      [userId],
    );

    //Fetch Comments
    const [comments] = await db.query(
      "SELECT id, content, created_at FROM comments WHERE user_id = ?",
      [userId],
    );

    res.json({
      user: users[0],
      articles,
      comments,
    });
  } catch (err) {
    console.error("User Profile Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserArticles = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch user's articles with full details
    const [articles] = await db.query(
      `SELECT 
        id, 
        title, 
        content, 
        category, 
        tags, 
        cover, 
        created_at, 
        updated_at 
      FROM articles 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [userId],
    );

    res.json(articles);
  } catch (err) {
    console.error("Get User Articles Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
