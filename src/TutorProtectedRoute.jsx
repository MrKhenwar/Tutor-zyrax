import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTutorAuth } from './TutorAuthContext';

const TutorProtectedRoute = ({ children }) => {
  const { isTutorAuthenticated, tutorLoading } = useTutorAuth();

  if (tutorLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isTutorAuthenticated) {
    return <Navigate to="/tutor-login" replace />;
  }

  return children;
};

export default TutorProtectedRoute;
