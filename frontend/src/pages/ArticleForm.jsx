// src/pages/ArticleForm.jsx
import React, { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaSpinner, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const categories = [
  "Technology",
  "Lifestyle",
  "Business",
  "Education",
  "Entertainment",
];

const ArticleForm = () => {
  const { id } = useParams(); // for edit
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cover, setCover] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentCover, setCurrentCover] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);

  const navigate = useNavigate();

  const fetchArticle = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await axios.get(`/articles/${id}`);
      const article = res.data;
      setTitle(article.title);
      setContent(article.content);
      setCategory(article.category);
      setTags(
        article.tags ? article.tags.split(",").map((tag) => tag.trim()) : [],
      );
      setCurrentCover(article.cover);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load article");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.toLowerCase())) {
        setTags([...tags, tagInput.toLowerCase()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("category", category);
      tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
      if (cover) formData.append("cover", cover);
      if (removeCover) formData.append("removeCover", "true");

      if (id) {
        // Update existing article
        await axios.put(`/articles/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Article updated successfully!");
      } else {
        // Create new article
        await axios.post("/articles", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Article created successfully!");
      }

      navigate("/articles");
    } catch (err) {
      console.error(err);
      toast.error(id ? "Failed to update article" : "Failed to create article");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{id ? "Edit" : "New"} Article</h2>

      {loading ? (
        <p>Loading article...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Content"
            className="w-full p-2 border rounded h-40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <select
            className="w-full p-2 border rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div>
            <input
              type="text"
              placeholder="Add tag and press Enter"
              className="w-full p-2 border rounded"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCover(file);
                  setPreviewUrl(URL.createObjectURL(file));
                  setRemoveCover(false); // Reset remove flag when new file is selected
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />

            {/* Current Cover Image (for editing) */}
            {currentCover && !previewUrl && (
              <div className="mt-3 relative">
                <img
                  src={`/uploads/${currentCover}`}
                  alt="Current cover"
                  className="w-full max-w-sm h-auto rounded shadow"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentCover(null);
                    setRemoveCover(true);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  title="Remove cover image"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}

            {/* New Cover Preview */}
            {previewUrl && (
              <div className="mt-3 relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-w-sm h-auto rounded shadow"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCover(null);
                    setPreviewUrl(null);
                    setRemoveCover(false); // Reset remove flag when clearing new file
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  title="Remove new cover image"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                {id ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{id ? "Update" : "Create"} Article</>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ArticleForm;
