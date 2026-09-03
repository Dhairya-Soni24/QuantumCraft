/**
 * Qiskit Python code generator for canvas AST.
 */
export function generateQiskitCode(astPayload) {
  const qubitCount = astPayload?.qubit_count || 2;
  const circuitAst = astPayload?.circuit_ast || [];

  const lines = [
    "from qiskit import QuantumCircuit",
    `qc = QuantumCircuit(${qubitCount}, ${qubitCount})`,
    "",
  ];

  if (circuitAst.length === 0) {
    lines.push("# Add gates by dragging from library or typing Qiskit commands");
  }

  for (const inst of circuitAst) {
    const gate = (inst.gate || "h").toLowerCase();
    const t = inst.targets || [0];
    const p = inst.params || [];
    const c = inst.classical_reg !== undefined ? inst.classical_reg : t[0];

    if (gate === "h") {
      lines.push(`qc.h(${t[0]})`);
    } else if (gate === "x") {
      lines.push(`qc.x(${t[0]})`);
    } else if (gate === "y") {
      lines.push(`qc.y(${t[0]})`);
    } else if (gate === "z") {
      lines.push(`qc.z(${t[0]})`);
    } else if (gate === "s") {
      lines.push(`qc.s(${t[0]})`);
    } else if (gate === "t") {
      lines.push(`qc.t(${t[0]})`);
    } else if (gate === "cx" || gate === "cnot") {
      const target2 = t[1] !== undefined ? t[1] : (t[0] === 0 ? 1 : t[0] - 1);
      lines.push(`qc.cx(${t[0]}, ${target2})`);
    } else if (gate === "cz") {
      const target2 = t[1] !== undefined ? t[1] : (t[0] === 0 ? 1 : t[0] - 1);
      lines.push(`qc.cz(${t[0]}, ${target2})`);
    } else if (gate === "swap") {
      const target2 = t[1] !== undefined ? t[1] : (t[0] === 0 ? 1 : t[0] - 1);
      lines.push(`qc.swap(${t[0]}, ${target2})`);
    } else if (gate === "ccx" || gate === "toffoli") {
      const t1 = t[1] !== undefined ? t[1] : 1;
      const t2 = t[2] !== undefined ? t[2] : 2;
      lines.push(`qc.ccx(${t[0]}, ${t1}, ${t2})`);
    } else if (gate === "rx") {
      lines.push(`qc.rx(${p[0] || 0}, ${t[0]})`);
    } else if (gate === "ry") {
      lines.push(`qc.ry(${p[0] || 0}, ${t[0]})`);
    } else if (gate === "rz" || gate === "p" || gate === "phase") {
      lines.push(`qc.rz(${p[0] || 0}, ${t[0]})`);
    } else if (gate === "measure") {
      lines.push(`qc.measure(${t[0]}, ${c})`);
    }
  }

  return lines.join("\n");
}
