import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Chests from "./pages/Chests";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";

// Componente para proteger as rotas da aplicação
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: "#12131a", 
            color: "#fff", 
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "12px",
            fontSize: "14px"
          } 
        }} 
      />
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Login />} />

        {/* Rotas Privadas (Envoltas no Layout) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chests"
          element={
            <ProtectedRoute>
              <Chests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Redirecionamento Padrão */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
