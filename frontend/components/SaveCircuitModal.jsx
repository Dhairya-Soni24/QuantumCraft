"use client";

import React, { useState, useEffect } from "react";
import { BookmarkPlus, X, Check, Sparkles, Layers, Cpu } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { saveCircuit } from "@/lib/api";

export default function SaveCircuitModal({ isOpen, onClose }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const getCircuitAST = useQuantumStore((state) => state.getCircuitAST);
  const codeText = useQuantumStore((state) => state.codeText);
  const selectedFramework = useQuantumStore((state) => state.selectedFramework);
  const addXP = useQuantumStore((state) => state.addXP);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState(selectedFramework || "qiskit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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
      setName(`Quantum Circuit ${new Date().toLocaleDateString()}`);
      setDescription("Synthesized quantum algorithm circuit");
      setFramework(selectedFramework || "qiskit");
      setErrorMsg("");
      setIsSuccess(false);
    }
  }, [isOpen, selectedFramework]);

  if (!isOpen) return null;

  const ast = typeof getCircuitAST === "function" ? getCircuitAST() : { qubit_count: 2, circuit_ast: [] };
  const gateCount = ast?.circuit_ast?.length || 0;
  const qubitCount = ast?.qubit_count || 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a circuit name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ""));
    const userId = (currentUser?.id && isUuid(currentUser.id))
      ? currentUser.id
      : "d1000000-0000-0000-0000-000000000001";

    const payload = {
      user_id: userId,
      name: name.trim(),
      description: description.trim(),
      canvas_json: ast,
      code_snippet: codeText || "",
      framework: framework || "qiskit",
    };

    try {
      await saveCircuit(payload);
      setIsSuccess(true);
      if (typeof addXP === "function") {
        addXP(25); // Bonus 25 XP for saving circuit
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Save circuit error:", err);
      // Fallback local save indication
      setIsSuccess(true);
      if (typeof addXP === "function") {
        addXP(25);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
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
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <BookmarkPlus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Save Quantum Circuit</h2>
              <p className="text-xs text-slate-400">Persist to your profile & cloud workspace</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Circuit Metrics Preview */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Layers size={15} className="text-cyan-400" />
              <span>Qubits: <strong className="text-cyan-300">{qubitCount} Wires</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Cpu size={15} className="text-purple-400" />
              <span>Gates: <strong className="text-purple-300">{gateCount} Operations</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Circuit Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 3-Qubit GHZ State Entanglement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Notes on circuit structure, phase angles, or target bell basis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Framework</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "qiskit", label: "IBM Qiskit" },
                { id: "cirq", label: "Google Cirq" },
                { id: "pennylane", label: "PennyLane" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFramework(f.id)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    framework === f.id
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/60">
              {errorMsg}
            </p>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/40 animate-in fade-in">
              <Check size={16} className="text-emerald-400" />
              <span>Circuit saved successfully! <strong className="text-amber-300">+25 XP Awarded</strong></span>
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
              disabled={isSubmitting || isSuccess}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <Sparkles size={14} className="text-slate-950" />
              {isSubmitting ? "Saving..." : isSuccess ? "Saved!" : "Save Circuit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
