"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X, Check, CheckCircle2, Play, Sparkles, ChevronRight, GraduationCap, Award, Layers } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { fetchCourses, fetchCourseDetails, completeLesson, fetchUserProgress } from "@/lib/api";

const STARTER_LESSON_CIRCUITS = {
  "Qubit Basics and Dirac Notation": {
    qubit_count: 1,
    circuit_ast: [{ gate: "measure", targets: [0], classical_reg: 0 }],
  },
  "Superposition and the Hadamard Gate": {
    qubit_count: 1,
    circuit_ast: [
      { gate: "h", targets: [0] },
      { gate: "measure", targets: [0], classical_reg: 0 },
    ],
  },
  "Entanglement and Bell States": {
    qubit_count: 2,
    circuit_ast: [
      { gate: "h", targets: [0] },
      { gate: "cx", targets: [0, 1] },
      { gate: "measure", targets: [0], classical_reg: 0 },
      { gate: "measure", targets: [1], classical_reg: 1 },
    ],
  },
  "Pauli and Phase Rotation Gates": {
    qubit_count: 2,
    circuit_ast: [
      { gate: "x", targets: [0] },
      { gate: "h", targets: [1] },
      { gate: "z", targets: [1] },
      { gate: "s", targets: [1] },
      { gate: "measure", targets: [0], classical_reg: 0 },
      { gate: "measure", targets: [1], classical_reg: 1 },
    ],
  },
  "The Deutsch-Jozsa Algorithm": {
    qubit_count: 2,
    circuit_ast: [
      { gate: "x", targets: [1] },
      { gate: "h", targets: [0] },
      { gate: "h", targets: [1] },
      { gate: "h", targets: [0] },
      { gate: "measure", targets: [0], classical_reg: 0 },
    ],
  },
  "Grover's Search Algorithm": {
    qubit_count: 2,
    circuit_ast: [
      { gate: "h", targets: [0] },
      { gate: "h", targets: [1] },
      { gate: "cz", targets: [0, 1] },
      { gate: "h", targets: [0] },
      { gate: "h", targets: [1] },
      { gate: "z", targets: [0] },
      { gate: "z", targets: [1] },
      { gate: "cz", targets: [0, 1] },
      { gate: "h", targets: [0] },
      { gate: "h", targets: [1] },
      { gate: "measure", targets: [0], classical_reg: 0 },
      { gate: "measure", targets: [1], classical_reg: 1 },
    ],
  },
};

