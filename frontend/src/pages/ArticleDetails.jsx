// pages/ArticleDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import CommentSection from "../components/CommentSection";

const ArticleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/articles/${id}`);
        setArticle(res.data);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article. Please try again.");
        toast.error("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      await axios.delete(`/articles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Article deleted successfully");
      navigate("/articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      toast.error("Failed to delete article");
    }
  };

  const isAuthor = user && article && user.id === article.user_id;
  const isAdmin = user && user.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="animate-spin text-3xl text-blue-600 mr-3" />
        <span className="text-gray-600 text-lg">Loading article...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <p className="text-red-600 mb-4 text-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <p className="text-gray-600 text-lg">Article not found.</p>
      </div>
    );
  }

  const coverUrl = article.cover ? `/uploads/${article.cover}` : null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Cover Image with Fallback */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt="Cover"
          className="w-full max-h-[500px] object-cover mb-6 rounded shadow"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "block";
          }}
        />
      ) : null}
      <div
        className="w-full h-64 bg-gray-200 mb-6 rounded shadow flex items-center justify-center"
        style={{ display: coverUrl ? "none" : "flex" }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <p>No cover image</p>
        </div>
      </div>

      {/* Article Header with Edit/Delete Buttons */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <p className="text-gray-500">
            By {article.author || "Unknown"} •{" "}
            {new Date(article.created_at).toLocaleDateString()}
          </p>
        </div>
        {(isAuthor || isAdmin) && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/articles/${id}/edit`)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <FaEdit size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
            >
              <FaTrash size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="prose max-w-none mb-8">
        <p className="text-lg text-gray-800 whitespace-pre-wrap">
          {article.content}
        </p>
      </div>

      {/* Comments Section */}
      <CommentSection articleId={id} />
    </div>
  );
};

export default ArticleDetails;
