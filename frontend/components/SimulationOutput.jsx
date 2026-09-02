"use client";

import React, { useState } from "react";
import { Activity, BarChart2, Globe, Sparkles, AlertTriangle } from "lucide-react";
import { useQuantumStore } from "@/store/useQuantumStore";
import BlochSphere from "./BlochSphere";

export default function SimulationOutput() {
  const [activeTab, setActiveTab] = useState("histogram");
  const simulationResults = useQuantumStore((state) => state.simulationResults);
  const isSimulating = useQuantumStore((state) => state.isSimulating);
  const simulationError = useQuantumStore((state) => state.simulationError);
  const shots = useQuantumStore((state) => state.shots);

  if (isSimulating) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-slate-900 p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs uppercase text-slate-300">
          <span className="flex items-center gap-2 font-bold">
            <Activity className="animate-spin text-cyan-400" size={14} />
            Simulating Circuit...
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="font-mono text-cyan-300">Executing Aer Backend...</p>
          <p className="mt-1 text-[11px] text-slate-500">Calculating statevectors and density matrices</p>
        </div>
      </section>
    );
  }

  if (simulationError) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-xs uppercase text-rose-400">
          <AlertTriangle size={14} />
          <span>Simulation Failed</span>
        </div>
        <div className="rounded-lg border border-rose-950 bg-rose-950/30 p-3 text-xs text-rose-300">
          <p className="font-semibold">Execution Error:</p>
          <p className="mt-1 font-mono text-[11px] text-rose-200">{simulationError}</p>
        </div>
      </section>
    );
  }

  if (!simulationResults) {
    return (
      <section className="flex h-full min-h-0 flex-col bg-slate-900 p-4">
        <h2 className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <BarChart2 size={14} className="text-cyan-400" />
          Simulation Output
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-xs text-slate-400">
          <Sparkles className="mb-2 text-cyan-400/60" size={24} />
          <p className="font-mono text-slate-300">No Simulation Executed</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Click <span className="text-cyan-300">&quot;Run Simulation&quot;</span> in the toolbar to observe counts &amp; Bloch sphere vectors.
          </p>
        </div>
      </section>
    );
  }

  const { counts = {}, bloch_vectors = [], execution_time_ms = 0, backend_used = "Aer" } = simulationResults;
  const totalShots = Object.values(counts).reduce((a, b) => a + b, 0) || shots || 1024;
  const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-900 p-3">
      {/* Header & Status */}
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
        <span className="flex items-center gap-1.5 font-bold uppercase text-slate-200">
          <BarChart2 size={14} className="text-cyan-400" />
          Simulation Output
        </span>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">{backend_used}</span>
          <span>{execution_time_ms}ms</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex border-b border-slate-800 font-mono text-[11px]">
        <button
          onClick={() => setActiveTab("histogram")}
          className={`flex items-center gap-1 border-b-2 px-3 py-1 transition-colors ${
            activeTab === "histogram"
              ? "border-cyan-400 font-bold text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 size={12} />
          Histograms
        </button>
        <button
          onClick={() => setActiveTab("bloch")}
          className={`flex items-center gap-1 border-b-2 px-3 py-1 transition-colors ${
            activeTab === "bloch"
              ? "border-cyan-400 font-bold text-cyan-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe size={12} />
          Bloch Sphere
        </button>
      </div>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "histogram" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Measurement Outcomes</span>
              <span className="font-mono text-cyan-300">Shots: {totalShots}</span>
            </div>

            <div className="space-y-2">
              {sortedCounts.map(([bitstring, count]) => {
                const pct = ((count / totalShots) * 100).toFixed(1);
                return (
                  <div
                    key={bitstring}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 shadow-sm"
                  >
                    <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-cyan-300">|{bitstring}⟩</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">{count} shots</span>
                        <span className="font-bold text-teal-300">{pct}%</span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "bloch" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bloch_vectors.length > 0 ? (
              bloch_vectors.map((bv) => (
                <BlochSphere
                  key={bv.qubit}
                  qubit={bv.qubit}
                  x={bv.x}
                  y={bv.y}
                  z={bv.z}
                />
              ))
            ) : (
              <div className="col-span-full py-6 text-center text-xs text-slate-400 font-mono">
                No single-qubit Bloch vector data available
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
