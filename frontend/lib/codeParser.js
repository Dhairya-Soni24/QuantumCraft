/**
 * Qiskit Python code parser (Reverse parsing from Qiskit code to AST).
 */
export function parseQiskitCodeToAST(codeString) {
  if (!codeString || typeof codeString !== "string") {
    return { qubit_count: 2, circuit_ast: [] };
  }

  let qubitCount = 2;
  const qcMatch = codeString.match(/QuantumCircuit\(\s*(\d+)/i);
  if (qcMatch) {
    qubitCount = Math.max(1, parseInt(qcMatch[1], 10));
  }

  const circuit_ast = [];
  const lines = codeString.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("from ") ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("qc = QuantumCircuit") ||
      trimmed.startsWith("print")
    ) {
      continue;
    }

    // Single qubit gate: qc.h(0), qc.x(1), qc.y(0), qc.z(0), qc.s(0), qc.t(0)
    const singleGateMatch = trimmed.match(/qc\.(h|x|y|z|s|t)\(\s*(\d+)\s*\)/i);
    if (singleGateMatch) {
      circuit_ast.push({
        gate: singleGateMatch[1].toLowerCase(),
        targets: [parseInt(singleGateMatch[2], 10)],
      });
      continue;
    }

    // Two qubit gate: qc.cx(0, 1), qc.cz(0, 1), qc.swap(0, 1)
    const twoQubitMatch = trimmed.match(/qc\.(cx|cnot|cz|swap)\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (twoQubitMatch) {
      const gname = twoQubitMatch[1].toLowerCase() === "cnot" ? "cx" : twoQubitMatch[1].toLowerCase();
      circuit_ast.push({
        gate: gname,
        targets: [parseInt(twoQubitMatch[2], 10), parseInt(twoQubitMatch[3], 10)],
      });
      continue;
    }

    // Three qubit gate: qc.ccx(0, 1, 2), qc.toffoli(0, 1, 2)
    const threeQubitMatch = trimmed.match(/qc\.(ccx|toffoli)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (threeQubitMatch) {
      circuit_ast.push({
        gate: "ccx",
        targets: [
          parseInt(threeQubitMatch[2], 10),
          parseInt(threeQubitMatch[3], 10),
          parseInt(threeQubitMatch[4], 10),
        ],
      });
      continue;
    }

    // Rotation gates: qc.rx(0.5, 0), qc.ry(0.5, 0), qc.rz(0.5, 0)
    const rotMatch = trimmed.match(/qc\.(rx|ry|rz|p|phase)\(\s*([^,]+)\s*,\s*(\d+)\s*\)/i);
    if (rotMatch) {
      const val = parseFloat(rotMatch[2]);
      circuit_ast.push({
        gate: rotMatch[1].toLowerCase(),
        targets: [parseInt(rotMatch[3], 10)],
        params: [isNaN(val) ? 0 : val],
      });
      continue;
    }

    // Measurement: qc.measure(0, 0)
    const measMatch = trimmed.match(/qc\.measure\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (measMatch) {
      circuit_ast.push({
        gate: "measure",
        targets: [parseInt(measMatch[1], 10)],
        classical_reg: parseInt(measMatch[2], 10),
      });
      continue;
    }
  }

  return {
    qubit_count: qubitCount,
    circuit_ast,
  };
}

/**
 * Converts AST definition back into React Flow wire & gate nodes array for the store.
 */
export function astToReactFlowNodes(astPayload, LANE_HEIGHT = 100, GRID_SIZE = 80) {
  const qubitCount = astPayload?.qubit_count || 2;
  const circuitAst = astPayload?.circuit_ast || [];

  const nodes = [];

  // 1. Generate Wire nodes
  for (let i = 0; i < qubitCount; i++) {
    nodes.push({
      id: `wire-q${i}`,
      type: "wire",
      position: { x: 16, y: i * LANE_HEIGHT },
      draggable: false,
      selectable: false,
      data: { label: `q${i}` },
    });
  }

  // 2. Track lane column x-offsets to place gates chronologically left-to-right
  const laneXMap = {};
  for (let i = 0; i < qubitCount; i++) {
    laneXMap[i] = GRID_SIZE;
  }

  // 3. Generate Gate nodes
  circuitAst.forEach((inst, index) => {
    const gateUpper = (inst.gate || "H").toUpperCase();
    const primaryQubit = inst.targets && inst.targets.length > 0 ? inst.targets[0] : 0;
    const laneIndex = Math.min(Math.max(primaryQubit, 0), qubitCount - 1);

    const startX = laneXMap[laneIndex] || GRID_SIZE;
    const position = {
      x: startX,
      y: laneIndex * LANE_HEIGHT,
    };

    // Update column offset for involved qubits
    const involved = inst.targets || [laneIndex];
    involved.forEach((q) => {
      laneXMap[q] = Math.max(laneXMap[q] || GRID_SIZE, startX + GRID_SIZE);
    });

    const targetStr = (inst.targets || []).join("_");
    const stableId = `gate-ast-${index}-${inst.gate}-${targetStr}`;

    nodes.push({
      id: stableId,
      type: "gate",
      position,
      data: {
        label: gateUpper,
        gate: inst.gate,
        targets: inst.targets,
        controlQubit: inst.targets && inst.targets.length > 1 ? inst.targets[0] : undefined,
        classical_reg: inst.classical_reg,
        params: inst.params,
      },
    });
  });

  return nodes;
}
