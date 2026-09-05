"use client";

import React, { useState, useEffect } from "react";
import { Award, X, CheckCircle2, Play, Sparkles, AlertCircle, HelpCircle, Trophy, Target, ArrowRight } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { fetchChallenges, evaluateChallenge, getChallengeHint } from "@/lib/api";

export default function ChallengesDrawer({ isOpen, onClose }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const getCircuitAST = useQuantumStore((state) => state.getCircuitAST);
  const addXP = useQuantumStore((state) => state.addXP);
  const loadCircuitToCanvas = useQuantumStore((state) => state.loadCircuitToCanvas);

  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState(null);
  const [hintText, setHintText] = useState("");
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [solvedChallenges, setSolvedChallenges] = useState(new Set());

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
    async function loadChallenges() {
      try {
        const list = await fetchChallenges();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setChallenges(list);
          setSelectedChallenge(list[0]);
        }
      } catch (err) {
        console.error("Failed to load challenges:", err);
      }
    }

    loadChallenges();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectChallenge = (ch) => {
    setSelectedChallenge(ch);
    setGradeResult(null);
    setHintText("");
  };

  const handleEvaluate = async () => {
    if (!selectedChallenge) return;
    setIsGrading(true);
    setGradeResult(null);

    const ast = typeof getCircuitAST === "function" ? getCircuitAST() : { qubit_count: 2, circuit_ast: [] };
    const payload = {
      user_id: currentUser?.id || "d1000000-0000-0000-0000-000000000001",
      qubit_count: ast.qubit_count || 2,
      circuit_ast: ast.circuit_ast || [],
      shots: 1024,
    };

    try {
      const res = await evaluateChallenge(selectedChallenge.id, payload);
      setGradeResult(res);
      if (res.status === "passed") {
        setSolvedChallenges((prev) => new Set([...prev, selectedChallenge.id]));
        if (typeof addXP === "function") {
          addXP(selectedChallenge.points || res.score || 50);
        }
      }
    } catch (err) {
      console.error("Challenge grading error:", err);
      setGradeResult({
        status: "failed",
        score: 0,
        feedback: "Could not evaluate circuit against target criteria. Check your gate placement and wire configuration.",
      });
    } finally {
      setIsGrading(false);
    }
  };

  const handleGetHint = async () => {
    if (!selectedChallenge) return;
    setIsLoadingHint(true);
    const ast = typeof getCircuitAST === "function" ? getCircuitAST() : { qubit_count: 2, circuit_ast: [] };
    try {
      const res = await getChallengeHint(selectedChallenge.id, ast.circuit_ast || []);
      setHintText(res.hint || "Review the target state probability distribution and required entangling gates.");
    } catch (err) {
      setHintText("Hint: Think about which single-qubit rotation or CNOT gate transforms the basis state towards the target distribution.");
    } finally {
      setIsLoadingHint(false);
    }
  };

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 text-slate-950 shadow-md shadow-purple-500/20">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Quantum Coding Challenges & Auto-Grader</h2>
              <p className="text-[11px] text-slate-400">Synthesize target quantum states & verify with real-time Qiskit simulation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-300">
              <Trophy size={13} /> {solvedChallenges.size} Solved
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

        {/* Content Layout */}
        <div className="flex min-h-0 flex-1 divide-x divide-slate-800">
          {/* Left Challenge List */}
          <aside className="w-80 shrink-0 overflow-y-auto bg-slate-950/60 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Challenges</span>
            <div className="space-y-2">
              {challenges.map((ch) => {
                const isSelected = selectedChallenge?.id === ch.id;
                const isSolved = solvedChallenges.has(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChallenge(ch)}
                    className={`w-full text-left rounded-xl p-3 transition-all ${
                      isSelected
                        ? "border border-purple-500/50 bg-purple-950/40 shadow-sm"
                        : "border border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          ch.difficulty === "beginner"
                            ? "bg-teal-950 text-teal-300 border border-teal-800/60"
                            : ch.difficulty === "intermediate"
                            ? "bg-purple-950 text-purple-300 border border-purple-800/60"
                            : "bg-amber-950 text-amber-300 border border-amber-800/60"
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                      <span className="text-[11px] font-bold text-amber-300">⚡ +{ch.points} XP</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-semibold line-clamp-1 ${isSelected ? "text-purple-300" : "text-slate-200"}`}>
                        {ch.title}
                      </h4>
                      {isSolved && <CheckCircle2 size={15} className="text-teal-400 shrink-0 ml-1.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Challenge Workspace & Auto-Grader */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-900/80 p-6 justify-between space-y-6">
            {selectedChallenge ? (
              <div className="space-y-5">
                {/* Challenge Details */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-purple-950 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300 border border-purple-800/60">
                      {selectedChallenge.difficulty}
                    </span>
                    <span className="text-xs font-bold text-amber-300">⚡ {selectedChallenge.points} Points</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                    {selectedChallenge.title}
                  </h1>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    {selectedChallenge.description}
                  </p>
                </div>

                {/* Target State Breakdown Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                    <Target size={15} /> Target Quantum State Criteria
                  </div>
                  {selectedChallenge.target_counts ? (
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                      <span>Expected Measurement:</span>
                      <div className="flex items-center gap-2">
                        {Object.entries(selectedChallenge.target_counts).map(([state, shots]) => (
                          <span key={state} className="rounded bg-slate-900 px-2 py-0.5 text-cyan-300 border border-slate-700">
                            |{state}⟩: {shots} shots
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedChallenge.target_state_vector && (
                    <div className="text-[11px] font-mono text-slate-400">
                      Statevector Target: {selectedChallenge.target_state_vector}
                    </div>
                  )}
                </div>

                {/* AI Hint Section */}
                {hintText && (
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-3.5 text-xs text-cyan-200 leading-5 animate-in fade-in">
                    <strong className="text-cyan-300 block mb-1">💡 AI Quantum Hint:</strong>
                    {hintText}
                  </div>
                )}

                {/* Grading Result Banner */}
                {gradeResult && (
                  <div
                    className={`rounded-xl border p-4 text-xs leading-5 animate-in fade-in ${
                      gradeResult.status === "passed"
                        ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-200"
                        : "border-rose-500/50 bg-rose-950/50 text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {gradeResult.status === "passed" ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="text-emerald-300">Challenge Passed! +{selectedChallenge.points} XP Earned</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-rose-400" />
                          <span className="text-rose-300">Grading Failed</span>
                        </>
                      )}
                    </div>
                    <p>{gradeResult.feedback}</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bottom Actions Footer */}
            {selectedChallenge && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGetHint}
                  disabled={isLoadingHint}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors"
                >
                  <HelpCircle size={14} />
                  {isLoadingHint ? "Asking AI..." : "Get AI Hint"}
                </button>

                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={isGrading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-purple-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  <Sparkles size={14} className="text-slate-950" />
                  {isGrading ? "Simulating & Grading..." : "Submit Active Circuit & Auto-Grade"}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
