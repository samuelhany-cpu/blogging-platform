// src/pages/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchUserProfile } from "../api/user";
import { useAuth } from "../context/AuthContext";
import ArticleCard from "../components/ArticleCard";

const UserProfile = () => {
  const { userid } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState({ articles: [], comments: [] });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchUserProfile(userid, token);
        const { articles = [], comments = [] } = res.data || {};
        setData({ articles, comments });
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, [userid, token]);

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <h3 className="text-xl font-semibold mb-2">Articles</h3>
      {data.articles.length === 0 ? (
        <p>No articles yet.</p>
      ) : (
        data.articles.map((article) => (
          <ArticleCard key={article.userid} article={article} />
        ))
      )}

      <h3 className="text-xl font-semibold mt-6 mb-2">Comments</h3>
      {data.comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.comments.map((comment) => (
            <li key={comment.userid} className="border p-2 rounded">
              <p>{comment.content}</p>
              <small>On article userid: {comment.article_userid}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserProfile;
