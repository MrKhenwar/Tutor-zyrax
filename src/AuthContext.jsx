import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api'; // Import our new api instance

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthStatus = () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          // Reverted to atob to remove the 'jwt-decode' dependency
          const decoded = JSON.parse(atob(token.split(".")[1]));
          // Check if token is expired
          if (decoded.exp * 1000 > Date.now()) {
            setIsAuthenticated(true);
          } else {
            // Token is expired, the interceptor will handle refreshing on the next API call
            setIsAuthenticated(false);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        } catch (error) {
          console.error("Failed to decode token:", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      // Use the 'api' instance which has the correct baseURL
      const response = await api.post("/zyrax/devices/force-login/", {
        username,
        password
      });

      const { access, refresh } = response.data;

      if (access && refresh) {
        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        setIsAuthenticated(true);
        // Assuming the response might contain user data
        setUser(response.data.user || { username });
        return { success: true };
      }
      return { success: false, error: "No tokens received from server" };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || "Login failed. Please check your credentials.";
      const isDeviceLimitError = errorMessage.toLowerCase().includes("device limit");
      return { success: false, error: errorMessage, isDeviceLimitError };
    }
  };

  // The forceLogin function is now essentially the same as login for tutors
  const forceLogin = (username, password) => login(username, password);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login'; // Redirect to login on logout
  };

  const openDjangoAdmin = (path = '') => {
    // This should ideally use an environment variable
    const adminUrl = `http://127.0.0.1:8000/admin/${path}`;
    window.open(adminUrl, '_blank', 'noopener,noreferrer');
  };

  const value = {
    isAuthenticated,
    loading,
    user,
    login,
    forceLogin, // Keeping this for compatibility with LoginPage
    logout,
    openDjangoAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
