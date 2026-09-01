import Link from "next/link";
import {
  Activity,
  Bot,
  ChevronDown,
  FileCode2,
  Folder,
  Grid2X2,
  Play,
  Redo2,
  Search,
  Settings,
  Terminal,
  Undo2,
  Sun,
  Send,
} from "lucide-react";

const gates = [
  ["H", "Hadamard", "cyan"],
  ["X", "Pauli-X", "purple"],
  ["Y", "Pauli-Y", "purple"],
  ["Z", "Pauli-Z", "purple"],
];

function TopNav({ active = "Workspace" }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#3c494c] bg-[#0c1324] px-5">
      <div className="flex h-full items-center gap-8">
        <Link href="/" className="text-[22px] font-semibold tracking-tight text-[#8aebff]">QuantumCraft</Link>
      <nav className="hidden h-full items-center gap-7 md:flex">
        {["Workspace", "Lessons", "Challenges", "Profile"].map((item) => (
          <Link key={item} href={item === "Profile" ? "/profile" : "/"} className={`flex h-full items-center border-b-2 px-0.5 text-sm transition-colors ${active === item ? "border-[#8aebff] text-[#8aebff]" : "border-transparent text-[#bbc9cd] hover:text-[#dce1fb]"}`}>
            {item}
          </Link>
        ))}
      </nav>
      </div>
      <div className="flex items-center gap-4">
        <button aria-label="Toggle dark mode" className="flex h-8 w-8 items-center justify-center rounded-full text-[#bbc9cd] transition hover:bg-white/10 hover:text-[#8aebff]"><Sun size={17}/></button>
        <button className="border border-[#22d3ee] bg-[#22d3ee] px-4 py-1 text-sm text-[#001f25] transition hover:bg-[#8aebff]">Login</button>
      </div>
    </header>
  );
}

