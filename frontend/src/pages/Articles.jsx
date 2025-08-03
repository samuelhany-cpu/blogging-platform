import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

function Articles() {
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/articles");
      let filtered = res.data;

      // 🔍 Filter by search term (title or content)
      if (searchTerm.trim()) {
        filtered = filtered.filter(
          (article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      // 🏷️ Filter by tag
      if (filterTag.trim()) {
        filtered = filtered.filter((article) =>
          article.tags?.toLowerCase().includes(filterTag.toLowerCase()),
        );
      }

      setArticles(filtered);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles. Please try again.");
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Latest Articles</h2>

      {/* 🔎 Search and Tag Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchArticles();
        }}
        className="flex flex-col md:flex-row gap-4 mb-6"
      >
        <input
          type="text"
          placeholder="Search by title or content"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded"
        />
        <input
          type="text"
          placeholder="Filter by tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-2xl text-blue-600 mr-2" />
          <span className="text-gray-600">Loading articles...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchArticles}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : articles.length === 0 ? (
        <p className="text-gray-600 text-center">No articles found.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-white p-6 rounded shadow-md">
              <h3 className="text-xl font-semibold">{article.title}</h3>
              <p className="text-sm text-gray-500">
                By {article.author || "Unknown"} •{" "}
                {new Date(article.created_at).toLocaleDateString()}
              </p>
              <p className="mt-2 text-gray-700">
                {article.content.slice(0, 150)}...
              </p>
              <Link
                to={`/articles/${article.id}`}
                className="text-blue-500 hover:underline mt-2 inline-block"
              >
                Read More
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Articles;
