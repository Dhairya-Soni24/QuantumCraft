import { addEdge, applyEdgeChanges, applyNodeChanges } from "reactflow";
import { create } from "zustand";
import { runSimulation } from "@/lib/api";

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

export const useQuantumStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedFramework: "qiskit",
  shots: 1024,
  simulationResults: null,
  isSimulating: false,
  simulationError: null,

  setFramework: (framework) => set({ selectedFramework: framework }),
  setShots: (shots) => set({ shots }),
  setSimulationResults: (results) =>
    set({ simulationResults: results, isSimulating: false, simulationError: null }),

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
    set((state) => ({
      nodes: applyNodeChanges(
        changes.map((change) =>
          change.type === "position" && change.position
            ? { ...change, position: snapPosition(change.position) }
            : change
        ),
        state.nodes
      ),
    })),

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
      return {
        nodes: [
          ...state.nodes,
          {
            id: `wire-q${count}`,
            type: "wire",
            position: { x: 16, y: count * LANE_HEIGHT },
            draggable: false,
            selectable: false,
            data: { label: `q${count}` },
          },
        ],
      };
    }),

  removeWire: () =>
    set((state) => {
      const wires = wireNodes(state.nodes);
      if (!wires.length) return state;

      const lastWire = wires[wires.length - 1];
      const remainingNodes = state.nodes.filter(
        (node) =>
          node.id !== lastWire.id &&
          !(
            node.type === "gate" &&
            Math.round(node.position.y / LANE_HEIGHT) === wires.length - 1
          )
      );

      return { nodes: remainingNodes };
    }),

  snapNodeToLane: (nodeId, position) =>
    set((state) => {
      const wires = wireNodes(state.nodes);
      const snapped = snapPosition(position);
      const laneIndex = Math.min(
        Math.max(Math.round(snapped.y / LANE_HEIGHT), 0),
        Math.max(wires.length - 1, 0)
      );

      return {
        nodes: state.nodes.map((node) =>
          node.id === nodeId && node.type === "gate"
            ? {
                ...node,
                position: { ...snapped, y: laneIndex * LANE_HEIGHT },
              }
            : node
        ),
      };
    }),

  addGate: (gate) =>
    set((state) => {
      const wires = wireNodes(state.nodes);
      const snapped = snapPosition(gate.position);
      const laneIndex = Math.round(snapped.y / LANE_HEIGHT);

      if (laneIndex < 0 || laneIndex >= wires.length) return state;

      const laneGates = gateNodes(state.nodes).filter(
        (node) =>
          Math.round(node.position.y / LANE_HEIGHT) === laneIndex
      );
      const lastX = laneGates.reduce(
        (maximum, node) => Math.max(maximum, node.position.x),
        -GRID_SIZE
      );
      const position = {
        x: Math.max(snapped.x, lastX + GRID_SIZE),
        y: laneIndex * LANE_HEIGHT,
      };

      return {
        nodes: [
          ...state.nodes,
          {
            id: `gate-${Date.now()}-${state.nodes.length}`,
            type: "gate",
            position,
            data: gate.data || { label: gate.type || "Gate" },
          },
        ],
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