function ActivityBar() {
  return <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-[#3c494c] bg-[#23293c] pt-3 text-[#bbc9cd]">
    <div className="flex w-full flex-col items-center gap-1 border-l-2 border-[#8aebff] py-2 text-[#8aebff]"><Grid2X2 size={20}/><span className="text-[9px] uppercase">Gates</span></div>
    <div className="flex w-full flex-col items-center gap-1 py-3 hover:bg-white/5"><Folder size={20}/><span className="text-[9px] uppercase">Files</span></div>
    <div className="flex w-full flex-col items-center gap-1 py-3 hover:bg-white/5"><Search size={20}/><span className="text-[9px] uppercase">Find</span></div>
    <div className="mt-auto flex w-full flex-col items-center gap-1 py-3 hover:bg-white/5"><Terminal size={20}/><span className="text-[9px] uppercase">Term</span></div>
    <div className="flex w-full flex-col items-center gap-1 py-3 hover:bg-white/5"><Settings size={20}/><span className="text-[9px] uppercase">Set</span></div>
  </aside>;
}

function GatePanel() {
  return <aside className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-[#3c494c] bg-[#151b2d] lg:block">
    <div className="flex h-10 items-center justify-between border-b border-[#3c494c] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#dce1fb]">Quantum Gates <ChevronDown size={15}/></div>
    <div className="space-y-5 p-3">
      <GateGroup title="Single Qubit"><div className="grid grid-cols-2 gap-2">{gates.map(([letter, name, color]) => <div key={letter} className="flex h-[78px] cursor-grab flex-col items-center justify-center border border-[#3c494c] bg-[#0c1324] text-[11px] text-[#bbc9cd] hover:border-[#8aebff]"><span className={`mb-2 flex h-8 w-8 items-center justify-center border font-mono text-sm font-bold ${color === "cyan" ? "border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]" : "border-[#a855f7] bg-[#a855f7]/15 text-[#c084fc]"}`}>{letter}</span>{name}</div>)}</div></GateGroup>
      <GateGroup title="Multi Qubit"><div className="flex h-[78px] cursor-grab flex-col items-center justify-center border border-[#3c494c] bg-[#0c1324] text-[11px] text-[#bbc9cd]"><span className="relative mb-2 flex h-8 w-16 items-center justify-center border border-[#3b82f6] text-[#3b82f6]"><i className="absolute top-1 h-2 w-2 rounded-full bg-[#3b82f6]"/><i className="absolute h-px w-full bg-[#3b82f6]"/><i className="absolute bottom-1 h-3 w-3 rounded-full border border-[#3b82f6]"/></span>CNOT</div></GateGroup>
      <GateGroup title="Operations"><div className="flex h-[78px] cursor-grab flex-col items-center justify-center border border-[#3c494c] bg-[#0c1324] text-[11px] text-[#bbc9cd]"><span className="mb-2 flex h-8 w-12 items-center justify-center border border-[#f43f5e] bg-[#f43f5e]/15 text-[#f43f5e]">⌁</span>Measure</div></GateGroup>
    </div>
  </aside>;
}

function GateGroup({ title, children }) { return <section><h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#bbc9cd]">{title}</h2>{children}</section>; }

function CircuitPanel() {
  return <section className="relative flex min-h-[380px] flex-[3] flex-col bg-[#020617]">
    <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#3c494c] bg-[#191f31] px-3"><div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#dce1fb]"><Activity size={15}/> Circuit Editor <span className="text-[#3c494c]">|</span><span className="font-mono normal-case text-[#bbc9cd]">main.qc</span></div><div className="flex items-center gap-2"><Undo2 size={16} className="text-[#bbc9cd]"/><Redo2 size={16} className="text-[#bbc9cd]"/><button className="flex items-center gap-1 border border-[#8aebff]/40 bg-[#8aebff]/10 px-3 py-1.5 text-[11px] text-[#8aebff]"><Play size={13}/> Run Simulation</button></div></div>
    <div className="relative flex-1 overflow-hidden bg-[radial-gradient(#3c494c_1px,transparent_1px)] [background-size:24px_24px]"><div id="react-flow-canvas" aria-label="React Flow quantum circuit canvas" className="absolute inset-0"/><div className="absolute left-8 right-8 top-12 space-y-24 text-sm text-[#dce1fb]"><div className="flex items-center gap-4"><span className="font-mono">q[0]|0⟩</span><i className="h-px flex-1 bg-[#859397]"/></div><div className="flex items-center gap-4"><span className="font-mono">q[1]|0⟩</span><i className="h-px flex-1 bg-[#859397]"/></div></div><div className="pointer-events-none absolute left-[27%] top-10 flex flex-col gap-14"><div className="flex h-10 w-10 items-center justify-center border border-[#22d3ee] bg-[#22d3ee]/15 font-mono text-[#22d3ee]">H</div><div className="h-14 w-px self-center bg-[#3b82f6]"/><div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3b82f6] text-[#3b82f6]">⊕</div></div></div>
  </section>;
}

function CodePanel() {
  return <section className="flex min-h-[240px] flex-[2] flex-col border-t border-[#3c494c] bg-[#070d1f]"><div className="flex h-10 items-center gap-3 border-b border-[#3c494c] bg-[#191f31] px-3 text-[11px] uppercase tracking-wider text-[#8aebff]"><FileCode2 size={15}/> Qiskit Editor <span className="text-[#3c494c]">|</span><span className="font-mono normal-case text-[#dce1fb]">circuit.py</span><span className="font-mono normal-case text-[#bbc9cd]">results.json</span></div><div className="relative flex-1 overflow-hidden"><div id="python-code-editor" aria-label="Python code editor mount point" className="absolute inset-0"/><div className="pointer-events-none p-4 font-mono text-[13px] leading-7 text-[#dce1fb]"><div className="grid grid-cols-[32px_1fr]"><span className="text-[#64748b]">1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10<br/>11<br/>12</span><code><span className="text-[#d88bff]">from qiskit</span> <span className="text-[#8aebff]">import</span> QuantumCircuit, Aer, execute<br/><br/><span className="text-[#64748b] italic"># Create a Quantum Circuit with 2 qubits and 2 classical bits</span><br/><span className="text-[#f43f5e]">qc</span> = QuantumCircuit(2, 2)<br/><br/><span className="text-[#64748b] italic"># Apply a Hadamard gate to qubit 0</span><br/><span className="text-[#f43f5e]">qc</span>.h(0)<br/><br/><span className="text-[#64748b] italic"># Apply a CNOT gate with control qubit 0 and target qubit 1</span><br/><span className="text-[#f43f5e]">qc</span>.cx(0, 1)</code></div></div></div></section>;
}

function TutorPanel() { return <aside className="hidden w-[310px] shrink-0 flex-col border-l border-[#3c494c] bg-[#151b2d] xl:flex"><div className="flex h-10 items-center justify-between border-b border-[#3c494c] px-3 text-[11px] uppercase tracking-wider text-[#dce1fb]">◉ AI Tutor <span>•••</span></div><div className="relative flex min-h-0 flex-1 flex-col"><div id="ai-tutor-chat" aria-label="AI tutor chat mount point" className="absolute inset-0"/><div className="flex-1 overflow-y-auto p-4"><div className="mb-5 flex items-start gap-2"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#a855f7] bg-[#6f00be]/30 text-[#ddb7ff]"><Bot size={15}/></div><div className="max-w-[230px] rounded-lg bg-[#2e3447] p-3 text-sm leading-6 text-[#dce1fb]">I noticed you created a Bell State. This is an entangled state where the two qubits are perfectly correlated.<br/><br/>Would you like to learn how to implement quantum teleportation using this state?</div></div><div className="flex justify-end"><button className="max-w-[235px] rounded-lg border border-[#22d3ee]/40 bg-[#00363e] px-3 py-2 text-left text-sm text-[#dce1fb]">Yes, show me the circuit diagram.</button></div></div><div className="mt-auto shrink-0 border-t border-[#3c494c] p-3"><div className="flex items-center gap-2 rounded border border-[#3c494c] bg-[#020617] px-3"><input aria-label="Ask about quantum concepts" placeholder="Ask about quantum concepts..." className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#dce1fb] outline-none placeholder:text-[#64748b]"/><button aria-label="Send message" className="text-[#8aebff] transition hover:text-white"><Send size={18}/></button></div></div></div><div className="relative h-48 shrink-0 border-t border-[#3c494c] p-3"><div id="plotly-output" aria-label="Bloch sphere and Plotly mount point" className="absolute inset-0"/><h2 className="mb-3 text-[11px] uppercase tracking-wider text-[#dce1fb]">▥ Simulation Output</h2><div className="h-28 border border-[#3c494c] bg-[#020617] p-4 text-center font-mono text-xs text-[#bbc9cd]">Probabilities (Shots: 1024)<div className="mt-8 text-[#8aebff]">──────　──────<br/> |00⟩　 |11⟩</div></div></div></aside>; }

export default function Home() { return <div className="flex h-screen min-h-[680px] flex-col overflow-hidden bg-[#020617] font-sans antialiased text-[#dce1fb]"><TopNav/><main className="flex min-h-0 flex-1"><ActivityBar/><GatePanel/><div className="flex min-w-0 flex-1 flex-col"><CircuitPanel/><CodePanel/></div><TutorPanel/></main><footer className="flex h-6 shrink-0 items-center gap-5 border-t border-[#3c494c] bg-[#00363e] px-3 font-mono text-[11px] text-[#8aebff]"><span className="ml-auto text-[#bbc9cd]">Ln 8, Col 21　 UTF-8　 Python 3.10</span></footer></div>; }
