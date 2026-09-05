"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Bot,
  FileCode2,
  Folder,
  Grid2X2,
  Play,
  Search,
  Send,
  Settings,
  Sun,
  Terminal,
  User,
  Sparkles,
  ChevronDown,
  BookmarkPlus,
  FolderGit2,
  RotateCcw,
  BookOpen,
  Trophy,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  GRID_SIZE,
  LANE_HEIGHT,
  useQuantumStore,
} from "@/store/useQuantumStore";
import SimulationOutput from "@/components/SimulationOutput";
import AuthModal from "@/components/AuthModal";
import SaveCircuitModal from "@/components/SaveCircuitModal";
import MyCircuitsModal from "@/components/MyCircuitsModal";
import LessonsDrawer from "@/components/LessonsDrawer";
import ChallengesDrawer from "@/components/ChallengesDrawer";
import { sendTutorMessage, streamTutorMessage } from "@/lib/api";
import ReactFlow, {
  Background,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

function handleGateDragStart(event, gateType) {
  event.dataTransfer.setData("application/reactflow", gateType);
  event.dataTransfer.setData("text/plain", gateType);
  event.dataTransfer.effectAllowed = "copyMove";
}

const gateColorMap = {
  h: "border-cyan-400 text-cyan-300 bg-cyan-950/80 shadow-cyan-950/50",
  x: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  y: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  z: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  s: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  t: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  rx: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  ry: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  rz: "border-purple-400 text-purple-300 bg-purple-950/80 shadow-purple-950/50",
  cx: "border-blue-400 text-blue-300 bg-blue-950/80 shadow-blue-950/50",
  cz: "border-blue-400 text-blue-300 bg-blue-950/80 shadow-blue-950/50",
  swap: "border-blue-400 text-blue-300 bg-blue-950/80 shadow-blue-950/50",
  ccx: "border-blue-400 text-blue-300 bg-blue-950/80 shadow-blue-950/50",
  measure: "border-rose-400 text-rose-300 bg-rose-950/80 shadow-rose-950/50",
};

function GateNode({ id, data }) {
  const deleteGate = useQuantumStore((state) => state.deleteGate);
  const gateKey = (data?.gate || data?.label || "h").toLowerCase();
  const colorClass = gateColorMap[gateKey] || "border-cyan-400 text-cyan-300 bg-cyan-950/80";

  return (
    <div className={`group relative flex h-12 w-12 cursor-grab items-center justify-center rounded border font-mono font-bold shadow-lg transition-transform active:cursor-grabbing hover:scale-105 ${colorClass}`}>
      <span className="text-sm select-none">{data.label}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteGate(id);
        }}
        title="Remove Gate"
        className="absolute -top-1.5 -right-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white group-hover:flex hover:bg-rose-500 shadow"
      >
        ✕
      </button>
    </div>
  );
}

function WireNode({ data }) {
  return (
    <div className="pointer-events-none relative h-12 w-[3000px] select-none">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300 border border-slate-700 shadow">
          |0⟩ {data.label}
        </span>
      </div>
      <span className="absolute left-16 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-cyan-400/30" />
    </div>
  );
}

const nodeTypes = {
  gate: GateNode,
  wire: WireNode,
};

