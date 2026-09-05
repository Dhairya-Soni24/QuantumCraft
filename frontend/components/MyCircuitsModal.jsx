"use client";

import React, { useState, useEffect } from "react";
import { FolderGit2, X, Play, Trash2, Search, Sparkles, Layers, Cpu, Check } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { fetchCircuits, deleteCircuit } from "@/lib/api";

export default function MyCircuitsModal({ isOpen, onClose }) {
  const loadCircuitToCanvas = useQuantumStore((state) => state.loadCircuitToCanvas);
  const currentUser = useQuantumStore((state) => state.currentUser);

  const [circuits, setCircuits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadedId, setLoadedId] = useState(null);

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
    async function loadData() {
      setIsLoading(true);
      try {
        const backendCircuits = await fetchCircuits();
        if (isMounted) {
          setCircuits(Array.isArray(backendCircuits) ? backendCircuits : []);
        }
      } catch (err) {
        console.warn("Failed to fetch circuits:", err);
        if (isMounted) setCircuits([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoad = (circuit) => {
    loadCircuitToCanvas(circuit);
    setLoadedId(circuit.id);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleDelete = async (circuitId, e) => {
    e.stopPropagation();
    try {
      await deleteCircuit(circuitId);
      setCircuits((prev) => prev.filter((c) => c.id !== circuitId));
    } catch (err) {
      console.error("Delete failed:", err);
      setCircuits((prev) => prev.filter((c) => c.id !== circuitId));
    }
  };

  const filtered = circuits.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 shadow-lg shadow-cyan-500/20">
              <FolderGit2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Saved Circuits</h2>
              <p className="text-xs text-slate-400">1-click restore to active visual canvas & code editor</p>
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

        {/* Search Filter Bar */}
        <div className="border-b border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 focus-within:border-cyan-500/70 transition-colors">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search circuits by title or quantum concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Circuits List */}
        <div className="max-h-[55vh] min-h-[240px] overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Sparkles size={24} className="animate-spin text-cyan-400 mb-2" />
              <p className="text-xs">Loading saved circuits...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FolderGit2 size={32} className="text-slate-600 mb-2" />
              <p className="text-xs">No saved circuits found{searchQuery ? ` matching "${searchQuery}"` : ""}.</p>
            </div>
          ) : (
            filtered.map((circuit) => {
              const astData = circuit.canvas_json || {};
              const gates = Array.isArray(astData) ? astData : (astData.circuit_ast || astData.gates || []);
              const numQubits = astData.qubit_count || 2;
              const isCurrentLoaded = loadedId === circuit.id;

              return (
                <div
                  key={circuit.id}
                  onClick={() => handleLoad(circuit)}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    isCurrentLoaded
                      ? "border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-950/50"
                      : "border-slate-800 bg-slate-950/60 hover:border-cyan-500/60 hover:bg-slate-850"
                  }`}
                >
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {circuit.name}
                      </h3>
                      <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400 border border-cyan-800/60">
                        {circuit.framework || "Qiskit"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">{circuit.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Layers size={13} className="text-cyan-400" /> {numQubits} Qubits
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={13} className="text-purple-400" /> {gates.length} Gates
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoad(circuit)}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-400/60 bg-cyan-950/80 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all shadow"
                    >
                      {isCurrentLoaded ? (
                        <>
                          <Check size={13} /> Loaded
                        </>
                      ) : (
                        <>
                          <Play size={13} /> Load
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(circuit.id, e)}
                      title="Delete circuit"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-5 py-3 text-xs text-slate-400">
          <span>{filtered.length} saved circuit(s) in cloud storage</span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
