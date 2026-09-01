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

const gates = [
  ["H", "Hadamard", "text-cyan-300 border-cyan-400"],
  ["X", "Pauli-X", "text-purple-300 border-purple-400"],
  ["Y", "Pauli-Y", "text-purple-300 border-purple-400"],
  ["Z", "Pauli-Z", "text-purple-300 border-purple-400"],
];

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
      <div className="flex h-24 flex-col items-center justify-center border border-slate-800 bg-slate-950 text-xs text-slate-300">
        <span className="mb-2 text-blue-400">⊕</span>
        CNOT
      </div>
      <h3 className="mb-2 mt-6 text-[11px] uppercase text-slate-300">
        Operations
      </h3>
      <div className="flex h-24 flex-col items-center justify-center border border-slate-800 bg-slate-950 text-xs text-slate-300">
        <span className="mb-2 text-rose-400">⌁</span>
        Measure
      </div>
    </aside>
  );
}

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
          <ResizablePanel defaultSize={15} minSize={12}><Gates /></ResizablePanel>
          <ResizableHandle
            withHandle
            className="w-[2px] bg-slate-800 transition-colors hover:bg-teal-500 [&>div]:bg-slate-600"
          />
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={65} minSize={30}><Canvas /></ResizablePanel>
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
