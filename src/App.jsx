import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider, createTheme, CssBaseline, Container } from "@mui/material";
import AdminClassesPage from "./AdminClassesPage";
import LoginPage from "./LoginPage";



export default function App() {
  const isLoggedIn = !!localStorage.getItem("access");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={isLoggedIn ? <AdminClassesPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}


