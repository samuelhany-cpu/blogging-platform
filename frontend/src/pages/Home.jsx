import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to the Blogging Platform
      </h1>
      <p className="text-gray-600 mb-6">
        Share your thoughts, read great content, and join the community.
      </p>
      <Link
        to="/articles"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Browse Articles
      </Link>
    </div>
  );
}

export default Home;
