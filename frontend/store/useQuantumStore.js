import { addEdge, applyEdgeChanges, applyNodeChanges } from "reactflow";
import { create } from "zustand";
import { runSimulation } from "@/lib/api";
import { generateQiskitCode } from "@/lib/codeGenerators";
import { parseQiskitCodeToAST, astToReactFlowNodes } from "@/lib/codeParser";

export const LANE_HEIGHT = 100;
export const GRID_SIZE = 80;

export function snapPosition(position) {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / LANE_HEIGHT) * LANE_HEIGHT,
  };
}

function wireNodes(nodes) {
  return nodes.filter((node) => node.type === "wire");
}

function gateNodes(nodes) {
  return nodes.filter((node) => node.type === "gate");
}

export function normalizeGateName(rawName) {
  if (!rawName) return "h";
  const name = String(rawName).trim().toLowerCase();
  if (name.includes("cnot") || name.includes("cx")) return "cx";
  if (name.includes("toffoli") || name === "tof" || name === "ccx") return "ccx";
  if (name.includes("measure") || name === "m") return "measure";
  if (name === "phase") return "p";
  return name;
}

export const DEFAULT_USER = {
  id: "d1000000-0000-0000-0000-000000000001",
  email: "dhairya@quantumcraft.dev",
  full_name: "Dhairya Soni",
  role: "admin",
  xp: 450,
  avatar: "DS",
  color: "from-cyan-500 to-blue-600",
  badge: "Admin & Lead Researcher",
};

function getInitialUser() {
  if (typeof window === "undefined") return null;
  try {
    const savedStr = localStorage.getItem("quantumcraft_user");
    if (!savedStr) return null;
    const parsed = JSON.parse(savedStr);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(parsed?.id || ""));
    return isUuid ? parsed : null;
  } catch {
    return null;
  }
}

const defaultInitialNodes = astToReactFlowNodes(
  { qubit_count: 2, circuit_ast: [] },
  LANE_HEIGHT,
  GRID_SIZE
);

