import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminClassesPage from "./AdminClassesPage";
import LoginPage from "./LoginPage";
import SubscriberManagement from "./SubscriberManagement";
import SubscriptionExtension from "./SubscriptionExtension";
import EverydayStats from "./EverydayStats";
import ClassWiseStats from "./ClassWiseStats";
import DataDiagnostics from "./DataDiagnostics";
import TutorLogin from "./TutorLogin";
import TutorDashboard from "./TutorDashboard";
import { AuthProvider } from "./AuthContext";
import { TutorAuthProvider } from "./TutorAuthContext";
import ProtectedRoute from "./ProtectedRoute";
import TutorProtectedRoute from "./TutorProtectedRoute";

export default function App() {
  console.log("App component rendering...");
  console.log("Current URL path:", window.location.pathname);

  return (
    <AuthProvider>
      <TutorAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tutor-login" element={<TutorLogin />} />
            <Route
              path="/tutor-dashboard"
              element={
                <TutorProtectedRoute>
                  <TutorDashboard />
                </TutorProtectedRoute>
              }
            />
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
              path="/everyday-stats"
              element={
                <ProtectedRoute>
                  <EverydayStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class-wise-stats"
              element={
                <ProtectedRoute>
                  <ClassWiseStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagnostics"
              element={
                <ProtectedRoute>
                  <DataDiagnostics />
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
      </TutorAuthProvider>
    </AuthProvider>
  );
}


