import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-bg md:flex-row">
      {/* Mobile top bar — hidden on md+ where the sidebar is always visible */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex h-8 w-8 flex-col items-center justify-center gap-1 text-text-primary"
          aria-label="Open navigation"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
        </button>
        <p className="font-mono text-sm font-semibold text-text-primary">CyberLens</p>
        <span className="w-8" aria-hidden="true" />
      </div>

      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <History />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
