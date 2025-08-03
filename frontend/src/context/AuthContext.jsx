import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // 🧠 Load from sessionStorage when app starts
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    const savedToken = sessionStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // 🔐 Login method
  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);

    // Save in sessionStorage
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("token", tokenData);
  };

  // 🔓 Logout method
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.clear(); // This clears all session-based info
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
