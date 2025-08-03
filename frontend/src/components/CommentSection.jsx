import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CommentSection = ({ articleId }) => {
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/articles/${articleId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(
        `/articles/${articleId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/comments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleEditSubmit = async (id) => {
    try {
      await axios.put(
        `/comments/${id}`,
        { content: editingContent },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditingId(null);
      fetchComments();
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {loading ? (
        <div className="flex items-center text-gray-500">
          <FaSpinner className="animate-spin mr-2" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-500">No comments yet.</p>
      ) : (
        <ul className="mb-6 space-y-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.li
                key={comment.id}
                className="border p-3 rounded shadow"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {editingId === comment.id ? (
                  <>
                    <textarea
                      className="w-full p-2 border rounded mb-2"
                      rows={2}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(comment.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-800 mb-1">{comment.content}</p>
                    <small className="text-gray-500 block">
                      by{" "}
                      <span className="font-medium">
                        {comment.username || "Unknown User"}
                      </span>
                    </small>
                    {user &&
                      (user.id === comment.user_id ||
                        user.role === "admin") && (
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditingContent(comment.content);
                            }}
                            className="text-yellow-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {user && (
        <form onSubmit={handleCommentSubmit}>
          <textarea
            className="w-full p-2 border rounded mb-2"
            placeholder="Write a comment..."
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Add Comment
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
