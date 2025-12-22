import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminClassesPage from "./AdminClassesPage";
import LoginPage from "./LoginPage";
import SubscriberManagement from "./SubscriberManagement";
import SubscriptionExtension from "./SubscriptionExtension";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
  console.log("App component rendering...");
  console.log("Current URL path:", window.location.pathname);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/subscribers"
            element={
              <ProtectedRoute>
                <SubscriberManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/extend-subscription"
            element={
              <ProtectedRoute>
                <SubscriptionExtension />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminClassesPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


