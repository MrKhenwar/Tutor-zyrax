import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const TutorAuthContext = createContext();

export const useTutorAuth = () => {
  const context = useContext(TutorAuthContext);
  if (!context) {
    throw new Error('useTutorAuth must be used within a TutorAuthProvider');
  }
  return context;
};

export const TutorAuthProvider = ({ children }) => {
  const [isTutorAuthenticated, setIsTutorAuthenticated] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(true);

  const baseURL = 'https://api.zyrax.fit';

  useEffect(() => {
    // Check if tutor is already logged in
    const tutorToken = localStorage.getItem('tutorAccessToken');
    if (tutorToken) {
      setIsTutorAuthenticated(true);
    }
    setTutorLoading(false);
  }, []);

  const tutorLogin = async (username, password) => {
    try {
      const response = await axios.post(`${baseURL}/zyrax/tutor/login/`, {
        username,
        password,
      });

      const { access, refresh } = response.data;

      // Store tokens
      localStorage.setItem('tutorAccessToken', access);
      localStorage.setItem('tutorRefreshToken', refresh);

      setIsTutorAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Tutor login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  const tutorLogout = () => {
    localStorage.removeItem('tutorAccessToken');
    localStorage.removeItem('tutorRefreshToken');
    setIsTutorAuthenticated(false);
  };

  const value = {
    isTutorAuthenticated,
    tutorLoading,
    tutorLogin,
    tutorLogout,
  };

  return <TutorAuthContext.Provider value={value}>{children}</TutorAuthContext.Provider>;
};
