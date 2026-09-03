"use client";

import React from "react";

/**
 * 3D Bloch Sphere Vector Visualizer component.
 * Renders a quantum state vector on the Bloch sphere using SVG 3D perspective projection.
 */
export default function BlochSphere({ qubit = 0, x = 0, y = 0, z = 1 }) {
  // SVG center and radius
  const cx = 80;
  const cy = 80;
  const r = 60;

  // 3D Perspective Projection onto 2D SVG canvas
  const xProj = cx + x * r * 0.7 - y * r * 0.4;
  const yProj = cy - z * r * 0.85 + x * r * 0.3;

  return (
    <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-inner">
      <div className="mb-1 flex w-full items-center justify-between font-mono text-[11px] text-cyan-300">
        <span>Qubit q[{qubit}]</span>
        <span className="text-[10px] text-slate-400">
          ({x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)})
        </span>
      </div>

      <svg width="160" height="160" className="overflow-visible">
        <defs>
          <radialGradient id={`sphere-grad-${qubit}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
          <marker
            id={`arrow-${qubit}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
          </marker>
        </defs>

        {/* Sphere Outer Boundary */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#sphere-grad-${qubit})`}
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Equatorial Circle */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.35}
          fill="none"
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Vertical Axis (Z: |0> to |1>) */}
        <line
          x1={cx}
          y1={cy - r}
          x2={cx}
          y2={cy + r}
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* X Axis */}
        <line
          x1={cx - r * 0.7}
          y1={cy + r * 0.3}
          x2={cx + r * 0.7}
          y2={cy - r * 0.3}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Labels for basis states */}
        <text
          x={cx}
          y={cy - r - 6}
          textAnchor="middle"
          fill="#38bdf8"
          className="font-mono text-[10px] font-bold"
        >
          |0⟩ (+Z)
        </text>
        <text
          x={cx}
          y={cy + r + 14}
          textAnchor="middle"
          fill="#a855f7"
          className="font-mono text-[10px] font-bold"
        >
          |1⟩ (-Z)
        </text>

        {/* State Vector Arrow */}
        <line
          x1={cx}
          y1={cy}
          x2={xProj}
          y2={yProj}
          stroke="#06b6d4"
          strokeWidth="2.5"
          markerEnd={`url(#arrow-${qubit})`}
        />

        {/* Tip Dot */}
        <circle cx={xProj} cy={yProj} r="4" fill="#22d3ee" className="animate-pulse" />
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
        <div className="rounded bg-slate-900 px-1 py-0.5 text-cyan-400">
          X: {x.toFixed(2)}
        </div>
        <div className="rounded bg-slate-900 px-1 py-0.5 text-purple-400">
          Y: {y.toFixed(2)}
        </div>
        <div className="rounded bg-slate-900 px-1 py-0.5 text-emerald-400">
          Z: {z.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