const gateLibrary = [
  {
    title: "Single Qubit Gates",
    items: [
      ["X", "X", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["H", "H", "border-cyan-400 text-cyan-300 bg-cyan-950/30"],
      ["Z", "Z", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["S", "S", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["T", "T", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["RX", "RX", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["RY", "RY", "border-purple-400 text-purple-300 bg-purple-950/30"],
      ["RZ", "RZ", "border-purple-400 text-purple-300 bg-purple-950/30"],
    ],
  },
  {
    title: "Multi Qubit Gates",
    items: [
      ["CX", "CX", "border-blue-400 text-blue-300 bg-blue-950/30"],
      ["CZ", "CZ", "border-blue-400 text-blue-300 bg-blue-950/30"],
      ["SWAP", "SWAP", "border-blue-400 text-blue-300 bg-blue-950/30"],
      ["Toffoli", "TOF", "border-blue-400 text-blue-300 bg-blue-950/30"],
    ],
  },
  {
    title: "Measurements",
    items: [["Measure", "M", "border-rose-400 text-rose-300 bg-rose-950/30"]],
  },
];

function GateLibrary() {
  const addGate = useQuantumStore((state) => state.addGate);

  return (
    <aside className="h-full w-full overflow-y-auto bg-slate-900 p-3 select-none">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-400">
        Gate Library
      </h2>
      <p className="mb-4 text-[10px] text-slate-400">
        Drag to canvas or click to append
      </p>
      <div className="space-y-5">
        {gateLibrary.map((category) => (
          <section key={category.title}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase text-slate-300">
              {category.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map(([gateType, label, color]) => (
                <div
                  key={gateType}
                  draggable
                  onDragStart={(event) => handleGateDragStart(event, gateType)}
                  onClick={() =>
                    addGate({
                      type: "gate",
                      data: { label: gateType.toUpperCase(), gate: gateType.toLowerCase() },
                    })
                  }
                  title={`Drag ${gateType} or click to add`}
                  className="flex min-h-16 cursor-grab flex-col items-center justify-center rounded border border-slate-800 bg-slate-950 px-1 text-[11px] text-slate-300 transition-all hover:border-cyan-500/50 hover:bg-slate-900 active:cursor-grabbing active:scale-95"
                >
                  <span className={"mb-1 rounded border px-2 py-0.5 font-mono font-bold " + color}>
                    {label}
                  </span>
                  {gateType}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function Nav({ onOpenAuth, onOpenLessons, onOpenChallenges }) {
  const currentUser = useQuantumStore((state) => state.currentUser);
  const loadUserFromStorage = useQuantumStore((state) => state.loadUserFromStorage);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    loadUserFromStorage();
    setIsHydrated(true);
  }, [loadUserFromStorage]);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 select-none">
      <div className="flex h-full items-center gap-8">
        <Link href="/" className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-cyan-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 font-mono text-sm shadow-md shadow-cyan-500/30">
            Ψ
          </span>
          QuantumCraft
        </Link>
        <nav className="hidden h-full items-center gap-7 md:flex">
          <button
            onClick={() => {}}
            className="flex h-full items-center border-b-2 border-cyan-300 text-sm font-medium text-cyan-300"
          >
            Workspace
          </button>
          <button
            onClick={onOpenLessons}
            className="flex h-full items-center border-b-2 border-transparent text-sm font-medium text-slate-300 hover:text-cyan-300 transition-colors gap-1.5"
          >
            <BookOpen size={14} className="text-teal-400" /> Lessons
          </button>
          <button
            onClick={onOpenChallenges}
            className="flex h-full items-center border-b-2 border-transparent text-sm font-medium text-slate-300 hover:text-cyan-300 transition-colors gap-1.5"
          >
            <Trophy size={14} className="text-purple-400" /> Challenges
          </button>
          <Link
            href="/profile"
            className="flex h-full items-center border-b-2 border-transparent text-sm font-medium text-slate-300 hover:text-cyan-300 transition-colors"
          >
            Profile
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle dark mode"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <Sun size={17} />
        </button>

        {isHydrated && currentUser ? (
          <button
            onClick={onOpenAuth}
            className="group flex items-center gap-2.5 rounded-full border border-slate-700 bg-slate-900 py-1 pl-1 pr-3 hover:border-cyan-500/60 hover:bg-slate-850 transition-all shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 font-mono text-xs font-bold text-white shadow">
              {currentUser.avatar || currentUser.full_name?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {currentUser.full_name}
                </span>
                <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400 border border-cyan-800/60">
                  {currentUser.role}
                </span>
              </div>
              <span className="text-[10px] font-medium text-amber-300">⚡ {currentUser.xp || 100} XP</span>
            </div>
            <ChevronDown size={13} className="text-slate-400 group-hover:text-cyan-300 transition-colors" />
          </button>
        ) : isHydrated ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400 bg-cyan-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-400/20 hover:bg-cyan-300 transition-colors"
          >
            <User size={14} />
            Sign In
          </button>
        ) : null}
      </div>
    </header>
  );
}

function ActivityBar({ onOpenMyCircuits, onOpenLessons, onOpenChallenges }) {
  return (
    <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-slate-800 bg-slate-850 pt-3 text-slate-400 select-none">
      <button
        type="button"
        title="Gate Library"
        className="flex flex-col items-center text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <Grid2X2 size={18} />
        <span className="mt-1 text-[8px] uppercase font-bold">Gates</span>
      </button>

      <button
        type="button"
        onClick={onOpenMyCircuits}
        title="Saved Circuits & Templates"
        className="mt-6 flex flex-col items-center text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <Folder size={18} />
        <span className="mt-1 text-[8px] uppercase font-bold">Circuits</span>
      </button>

      <button
        type="button"
        onClick={onOpenLessons}
        title="Interactive Curriculum"
        className="mt-6 flex flex-col items-center text-slate-400 hover:text-teal-300 transition-colors"
      >
        <BookOpen size={18} />
        <span className="mt-1 text-[8px] uppercase font-bold">Theory</span>
      </button>

      <button
        type="button"
        onClick={onOpenChallenges}
        title="Coding Challenges"
        className="mt-6 flex flex-col items-center text-slate-400 hover:text-purple-300 transition-colors"
      >
        <Trophy size={18} />
        <span className="mt-1 text-[8px] uppercase font-bold">Grader</span>
      </button>

      <div className="mt-auto flex flex-col items-center pb-3 space-y-4">
        <Terminal size={17} className="text-slate-500" />
        <Settings size={17} className="text-slate-500" />
      </div>
    </aside>
  );
}

function FlowCanvas({ onOpenSave, onOpenMyCircuits }) {
  const { project } = useReactFlow();
  const nodes = useQuantumStore((state) => state.nodes);
  const edges = useQuantumStore((state) => state.edges);
  const onNodesChange = useQuantumStore((state) => state.onNodesChange);
  const onEdgesChange = useQuantumStore((state) => state.onEdgesChange);
  const onConnect = useQuantumStore((state) => state.onConnect);
  const addGate = useQuantumStore((state) => state.addGate);
  const snapNodeToLane = useQuantumStore((state) => state.snapNodeToLane);
  const addWire = useQuantumStore((state) => state.addWire);
  const removeWire = useQuantumStore((state) => state.removeWire);
  const resetCanvas = useQuantumStore((state) => state.resetCanvas);
  const runSimulationAction = useQuantumStore((state) => state.runSimulationAction);
  const isSimulating = useQuantumStore((state) => state.isSimulating);
  const wires = nodes.filter((node) => node.type === "wire");

  function handleDrop(event) {
    event.preventDefault();
    const gateType =
      event.dataTransfer.getData("application/reactflow") ||
      event.dataTransfer.getData("text/plain");
    if (!gateType) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    addGate({
      type: "gate",
      position,
      data: { label: gateType.toUpperCase(), gate: gateType.toLowerCase() },
    });
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleNodeDrag(_event, node) {
    snapNodeToLane(node.id, node.position);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#020617]">
      {/* Workspace Toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3 text-xs uppercase z-10">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-cyan-400" />
          <span>Circuit Editor</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono normal-case text-slate-300">workspace.qc</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSave}
            title="Save Circuit to Profile"
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-cyan-500 hover:bg-slate-750 transition-colors"
          >
            <BookmarkPlus size={13} className="text-cyan-400" />
            Save
          </button>

          <button
            type="button"
            onClick={onOpenMyCircuits}
            title="Open Saved Circuits & Presets"
            className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-purple-500 hover:bg-slate-750 transition-colors"
          >
            <FolderGit2 size={13} className="text-purple-400" />
            Library
          </button>

          <button
            type="button"
            onClick={() => resetCanvas(2)}
            title="Reset Canvas"
            className="flex items-center gap-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>

          <button
            onClick={() => runSimulationAction()}
            disabled={isSimulating}
            className="flex items-center gap-1.5 rounded border border-cyan-400/60 bg-cyan-950/80 px-3 py-1 font-mono text-xs text-cyan-300 transition-all hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50"
          >
            <Play size={13} className={isSimulating ? "animate-spin" : ""} />
            {isSimulating ? "Simulating..." : "Run Simulation"}
          </button>
        </div>
      </div>

      <div
        id="react-flow-canvas"
        className="relative min-h-0 flex-1 w-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDrag={handleNodeDrag}
          snapToGrid
          snapGrid={[GRID_SIZE, LANE_HEIGHT]}
          zoomOnPinch
          zoomOnScroll={false}
          className="bg-[#020617]"
        >
          <Background variant="dots" size={2} color="#475569" gap={50} />
        </ReactFlow>
        <div className="absolute bottom-4 left-4 z-20 flex overflow-hidden rounded border border-slate-700 bg-slate-950/95 shadow-lg">
          <button
            type="button"
            aria-label="Add quantum wire"
            onClick={addWire}
            className="flex h-9 w-9 items-center justify-center border-r border-slate-700 text-xl text-cyan-300 hover:bg-slate-800"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Remove quantum wire"
            onClick={removeWire}
            disabled={!wires.length}
            className="flex h-9 w-9 items-center justify-center text-xl text-cyan-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-600"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}

function Code() {
  const storeCodeText = useQuantumStore((state) => state.codeText);
  const setNodesFromCode = useQuantumStore((state) => state.setNodesFromCode);
  const [localCode, setLocalCode] = useState(storeCodeText);
  const [prevStoreCode, setPrevStoreCode] = useState(storeCodeText);
  const [isFocused, setIsFocused] = useState(false);

  if (!isFocused && storeCodeText !== prevStoreCode) {
    setPrevStoreCode(storeCodeText);
    setLocalCode(storeCodeText);
  }

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalCode(val);
    setNodesFromCode(val);
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-slate-950">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3 text-xs uppercase text-cyan-300">
        <div className="flex items-center gap-2">
          <FileCode2 size={15} />
          Qiskit Editor
          <span className="text-slate-600">|</span>
          <span className="font-mono normal-case text-slate-200">circuit.py</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Bi-Directional Sync Active</span>
      </div>

      <div className="relative min-h-0 flex-1 p-3">
        <textarea
          value={localCode}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setNodesFromCode(localCode);
          }}
          spellCheck={false}
          className="h-full w-full resize-none rounded bg-slate-900/90 p-3 font-mono text-xs leading-6 text-cyan-200 outline-none ring-1 ring-slate-800 focus:ring-cyan-500/50"
          placeholder="# Type Qiskit commands (e.g., qc.h(0), qc.cx(0, 1))"
        />
      </div>
    </section>
  );
}

function Tutor() {
  const getCircuitAST = useQuantumStore((state) => state.getCircuitAST);
  const codeText = useQuantumStore((state) => state.codeText);
  const simulationResults = useQuantumStore((state) => state.simulationResults);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your QuantumCraft AI Tutor. Ask me about quantum gates, circuits, entanglement, or your current workspace!",
      suggested_actions: ["Explain Bell State", "What is a Hadamard gate?", "Explain Superposition"]
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend = input) => {
    const query = (typeof textToSend === "string" ? textToSend : input).trim();
    if (!query || isLoading) return;

    const userMessage = { role: "user", content: query };
    const updatedHistory = [...messages, userMessage];
    const assistantIndex = updatedHistory.length;

    setMessages([...updatedHistory, { role: "assistant", content: "", suggested_actions: [] }]);
    setInput("");
    setIsLoading(true);

    try {
      const circuitAst = typeof getCircuitAST === "function" ? getCircuitAST() : { qubit_count: 2, circuit_ast: [] };
      const circuitCtx = {
        qubit_count: circuitAst.qubit_count || 2,
        circuit_ast: circuitAst.circuit_ast || [],
        qiskit_code: codeText || "",
        simulation_counts: simulationResults?.counts || null,
      };

      await streamTutorMessage(
        query,
        updatedHistory,
        circuitCtx,
        (token, accumulated) => {
          setMessages((prev) => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: accumulated,
              };
            }
            return next;
          });
        },
        async (finalText) => {
          try {
            const chatRes = await sendTutorMessage(query, updatedHistory, circuitCtx);
            setMessages((prev) => {
              const next = [...prev];
              if (next[assistantIndex]) {
                next[assistantIndex] = {
                  role: "assistant",
                  content: finalText || chatRes.reply,
                  suggested_actions: chatRes.suggested_actions || []
                };
              }
              return next;
            });
          } catch {
            // Keep finalText
          }
          setIsLoading(false);
        },
        async () => {
          const res = await sendTutorMessage(query, updatedHistory, circuitCtx);
          setMessages((prev) => {
            const next = [...prev];
            next[assistantIndex] = {
              role: "assistant",
              content: res.reply || "I'm here to help with your quantum circuits!",
              suggested_actions: res.suggested_actions || []
            };
            return next;
          });
          setIsLoading(false);
        }
      );
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[assistantIndex] = {
          role: "assistant",
          content: "⚠️ Unable to reach the AI Tutor backend. Please make sure the backend server is running on http://localhost:8000."
        };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-900">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 px-3 text-xs uppercase text-cyan-300 font-semibold tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          AI Tutor
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Live Context</span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex items-start gap-2.5 max-w-[90%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-purple-400 bg-purple-900/40 text-purple-200">
                    <Bot size={15} />
                  </div>
                )}
                <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-5 whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-teal-950 border border-teal-500/50 text-teal-100"
                    : "bg-slate-800/90 border border-slate-700/60 text-slate-100"
                }`}>
                  {msg.content}
                </div>
              </div>

              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                  {msg.suggested_actions.map((act, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(act)}
                      className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-[11px] text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/60 transition-colors"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
              <Bot size={15} className="animate-pulse text-purple-400" />
              <span className="italic text-slate-400">AI Tutor is typing...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-auto shrink-0 border-t border-slate-800 p-3 bg-slate-900/90">
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 focus-within:border-cyan-500/70 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Ask about quantum concepts"
              placeholder="Ask about quantum concepts..."
              className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:hover:text-cyan-400 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Output() {
  return <SimulationOutput />;
}

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isMyCircuitsOpen, setIsMyCircuitsOpen] = useState(false);
  const [isLessonsOpen, setIsLessonsOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-[680px] flex-col overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      <Nav
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenLessons={() => setIsLessonsOpen(true)}
        onOpenChallenges={() => setIsChallengesOpen(true)}
      />

      <main className="flex min-h-0 flex-1">
        <ActivityBar
          onOpenMyCircuits={() => setIsMyCircuitsOpen(true)}
          onOpenLessons={() => setIsLessonsOpen(true)}
          onOpenChallenges={() => setIsChallengesOpen(true)}
        />

        <ResizablePanelGroup className="h-[calc(100vh-4rem)] min-w-0 flex-1" direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={12}><GateLibrary /></ResizablePanel>
          <ResizableHandle
            withHandle
            className="w-[2px] bg-slate-800 transition-colors hover:bg-teal-500 [&>div]:bg-slate-600"
          />
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={65} minSize={30}>
                <ReactFlowProvider>
                  <FlowCanvas
                    onOpenSave={() => setIsSaveOpen(true)}
                    onOpenMyCircuits={() => setIsMyCircuitsOpen(true)}
                  />
                </ReactFlowProvider>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-slate-800 transition-colors hover:bg-teal-500 active:bg-teal-500 [&>div]:bg-slate-600" />
              <ResizablePanel defaultSize={35} minSize={20}><Code /></ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="w-[2px] bg-slate-800 transition-colors hover:bg-teal-500 [&>div]:bg-slate-600"
          />
          <ResizablePanel defaultSize={25} minSize={18}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={60} minSize={25}><Tutor /></ResizablePanel>
              <ResizableHandle withHandle className="bg-slate-800 transition-colors hover:bg-teal-500 active:bg-teal-500 [&>div]:bg-slate-600" />
              <ResizablePanel defaultSize={40} minSize={20}><Output /></ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* Modals and Drawers */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SaveCircuitModal isOpen={isSaveOpen} onClose={() => setIsSaveOpen(false)} />
      <MyCircuitsModal isOpen={isMyCircuitsOpen} onClose={() => setIsMyCircuitsOpen(false)} />
      <LessonsDrawer isOpen={isLessonsOpen} onClose={() => setIsLessonsOpen(false)} />
      <ChallengesDrawer isOpen={isChallengesOpen} onClose={() => setIsChallengesOpen(false)} />
    </div>
  );
}
