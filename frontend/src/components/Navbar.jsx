import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  const handleLogout = () => {
    logout(); // Clear user & session
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link to="/">Blogging Platform</Link>
      </div>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/articles" className="hover:underline">
          Articles
        </Link>
        {isLoggedIn && (
          <Link
            to="/articles/new"
            className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
          >
            Add Article
          </Link>
        )}
        {isLoggedIn ? (
          <>
            <Link
              to="/dashboard"
              className="text-sm text-green-600 hover:underline"
            >
              Dashboard
            </Link>
            {user?.id && (
              <Link
                to={`/users/${user.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View Profile
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
