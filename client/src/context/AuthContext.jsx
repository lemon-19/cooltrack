import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    setLoading(false);
  }, []);

  const login = (authResponse) => {
    localStorage.setItem("token", authResponse.token);
    localStorage.setItem(
      "user",
      JSON.stringify({
        _id: authResponse._id,
        name: authResponse.name,
        email: authResponse.email,
        role: authResponse.role,
      })
    );
    setUser({
      _id: authResponse._id,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role,
    });
    nav(
      authResponse.role === "admin"
        ? "/admin/dashboard"
        : "/technician/dashboard"
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    nav("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
