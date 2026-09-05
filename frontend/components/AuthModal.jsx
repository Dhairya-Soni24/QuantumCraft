"use client";

import React, { useState, useEffect } from "react";
import { User, Sparkles, X, LogOut, Shield, Mail, Check, AlertCircle } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { loginOrRegisterUser } from "@/lib/api";

export default function AuthModal({ isOpen, onClose }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const setCurrentUser = useQuantumStore((state) => state.setCurrentUser);
  const logoutUser = useQuantumStore((state) => state.logoutUser);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.full_name || "");
      setEmail(currentUser?.email || "");
      setRole(currentUser?.role || "student");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      setErrorMsg("Please provide both your name and email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await loginOrRegisterUser({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
      });

      if (!res || !res.user || !res.user.id) {
        throw new Error(res?.message || "Failed to authenticate with database.");
      }

      const dbUser = res.user;
      const initials = (dbUser.full_name || fullName)
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

      const userPayload = {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        role: dbUser.role || role,
        xp: currentUser?.xp || 100,
        avatar: initials,
        color: dbUser.role === "admin" ? "from-cyan-500 to-blue-600" : dbUser.role === "instructor" ? "from-amber-500 to-emerald-600" : "from-purple-500 to-pink-600",
        badge: dbUser.role === "admin" ? "Admin & Lead Researcher" : dbUser.role === "instructor" ? "Quantum Physics Instructor" : "Quantum Computing Student",
      };

      setCurrentUser(userPayload);
      setSuccessMsg(res.message || "Signed in successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Failed to reach backend database. Please ensure backend is running on port 8000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 shadow-lg shadow-cyan-500/20">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {currentUser ? "Switch / Manage Account" : "Sign In to QuantumCraft"}
                </h2>
                <p className="text-xs text-slate-400">Creates or links your real profile in Supabase database</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. johndoe@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role / Permission Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "student", label: "Student" },
                { id: "instructor", label: "Instructor" },
                { id: "admin", label: "Admin" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    role === r.id
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/50 p-3 rounded-lg border border-rose-900/60">
              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/40 animate-in fade-in">
              <Check size={16} className="text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Sparkles size={14} className="text-slate-950" />
            <span>{isSubmitting ? "Connecting to Supabase..." : "Sign In / Register"}</span>
          </button>
        </form>

        {/* Footer */}
        {currentUser && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Currently Active: <strong className="text-slate-200">{currentUser.full_name}</strong>
            </span>
            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
