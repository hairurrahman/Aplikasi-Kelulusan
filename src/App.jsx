import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SiswaPage from "./pages/SiswaPage";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" toastOptions={{
          style: { fontFamily: "'Nunito', sans-serif", borderRadius: "16px", fontWeight: "700" },
          success: { style: { background: "#4CAF50", color: "#fff" } },
          error: { style: { background: "#f44336", color: "#fff" } },
        }} />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/siswa" element={<SiswaPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