export default function LessonsDrawer({ isOpen, onClose }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const addXP = useQuantumStore((state) => state.addXP);
  const loadCircuitToCanvas = useQuantumStore((state) => state.loadCircuitToCanvas);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function initCurriculum() {
      setIsLoading(true);
      try {
        const courseList = await fetchCourses();
        if (isMounted && Array.isArray(courseList) && courseList.length > 0) {
          setCourses(courseList);
          // Load details of first course by default
          const firstCourseData = await fetchCourseDetails(courseList[0].id);
          if (isMounted) {
            setSelectedCourse(firstCourseData);
            if (firstCourseData.lessons && firstCourseData.lessons.length > 0) {
              setSelectedLesson(firstCourseData.lessons[0]);
            }
          }
        }

        // Fetch completed lessons for current user
        if (currentUser?.id) {
          const prog = await fetchUserProgress(currentUser.id);
          if (isMounted && prog?.lessons) {
            const completed = new Set(prog.lessons.map((l) => l.lesson_id));
            setCompletedLessonIds(completed);
          }
        }
      } catch (err) {
        console.error("Curriculum load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initCurriculum();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser?.id]);

  const handleSelectCourse = async (courseSummary) => {
    try {
      const details = await fetchCourseDetails(courseSummary.id);
      setSelectedCourse(details);
      if (details.lessons && details.lessons.length > 0) {
        setSelectedLesson(details.lessons[0]);
      }
    } catch (e) {
      console.error("Failed to load course details:", e);
    }
  };

  const handleCompleteLesson = async (lesson) => {
    if (!lesson) return;
    setIsCompleting(true);
    const userId = currentUser?.id || "d1000000-0000-0000-0000-000000000001";
    try {
      await completeLesson(userId, lesson.id);
      setCompletedLessonIds((prev) => new Set([...prev, lesson.id]));
      setJustCompletedId(lesson.id);
      if (typeof addXP === "function") {
        addXP(50); // Award 50 XP
      }
    } catch (err) {
      console.error("Complete lesson error:", err);
      setCompletedLessonIds((prev) => new Set([...prev, lesson.id]));
      setJustCompletedId(lesson.id);
      if (typeof addXP === "function") {
        addXP(50);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLoadConceptCircuit = (lessonTitle) => {
    const circuitPreset = STARTER_LESSON_CIRCUITS[lessonTitle] || {
      qubit_count: 2,
      circuit_ast: [{ gate: "h", targets: [0] }, { gate: "cx", targets: [0, 1] }],
    };
    loadCircuitToCanvas(circuitPreset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 shadow-md shadow-cyan-500/20">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">QuantumCraft Interactive Curriculum</h2>
              <p className="text-[11px] text-slate-400">Master quantum physics, Dirac mathematics & algorithm theory</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
              <Award size={13} /> {completedLessonIds.size * 50} XP Earned
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

        {/* Body Layout */}
        <div className="flex min-h-0 flex-1 divide-x divide-slate-800">
          {/* Left Sidebar: Courses & Lessons */}
          <aside className="w-80 shrink-0 overflow-y-auto bg-slate-950/60 p-4 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Courses</span>
              <div className="space-y-1.5">
                {courses.map((c) => {
                  const isSelected = selectedCourse?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCourse(c)}
                      className={`w-full text-left rounded-xl p-2.5 transition-all ${
                        isSelected
                          ? "border border-cyan-500/50 bg-cyan-950/40 shadow-sm"
                          : "border border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            c.difficulty === "beginner"
                              ? "bg-teal-950 text-teal-300 border border-teal-800/60"
                              : c.difficulty === "intermediate"
                              ? "bg-purple-950 text-purple-300 border border-purple-800/60"
                              : "bg-amber-950 text-amber-300 border border-amber-800/60"
                          }`}
                        >
                          {c.difficulty}
                        </span>
                      </div>
                      <h4 className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-cyan-300" : "text-slate-200"}`}>
                        {c.title}
                      </h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lessons for Selected Course */}
            {selectedCourse && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedCourse.title} — Lessons
                </span>
                <div className="space-y-1">
                  {(selectedCourse.lessons || []).map((l, index) => {
                    const isSelected = selectedLesson?.id === l.id;
                    const isCompleted = completedLessonIds.has(l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLesson(l)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/40"
                            : "text-slate-300 hover:bg-slate-850 hover:text-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-slate-500">{index + 1}.</span>
                          <span className="truncate">{l.title}</span>
                        </div>
                        {isCompleted && <CheckCircle2 size={14} className="text-teal-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Right Theory Reader Panel */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-900/80 p-6">
            {selectedLesson ? (
              <div className="flex flex-col h-full justify-between space-y-6">
                <div className="space-y-4">
                  {/* Lesson Header */}
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
                      <BookOpen size={14} /> {selectedCourse?.title}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                      {selectedLesson.title}
                    </h1>
                  </div>

                  {/* Theory Content Body */}
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
                    {selectedLesson.content}
                  </div>
                </div>

                {/* Lesson Action Footer */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLoadConceptCircuit(selectedLesson.title)}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/60 px-4 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 transition-all shadow"
                    >
                      <Play size={13} /> Load Concept Circuit into Canvas
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {completedLessonIds.has(selectedLesson.id) ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-teal-950/80 border border-teal-500/40 px-4 py-2 text-xs font-bold text-teal-300">
                        <Check size={14} /> Completed (+50 XP Earned)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCompleteLesson(selectedLesson)}
                        disabled={isCompleting}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
                      >
                        <Sparkles size={14} />
                        {isCompleting ? "Recording Progress..." : "Mark as Completed (+50 XP)"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <BookOpen size={36} className="mb-2" />
                <p className="text-xs">Select a course and lesson from the sidebar to begin learning.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
