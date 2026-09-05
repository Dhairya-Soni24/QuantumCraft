"use client";

import React, { useState, useEffect } from "react";
import { UserCog, X, Check, Sparkles, AlertCircle } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { updateUserProfileApi } from "@/lib/api";

export default function EditProfileModal({ isOpen, onClose }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const updateUserProfile = useQuantumStore((state) => state.updateUserProfile);

  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [role, setRole] = useState(currentUser?.role || "student");
  const [isSaving, setIsSaving] = useState(false);
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
    if (!currentUser || !currentUser.id) {
      setErrorMsg("Please sign in first to edit your profile.");
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg("Full name and email cannot be empty.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const initials = fullName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    const badge = role === "admin"
      ? "Admin & Lead Researcher"
      : role === "instructor"
      ? "Quantum Physics Instructor"
      : "Quantum Computing Student";

    const color = role === "admin"
      ? "from-cyan-500 to-blue-600"
      : role === "instructor"
      ? "from-amber-500 to-emerald-600"
      : "from-purple-500 to-pink-600";

    const updates = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      avatar: initials,
      badge,
      color,
    };

    try {
      await updateUserProfileApi(currentUser.id, {
        full_name: updates.full_name,
        email: updates.email,
        role: updates.role,
      });

      updateUserProfile(updates);
      setSuccessMsg("Profile saved to database successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || "Failed to update profile in database.");
    } finally {
      setIsSaving(false);
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
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <UserCog size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Edit Researcher Profile</h2>
              <p className="text-xs text-slate-400">Update identity in Supabase database</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Soni Dhairya"
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
              placeholder="e.g. dhairya@quantumcraft.dev"
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

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <Sparkles size={14} />
              {isSaving ? "Updating Database..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
