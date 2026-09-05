import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/history", label: "Scan history" },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Backdrop — mobile only, closes the drawer on tap */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 transform flex-col
          border-r border-border bg-surface transition-transform duration-200 ease-in-out
          md:static md:w-56 md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <div>
            <p className="font-mono text-sm font-semibold tracking-tight text-text-primary">
              CyberLens
            </p>
            <p className="mt-0.5 text-xs text-text-muted">Phishing scan dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary md:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-2 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `mb-1 block px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-surface-raised text-text-primary"
                    : "text-text-muted hover:bg-surface-raised hover:text-text-primary"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-4">
          <p className="truncate text-xs text-text-muted">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-accent hover:underline"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
