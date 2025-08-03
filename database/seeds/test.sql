-- Insert sample user (password: 'test1234')
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYI9h7E3BqClIu7WYdYQ7Q1tT1tL6O', -- bcrypt hash
  'admin'
);

-- Insert sample articles
INSERT INTO articles (title, content, user_id, tags)
VALUES
  ('Getting Started with React', 'React is a JavaScript library...', 1, 'react,javascript'),
  ('Node.js Best Practices', 'Always handle errors...', 1, 'nodejs,backend');

-- Insert sample comments
INSERT INTO comments (content, article_id, user_id)
VALUES
  ('Great tutorial!', 1, 1),
  ('Very helpful, thanks!', 2, 1);