export const useQuantumStore = create((set, get) => ({
  currentUser: getInitialUser(),
  nodes: defaultInitialNodes,
  edges: [],
  selectedFramework: "qiskit",
  shots: 1024,
  simulationResults: null,
  isSimulating: false,
  simulationError: null,
  codeText: "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\n",
  isSyncingFromCode: false,

  loadUserFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const savedStr = localStorage.getItem("quantumcraft_user");
      if (!savedStr) {
        set({ currentUser: null });
        return;
      }
      const parsed = JSON.parse(savedStr);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(parsed?.id || ""));
      if (!isUuid) {
        localStorage.removeItem("quantumcraft_user");
        set({ currentUser: null });
        return;
      }
      set({ currentUser: parsed });
    } catch {
      set({ currentUser: null });
    }
  },

  setCurrentUser: (user) => {
    if (typeof window !== "undefined" && user) {
      try {
        localStorage.setItem("quantumcraft_user", JSON.stringify(user));
      } catch {}
    }
    set({ currentUser: user });
  },

  logoutUser: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("quantumcraft_user");
      } catch {}
    }
    set({ currentUser: null });
  },

  updateUserProfile: (updates) =>
    set((state) => {
      if (!state.currentUser) return state;
      const updated = {
        ...state.currentUser,
        ...updates,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("quantumcraft_user", JSON.stringify(updated));
        } catch {}
      }
      return { currentUser: updated };
    }),

  addXP: (amount) =>
    set((state) => {
      if (!state.currentUser) return state;
      const updated = {
        ...state.currentUser,
        xp: (state.currentUser.xp || 0) + amount,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("quantumcraft_user", JSON.stringify(updated));
        } catch {}
      }
      return { currentUser: updated };
    }),

  setFramework: (framework) => set({ selectedFramework: framework }),
  setShots: (shots) => set({ shots }),
  setSimulationResults: (results) =>
    set({ simulationResults: results, isSimulating: false, simulationError: null }),

  updateCodeFromCanvas: () => {
    const { getCircuitAST, isSyncingFromCode } = get();
    if (isSyncingFromCode) return;
    const ast = getCircuitAST();
    const newCode = generateQiskitCode(ast);
    set({ codeText: newCode });
  },

  loadCircuitToCanvas: (circuitAstOrPayload) => {
    try {
      let ast = circuitAstOrPayload;
      if (circuitAstOrPayload?.canvas_json) {
        ast = circuitAstOrPayload.canvas_json;
      }
      if (typeof ast === "string") {
        try {
          ast = JSON.parse(ast);
        } catch {
          return get().setNodesFromCode(ast);
        }
      }
      const rawGates = Array.isArray(ast) ? ast : (ast?.circuit_ast || ast?.gates || []);
      let maxQubit = 1;
      rawGates.forEach((g) => {
        if (Array.isArray(g.targets)) {
          maxQubit = Math.max(maxQubit, ...g.targets);
        }
      });
      const qubitCount = ast?.qubit_count || (maxQubit + 1);
      const structuredAst = { qubit_count: Math.max(qubitCount, 1), circuit_ast: rawGates };
      const newNodes = astToReactFlowNodes(structuredAst, LANE_HEIGHT, GRID_SIZE);
      const code = generateQiskitCode(structuredAst);
      set({
        nodes: newNodes,
        codeText: code,
        simulationResults: null,
        simulationError: null,
      });
    } catch (e) {
      console.error("Failed to load circuit into canvas:", e);
    }
  },

  resetCanvas: (numQubits = 2) => {
    const defaultAst = { qubit_count: numQubits, circuit_ast: [] };
    const newNodes = astToReactFlowNodes(defaultAst, LANE_HEIGHT, GRID_SIZE);
    const code = generateQiskitCode(defaultAst);
    set({
      nodes: newNodes,
      codeText: code,
      simulationResults: null,
      simulationError: null,
    });
  },

  setNodesFromCode: (codeString) => {
    set({ codeText: codeString, isSyncingFromCode: true });
    try {
      const ast = parseQiskitCodeToAST(codeString);
      const newNodes = astToReactFlowNodes(ast, LANE_HEIGHT, GRID_SIZE);
      set({ nodes: newNodes, isSyncingFromCode: false });
    } catch (e) {
      console.error("Error parsing code to canvas:", e);
      set({ isSyncingFromCode: false });
    }
  },

  runSimulationAction: async () => {
    const { getCircuitAST } = get();
    set({ isSimulating: true, simulationError: null });
    try {
      const ast = getCircuitAST();
      const results = await runSimulation(ast);
      set({ simulationResults: results, isSimulating: false });
      return results;
    } catch (error) {
      set({
        simulationError: error.message || "Simulation failed",
        isSimulating: false,
      });
      throw error;
    }
  },

  onNodesChange: (changes) =>
    set((state) => {
      const updatedNodes = applyNodeChanges(
        changes.map((change) =>
          change.type === "position" && change.position
            ? { ...change, position: snapPosition(change.position) }
            : change
        ),
        state.nodes
      );

      const nextState = { nodes: updatedNodes };
      if (!state.isSyncingFromCode) {
        const wires = wireNodes(updatedNodes);
        const numQubits = Math.max(wires.length, 1);
        const gateList = gateNodes(updatedNodes).sort((a, b) =>
          a.position.x !== b.position.x ? a.position.x - b.position.x : a.position.y - b.position.y
        );

        const circuit_ast = gateList.map((node) => {
          const rawGate = node.data?.gate || node.data?.label || "h";
          const gname = normalizeGateName(rawGate);
          const laneIndex = Math.max(0, Math.round(node.position.y / LANE_HEIGHT));
          const targetQubit = Math.min(laneIndex, numQubits - 1);
          let targets;
          if (Array.isArray(node.data?.targets)) {
            targets = node.data.targets;
          } else if (["cx", "cz", "swap"].includes(gname)) {
            targets = typeof node.data?.controlQubit === "number" ? [node.data.controlQubit, targetQubit] : (targetQubit === 0 ? [0, 1] : [targetQubit - 1, targetQubit]);
          } else if (gname === "ccx") {
            targets = targetQubit >= 2 ? [targetQubit - 2, targetQubit - 1, targetQubit] : (numQubits >= 3 ? [0, 1, 2] : [targetQubit, targetQubit, targetQubit]);
          } else {
            targets = [targetQubit];
          }
          return { gate: gname, targets };
        });

        nextState.codeText = generateQiskitCode({ qubit_count: numQubits, circuit_ast });
      }

      return nextState;
    }),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
    })),

  addWire: () =>
    set((state) => {
      const count = wireNodes(state.nodes).length;
      const updatedNodes = [
        ...state.nodes,
        {
          id: `wire-q${count}`,
          type: "wire",
          position: { x: 16, y: count * LANE_HEIGHT },
          draggable: false,
          selectable: false,
          data: { label: `q${count}` },
        },
      ];
      const wires = wireNodes(updatedNodes);
      const numQubits = Math.max(wires.length, 1);
      const newCode = generateQiskitCode({ qubit_count: numQubits, circuit_ast: get().getCircuitAST().circuit_ast });
      return { nodes: updatedNodes, codeText: newCode };
    }),

  removeWire: () =>
    set((state) => {
      const wires = wireNodes(state.nodes);
      if (wires.length <= 1) return state;

      const lastWire = wires[wires.length - 1];
      const remainingNodes = state.nodes.filter(
        (node) =>
          node.id !== lastWire.id &&
          !(
            node.type === "gate" &&
            Math.round(node.position.y / LANE_HEIGHT) >= wires.length - 1
          )
      );
      const remainingWires = wireNodes(remainingNodes);
      const numQubits = Math.max(remainingWires.length, 1);
      const newCode = generateQiskitCode({ qubit_count: numQubits, circuit_ast: get().getCircuitAST().circuit_ast });

      return { nodes: remainingNodes, codeText: newCode };
    }),

  deleteGate: (nodeId) =>
    set((state) => {
      const updatedNodes = state.nodes.filter((node) => node.id !== nodeId);
      const wires = wireNodes(updatedNodes);
      const numQubits = Math.max(wires.length, 1);
      const gateList = gateNodes(updatedNodes).sort((a, b) =>
        a.position.x !== b.position.x ? a.position.x - b.position.x : a.position.y - b.position.y
      );

      const circuit_ast = gateList.map((node) => {
        const rawGate = node.data?.gate || node.data?.label || "h";
        const gname = normalizeGateName(rawGate);
        const lIndex = Math.max(0, Math.round(node.position.y / LANE_HEIGHT));
        const targetQubit = Math.min(lIndex, numQubits - 1);
        let targets;
        if (Array.isArray(node.data?.targets)) {
          targets = node.data.targets;
        } else if (["cx", "cz", "swap"].includes(gname)) {
          targets = typeof node.data?.controlQubit === "number" ? [node.data.controlQubit, targetQubit] : (targetQubit === 0 ? [0, 1] : [targetQubit - 1, targetQubit]);
        } else if (gname === "ccx") {
          targets = targetQubit >= 2 ? [targetQubit - 2, targetQubit - 1, targetQubit] : (numQubits >= 3 ? [0, 1, 2] : [targetQubit, targetQubit, targetQubit]);
        } else {
          targets = [targetQubit];
        }
        return { gate: gname, targets };
      });

      const newCode = generateQiskitCode({ qubit_count: numQubits, circuit_ast });
      return { nodes: updatedNodes, codeText: newCode };
    }),

  snapNodeToLane: (nodeId, position) =>
    set((state) => {
      const wires = wireNodes(state.nodes);
      const snapped = snapPosition(position);
      const laneIndex = Math.min(
        Math.max(Math.round(snapped.y / LANE_HEIGHT), 0),
        Math.max(wires.length - 1, 0)
      );

      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId && node.type === "gate"
          ? {
              ...node,
              position: {
                x: Math.max(GRID_SIZE, snapped.x),
                y: laneIndex * LANE_HEIGHT,
              },
            }
          : node
      );

      return { nodes: updatedNodes };
    }),

  addGate: (gate) =>
    set((state) => {
      let currentNodes = state.nodes;
      let wires = wireNodes(currentNodes);
      if (wires.length === 0) {
        currentNodes = astToReactFlowNodes(
          { qubit_count: 2, circuit_ast: [] },
          LANE_HEIGHT,
          GRID_SIZE
        );
        wires = wireNodes(currentNodes);
      }

      const rawPos = gate.position || { x: GRID_SIZE, y: 0 };
      const snapped = snapPosition(rawPos);
      const laneIndex = Math.min(
        Math.max(Math.round(snapped.y / LANE_HEIGHT), 0),
        Math.max(wires.length - 1, 0)
      );

      let targetX = Math.max(snapped.x, GRID_SIZE);

      // Avoid exact overlapping position if a gate already exists at this spot
      const existingAtSpot = currentNodes.some(
        (n) => n.type === "gate" && n.position.x === targetX && n.position.y === laneIndex * LANE_HEIGHT
      );
      if (existingAtSpot) {
        const laneGates = gateNodes(currentNodes).filter(
          (node) => Math.round(node.position.y / LANE_HEIGHT) === laneIndex
        );
        const maxX = laneGates.reduce((max, n) => Math.max(max, n.position.x), 0);
        targetX = Math.max(targetX, maxX + GRID_SIZE);
      }

      const position = {
        x: targetX,
        y: laneIndex * LANE_HEIGHT,
      };

      const rawGateName = gate.data?.gate || gate.data?.label || gate.type || "H";
      const normalized = normalizeGateName(rawGateName);
      const label = (gate.data?.label || normalized).toUpperCase();

      const updatedNodes = [
        ...currentNodes,
        {
          id: `gate-${Date.now()}-${currentNodes.length}`,
          type: "gate",
          position,
          data: {
            label,
            gate: normalized,
            targets: gate.data?.targets,
            controlQubit: gate.data?.controlQubit,
            params: gate.data?.params,
            classical_reg: gate.data?.classical_reg,
          },
        },
      ];

      const numQubits = Math.max(wires.length, 1);
      const gateList = gateNodes(updatedNodes).sort((a, b) =>
        a.position.x !== b.position.x ? a.position.x - b.position.x : a.position.y - b.position.y
      );

      const circuit_ast = gateList.map((node) => {
        const rawGate = node.data?.gate || node.data?.label || "h";
        const gname = normalizeGateName(rawGate);
        const lIndex = Math.max(0, Math.round(node.position.y / LANE_HEIGHT));
        const targetQubit = Math.min(lIndex, numQubits - 1);
        let targets;
        if (Array.isArray(node.data?.targets)) {
          targets = node.data.targets;
        } else if (["cx", "cz", "swap"].includes(gname)) {
          targets = typeof node.data?.controlQubit === "number" ? [node.data.controlQubit, targetQubit] : (targetQubit === 0 ? [0, 1] : [targetQubit - 1, targetQubit]);
        } else if (gname === "ccx") {
          targets = targetQubit >= 2 ? [targetQubit - 2, targetQubit - 1, targetQubit] : (numQubits >= 3 ? [0, 1, 2] : [targetQubit, targetQubit, targetQubit]);
        } else {
          targets = [targetQubit];
        }
        return { gate: gname, targets };
      });

      const newCode = generateQiskitCode({ qubit_count: numQubits, circuit_ast });

      return {
        nodes: updatedNodes,
        codeText: newCode,
      };
    }),

  getCircuitAST: () => {
    const state = get();
    const wires = wireNodes(state.nodes);
    const numQubits = Math.max(wires.length, 1);

    const gateList = gateNodes(state.nodes).sort((a, b) => {
      if (a.position.x !== b.position.x) {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    const circuit_ast = gateList.map((node) => {
      const rawGate = node.data?.gate || node.data?.label || "h";
      const gname = normalizeGateName(rawGate);
      const laneIndex = Math.max(0, Math.round(node.position.y / LANE_HEIGHT));
      const targetQubit = Math.min(laneIndex, numQubits - 1);

      let targets;
      if (Array.isArray(node.data?.targets)) {
        targets = node.data.targets;
      } else if (["cx", "cz", "swap"].includes(gname)) {
        if (typeof node.data?.controlQubit === "number") {
          targets = [node.data.controlQubit, targetQubit];
        } else if (targetQubit === 0 && numQubits > 1) {
          targets = [0, 1];
        } else if (targetQubit > 0) {
          targets = [targetQubit - 1, targetQubit];
        } else {
          targets = [0, 0];
        }
      } else if (gname === "ccx") {
        if (targetQubit >= 2) {
          targets = [targetQubit - 2, targetQubit - 1, targetQubit];
        } else if (numQubits >= 3) {
          targets = [0, 1, 2];
        } else {
          targets = [targetQubit, targetQubit, targetQubit];
        }
      } else {
        targets = [targetQubit];
      }

      const instruction = {
        gate: gname,
        targets,
      };

      if (gname === "measure") {
        instruction.classical_reg =
          typeof node.data?.classical_reg === "number"
            ? node.data.classical_reg
            : targetQubit;
      }

      if (Array.isArray(node.data?.params)) {
        instruction.params = node.data.params;
      }

      return instruction;
    });

    return {
      backend: state.selectedFramework || "qiskit",
      qubit_count: numQubits,
      circuit_ast,
      shots: state.shots || 1024,
    };
  },
}));
