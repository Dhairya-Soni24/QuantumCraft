import { addEdge, applyEdgeChanges, applyNodeChanges } from "reactflow";
import { create } from "zustand";

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

export const useQuantumStore = create((set) => ({
  nodes: [],
  edges: [],

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
}));
