"use client";

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
import ReactFlow, {
  Background,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

const gates = [
  ["H", "Hadamard", "text-cyan-300 border-cyan-400"],
  ["X", "Pauli-X", "text-purple-300 border-purple-400"],
  ["Y", "Pauli-Y", "text-purple-300 border-purple-400"],
  ["Z", "Pauli-Z", "text-purple-300 border-purple-400"],
];

function handleGateDragStart(event, gateType) {
  event.dataTransfer.setData("application/reactflow", gateType);
  event.dataTransfer.effectAllowed = "move";
}

function GateNode({ data }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center border border-cyan-400 bg-cyan-950 font-mono font-bold text-cyan-300 shadow-lg shadow-cyan-950/40">
      {data.label}
    </div>
  );
}

function WireNode({ data }) {
  return (
    <div className="pointer-events-none relative h-12 w-[75vw] min-w-[520px]">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-300">
        {data.label}
      </span>
      <span className="absolute left-9 right-0 top-1/2 h-px -translate-y-1/2 bg-cyan-300/60" />
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
      ["CX / CNOT", "CX", "border-blue-400 text-blue-300 bg-blue-950/30"],
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
  return (
    <aside className="h-full w-full overflow-y-auto bg-slate-900 p-3">
      <h2 className="mb-5 text-xs font-bold uppercase tracking-wider">
        Gate Library
      </h2>
      <div className="space-y-5">
        {gateLibrary.map((category) => (
          <section key={category.title}>
            <h3 className="mb-2 text-[11px] uppercase text-slate-300">
              {category.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map(([gateType, label, color]) => (
                <div
                  key={gateType}
                  draggable
                  onDragStart={(event) => handleGateDragStart(event, gateType)}
                  className="flex min-h-16 cursor-grab flex-col items-center justify-center border border-slate-800 bg-slate-950 px-1 text-[11px] text-slate-300 active:cursor-grabbing"
                >
                  <span className={"mb-1 border px-2 py-1 font-mono font-bold " + color}>
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

function Nav() {
  const links = ["Workspace", "Lessons", "Challenges", "Profile"];

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5">
      <div className="flex h-full items-center gap-8">
        <Link href="/" className="text-[22px] font-bold text-cyan-300">
          QuantumCraft
        </Link>
        <nav className="hidden h-full items-center gap-7 md:flex">
          {links.map((item) => (
            <Link
              key={item}
              href={item === "Profile" ? "/profile" : "/"}
              className={
                item === "Workspace"
                  ? "flex h-full items-center border-b-2 border-cyan-300 text-sm text-cyan-300"
                  : "flex h-full items-center border-b-2 border-transparent text-sm text-slate-300"
              }
            >
              {item}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle dark mode"
          className="rounded-full p-2 text-slate-300 hover:bg-white/10"
        >
          <Sun size={17} />
        </button>
        <button className="rounded-lg border border-cyan-400 bg-cyan-400 px-4 py-1 text-sm text-slate-950 hover:bg-cyan-300">
          Login
        </button>
      </div>
    </header>
  );
}

function ActivityBar() {
  return (
    <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-slate-800 bg-slate-800 pt-3 text-slate-300">
      <Grid2X2 />
      <span className="mt-1 text-[9px] uppercase">Gates</span>
      <Folder className="mt-8" />
      <span className="mt-1 text-[9px] uppercase">Files</span>
      <Search className="mt-8" />
      <span className="mt-1 text-[9px] uppercase">Find</span>
      <Terminal className="mt-auto" />
      <span className="mb-4 mt-1 text-[9px] uppercase">Term</span>
      <Settings className="mb-2" />
    </aside>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Gates() {
  return (
    <aside className="h-full w-full overflow-y-auto bg-slate-900 p-3">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-wider">
        Quantum Gates
      </h2>
      <h3 className="mb-2 text-[11px] uppercase text-slate-300">
        Single Qubit
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {gates.map(([letter, label, color]) => (
          <div
            key={letter}
            draggable
            onDragStart={(event) => handleGateDragStart(event, letter)}
            className="flex h-24 flex-col items-center justify-center border border-slate-800 bg-slate-950 text-xs text-slate-300"
          >
            <span className={"mb-2 border bg-white/5 px-3 py-2 font-mono font-bold " + color}>
              {letter}
            </span>
            {label}
          </div>
        ))}
      </div>
      <h3 className="mb-2 mt-6 text-[11px] uppercase text-slate-300">
        Multi Qubit
      </h3>
      <div
        draggable
        onDragStart={(event) => handleGateDragStart(event, "CNOT")}
        className="flex h-24 cursor-grab flex-col items-center justify-center border border-slate-800 bg-slate-950 text-xs text-slate-300"
      >
        <span className="mb-2 text-blue-400">⊕</span>
        CNOT
      </div>
      <h3 className="mb-2 mt-6 text-[11px] uppercase text-slate-300">
        Operations
      </h3>
      <div
        draggable
        onDragStart={(event) => handleGateDragStart(event, "MEASURE")}
        className="flex h-24 cursor-grab flex-col items-center justify-center border border-slate-800 bg-slate-950 text-xs text-slate-300"
      >
        <span className="mb-2 text-rose-400">⌁</span>
        Measure
      </div>
    </aside>
  );
}

function FlowCanvas() {
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
  const wires = nodes.filter((node) => node.type === "wire");

  function handleDrop(event) {
    event.preventDefault();
    const gateType = event.dataTransfer.getData("application/reactflow");
    if (!gateType) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    addGate({
      type: "gate",
      position,
      data: { label: gateType.toUpperCase() },
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
    <div
      id="react-flow-canvas"
      className="relative h-full w-full"
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
        <Background color="#334155" gap={GRID_SIZE} />
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
  );
}

// Kept as a visual fallback for the editor shell while FlowCanvas is mounted.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Canvas() {
  return (
    <section className="flex h-full min-h-0 flex-col bg-[#020617]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3 text-xs uppercase">
        <span className="flex items-center gap-2">
          <Activity size={15} />
          Circuit Editor
          <span className="text-slate-600">|</span>
          <span className="font-mono normal-case text-slate-300">main.qc</span>
        </span>
        <button className="flex items-center gap-1 border border-cyan-400/50 px-3 py-1 text-cyan-300">
          <Play size={13} />
          Run Simulation
        </button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]">
        <div id="react-flow-canvas" aria-label="React Flow quantum circuit canvas" className="absolute inset-0" />
        <div className="absolute inset-x-8 top-12 space-y-24 text-sm">
          <p className="flex items-center gap-4">
            <span className="font-mono">q[0]|0⟩</span>
            <i className="h-px flex-1 bg-slate-500" />
          </p>
          <p className="flex items-center gap-4">
            <span className="font-mono">q[1]|0⟩</span>
            <i className="h-px flex-1 bg-slate-500" />
          </p>
        </div>
      </div>
    </section>
  );
}

function Code() {
  return (
    <section className="relative flex h-full min-h-0 flex-col bg-slate-950">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 text-xs uppercase text-cyan-300">
        <FileCode2 size={15} />
        Qiskit Editor
        <span className="text-slate-600">|</span>
        <span className="font-mono normal-case text-slate-200">circuit.py</span>
      </div>
      <div id="python-code-editor" aria-label="Python code editor mount point" className="absolute inset-x-0 bottom-0 top-10" />
      <pre className="pointer-events-none overflow-hidden p-5 font-mono text-sm leading-8 text-slate-200">
        <span className="text-purple-300">from qiskit</span>{" "}
        <span className="text-cyan-300">import</span> QuantumCircuit, Aer,
        execute{"\n\n"}
        <span className="text-slate-500 italic"># Create a Quantum Circuit with 2 qubits and 2 classical bits</span>
        {"\n"}
        <span className="text-rose-400">qc</span> = QuantumCircuit(2, 2)
        {"\n\n"}
        <span className="text-slate-500 italic"># Apply a Hadamard gate to qubit 0</span>
        {"\n"}
        <span className="text-rose-400">qc</span>.h(0)
      </pre>
    </section>
  );
}

function Tutor() {
  return (
    <section className="flex h-full min-h-0 flex-col bg-slate-900">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 px-3 text-xs uppercase">
        ◉ AI Tutor <span>•••</span>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div id="ai-tutor-chat" aria-label="AI tutor chat mount point" className="pointer-events-none absolute inset-0" />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-5 flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-400 bg-purple-900/40 text-purple-200">
              <Bot size={16} />
            </div>
            <div className="max-w-[230px] rounded-xl bg-slate-700 p-3 text-sm leading-6">
              I noticed you created a Bell State. This is an entangled state where the two qubits are perfectly correlated.
              <br /><br />
              Would you like to learn how to implement quantum teleportation using this state?
            </div>
          </div>
          <div className="flex justify-end">
            <button className="max-w-[235px] rounded-xl border border-cyan-400/50 bg-teal-950 px-3 py-3 text-left text-sm">
              Yes, show me the circuit diagram.
            </button>
          </div>
        </div>
        <div className="mt-auto shrink-0 border-t border-slate-800 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-950 px-3">
            <input
              type="text"
              aria-label="Ask about quantum concepts"
              placeholder="Ask about quantum concepts..."
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button type="button" aria-label="Send message" className="text-cyan-300">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Output() {
  return (
    <section className="relative h-full bg-slate-900 p-3">
      <div id="plotly-output" aria-label="Bloch sphere and Plotly mount point" className="pointer-events-none absolute inset-0" />
      <h2 className="mb-3 text-xs uppercase">▥ Simulation Output</h2>
      <div className="border border-slate-800 bg-slate-950 p-5 text-center text-xs text-slate-300">
        Probabilities (Shots: 1024)
        <div className="mt-8 text-cyan-300">──────　──────<br />|00⟩　 |11⟩</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex h-screen min-h-[680px] flex-col overflow-hidden bg-slate-950 font-sans antialiased text-slate-100">
      <Nav />
      <main className="flex min-h-0 flex-1">
        <ActivityBar />
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
                  <FlowCanvas />
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
    </div>
  );
}
