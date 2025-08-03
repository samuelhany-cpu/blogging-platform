const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

class Article {
  //create new article
  static async create({ title, content, tags = "", userId }) {
    const [result] = await db.query(
      `INSERT INTO articles
            (title,content,tags,userId)
            VALUES(?,?,?,?) `,
      [title, content, tags, userId],
    );

    return this.getById(result.insertId);
  }

  //get all articles
  static async getAll({ tag, page = 1, limit = 10 } = {}) {
    let query = `SELECT articles.*,
        users.name AS author
        FROM articles
        LEFT JOIN users ON articles.user_id = users.id
        `;
    const params = [];
    if (tag) {
      query += `WHERE tags LIKE ?`;
      params.push(`%${tag}%`);
    }
    //pagination
    query += `
        LIMIT ? OFFSET ?
        `;
    params.push(limit, (page - 1) * limit);
    const [article] = await db.query(query, params);
    return article;
  }
  static async getById(id) {
    const [[article]] = await db.query(
      `SELECT 
        articles.*, 
        users.username AS author 
        FROM articles 
        LEFT JOIN users ON articles.user_id = users.id 
        WHERE articles.id = ?`,
      [id],
    );
    return article || null;
  }
  static async update(id, { title, content, tags, userId }) {
    await db.query(
      `
            UPDATE articles
            SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?`,
      [title, content, tags, id, userId],
    );
  }
  static async delete(id, userId) {
    const [result] = await db.query(
      `DELETE FROM articles 
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    return result.affectedRows > 0;
  }
  static async getByUser(userId) {
    const [articles] = await db.query(
      `SELECT * FROM articles WHERE user_id = ?`,
      [userId],
    );
    return articles || null;
  }
}

module.exports = Article;
