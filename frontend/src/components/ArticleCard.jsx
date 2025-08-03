// components/ArticleCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ArticleCard = ({ article }) => {
  const coverUrl = article.cover ? `/uploads/${article.cover}` : null;

  return (
    <div className="bg-white p-6 rounded shadow-md">
      {coverUrl && (
        <img
          src={coverUrl}
          alt="Cover"
          className="mb-4 w-full h-64 object-cover rounded"
        />
      )}

      <h3 className="text-xl font-semibold">{article.title}</h3>
      <p className="text-sm text-gray-500">
        By {article.author || "Unknown"} •{" "}
        {new Date(article.created_at).toLocaleDateString()}
      </p>

      <p className="mt-2 text-gray-700">{article.content.slice(0, 150)}...</p>

      <Link
        to={`/articles/${article.id}`}
        className="text-blue-500 hover:underline mt-2 inline-block"
      >
        Read More
      </Link>
    </div>
  );
};

export default ArticleCard;
