"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cpu, Flame, LogOut, Puzzle, Sparkles, Trophy, User, ArrowLeft, RefreshCw, UserCog } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { getUserStats } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import EditProfileModal from "@/components/EditProfileModal";

const HEATMAP_COLORS = ["bg-slate-900", "bg-emerald-950 border border-emerald-900/50", "bg-emerald-700", "bg-emerald-500", "bg-teal-300"];

function Navbar({ onOpenAuth }) {
  const currentUser = useQuantumStore((state) => state.currentUser);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 md:px-8 select-none">
      <div className="flex h-full items-center gap-8">
        <Link href="/" className="flex items-center gap-2 text-[24px] font-bold tracking-tight text-cyan-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 font-mono text-sm shadow-md shadow-cyan-500/30">
            Ψ
          </span>
          QuantumCraft
        </Link>
        <nav className="hidden h-full items-center gap-8 md:flex">
          {["Workspace", "Lessons", "Challenges", "Profile"].map((item) => (
            <Link
              href={item === "Profile" ? "/profile" : "/"}
              key={item}
              className={`flex h-full items-center border-b-2 px-1 text-sm font-medium transition-colors ${
                item === "Profile"
                  ? "border-cyan-300 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-cyan-300"
              }`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4 text-slate-300">
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900 py-1 pl-1 pr-3 hover:border-cyan-500/60 hover:bg-slate-850 transition-all shadow-sm"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 font-mono text-xs font-bold text-white shadow">
            {currentUser?.avatar || currentUser?.full_name?.slice(0, 2).toUpperCase() || "U"}
          </div>
          <span className="text-xs font-semibold text-slate-200">{currentUser?.full_name || "Sign In"}</span>
        </button>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 transition hover:border-slate-700 hover:bg-slate-850 shadow-md">
      <div className="mb-3 flex items-center justify-between text-slate-400">
        <h2 className="text-[12px] font-semibold tracking-[0.1em] uppercase">{label}</h2>
        <Icon size={22} className={color} />
      </div>
      <p className="text-[28px] font-bold text-slate-100">{value}</p>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}

function HeatmapGrid({ data }) {
  // 52 weeks x 7 days = 364 cells
  const items = Array.isArray(data) && data.length >= 364
    ? data.slice(0, 364)
    : Array.from({ length: 364 }, (_, index) => {
        const val = (index * 17 + (index % 9) * 7) % 20;
        return { count: val > 17 ? 5 : val > 14 ? 3 : val > 9 ? 2 : val > 5 ? 1 : 0 };
      });

  return (
    <div className="flex min-w-max gap-1">
      {Array.from({ length: 52 }, (_, week) => (
        <div className="flex flex-col gap-1" key={week}>
          {items.slice(week * 7, week * 7 + 7).map((entry, day) => {
            const count = entry?.count || 0;
            const level = count > 4 ? 4 : count > 2 ? 3 : count > 1 ? 2 : count > 0 ? 1 : 0;
            return (
              <div
                key={day}
                title={entry.date ? `${entry.date}: ${count} actions` : `${count} contributions`}
                className={`h-[11px] w-[11px] rounded-[2px] ${HEATMAP_COLORS[level]} transition-colors hover:ring-1 hover:ring-cyan-300`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const logoutUser = useQuantumStore((state) => state.logoutUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      if (!currentUser?.id) return;
      setIsLoadingStats(true);
      try {
        const res = await getUserStats(currentUser.id);
        if (isMounted && res?.stats) {
          setUserStats(res.stats);
        }
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const streak = userStats?.current_streak_days ?? 4;
  const solved = userStats?.challenges_solved_count ?? 2;
  const ops = userStats?.qubit_operations_count ?? 48;
  const totalXp = currentUser?.xp || userStats?.total_xp || 450;
  const completedLessons = userStats?.completed_lessons_count ?? 3;

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] font-sans antialiased text-slate-100">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-6 py-8 md:px-10">
        {/* Back Link & Page Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Quantum Workspace
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isLoadingStats && (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <RefreshCw size={12} className="animate-spin" /> Syncing stats...
              </span>
            )}
          </div>
        </div>

        {/* User Hero Banner */}
        <section className="relative flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-8 md:flex-row shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(47,217,244,0.12),transparent_55%)]" />
          <div
            className={`relative flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${
              currentUser?.color || "from-cyan-500 to-blue-600"
            } text-center font-mono text-3xl font-bold text-white shadow-lg shadow-cyan-500/20`}
          >
            {currentUser?.avatar || currentUser?.full_name?.slice(0, 2).toUpperCase() || "SD"}
          </div>
          <div className="relative text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">
                {currentUser?.full_name || "Soni Dhairya"}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  currentUser?.role === "admin"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60"
                    : currentUser?.role === "instructor"
                    ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                    : "bg-purple-950 text-purple-300 border border-purple-800/60"
                }`}
              >
                {currentUser?.role || "admin"}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{currentUser?.email || "dhairya@quantumcraft.dev"}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold tracking-wide text-cyan-300">
              <Sparkles size={14} /> Quantum Rank: {currentUser?.badge || "Admin & Lead Researcher"}
            </div>
          </div>

          <div className="relative md:ml-auto flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-950/60 px-4 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 transition-all shadow"
            >
              <UserCog size={14} /> Edit Profile
            </button>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-750 transition-all"
            >
              <User size={14} /> Switch Account
            </button>
            {currentUser && (
              <button
                onClick={logoutUser}
                className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-all"
              >
                <LogOut size={14} /> Logout
              </button>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${streak} Days`}
            color="text-cyan-400"
            subtitle={`${completedLessons} completed lessons`}
          />
          <StatCard
            icon={Puzzle}
            label="Challenges Solved"
            value={`${solved} / 5`}
            color="text-purple-400"
            subtitle="Verified Qiskit circuits"
          />
          <StatCard
            icon={Cpu}
            label="Qubit Operations"
            value={`${ops} Gates`}
            color="text-teal-400"
            subtitle="Synthesized AST nodes"
          />
          <StatCard
            icon={Trophy}
            label="Total XP Score"
            value={`⚡ ${totalXp} XP`}
            color="text-amber-400"
            subtitle="Rank Tier Level 2"
          />
        </section>

        {/* Heatmap Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Activity & Research Contributions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">52-week rolling quantum circuit simulations & challenge submissions</p>
            </div>
            <span className="font-mono text-xs text-cyan-400 font-semibold">364 Days Monitored</span>
          </div>
          <div className="overflow-x-auto pb-3">
            <HeatmapGrid data={userStats?.activity_heatmap} />
          </div>
          <div className="mt-5 flex items-center justify-end gap-2 font-mono text-xs text-slate-400">
            <span>Less</span>
            {HEATMAP_COLORS.map((colorClass, idx) => (
              <i key={idx} className={`h-3 w-3 rounded-[2px] ${colorClass}`} />
            ))}
            <span>More</span>
          </div>
        </section>
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
}
