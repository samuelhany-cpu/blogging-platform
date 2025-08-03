import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FaSpinner, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "../utils/axiosInstance";

const UserDashboard = () => {
  const { user, token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("articles");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [articlesRes, profileRes] = await Promise.all([
        axios.get(`/users/${user.id}/articles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/users/${user.id}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setArticles(articlesRes.data || []);
      setComments(profileRes.data.comments || []);
    } catch (err) {
      console.error("Error fetching user data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      await axios.delete(`/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Article deleted successfully");
      fetchUserData(); // Refresh the list
    } catch (err) {
      console.error("Error deleting article:", err);
      toast.error("Failed to delete article");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="animate-spin text-3xl text-blue-600 mr-3" />
        <span className="text-gray-600 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.username}!</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2 font-medium ${
            activeTab === "articles"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Articles ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`px-4 py-2 font-medium ${
            activeTab === "comments"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Comments ({comments.length})
        </button>
      </div>

      {/* Articles Tab */}
      {activeTab === "articles" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">My Articles</h2>
            <Link
              to="/articles/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Write New Article
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                You haven't written any articles yet.
              </p>
              <Link
                to="/articles/new"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Write Your First Article
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {article.cover && (
                    <img
                      src={`/uploads/${article.cover}`}
                      alt="Cover"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {article.content.substring(0, 100)}...
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/articles/${article.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <FaEye size={14} />
                        View
                      </Link>
                      <Link
                        to={`/articles/${article.id}/edit`}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700"
                      >
                        <FaEdit size={14} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <FaTrash size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === "comments" && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">My Comments</h2>

          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                You haven't made any comments yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg shadow-md p-4"
                >
                  <p className="text-gray-800 mb-2">{comment.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      On article:{" "}
                      {comment.article_title ||
                        `Article #${comment.article_id}`}
                    </span>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
