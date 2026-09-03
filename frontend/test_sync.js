import assert from "node:assert";
import { generateQiskitCode } from "./lib/codeGenerators.js";
import { parseQiskitCodeToAST, astToReactFlowNodes } from "./lib/codeParser.js";

console.log("==========================================");
console.log("🧪 RUNNING AUTOMATED QISKIT SYNC UNIT TESTS");
console.log("==========================================");

// Test 1: Code Parser - Parse sample Qiskit commands
const sampleCode = `
from qiskit import QuantumCircuit
qc = QuantumCircuit(2, 2)
qc.z(0)
qc.h(1)
qc.cx(0, 1)
qc.t(1)
`;

console.log("Test 1: Parsing Qiskit Code to AST...");
const ast = parseQiskitCodeToAST(sampleCode);
assert.strictEqual(ast.qubit_count, 2, "Qubit count should be 2");
assert.strictEqual(ast.circuit_ast.length, 4, "Should parse 4 gate operations");
assert.strictEqual(ast.circuit_ast[0].gate, "z");
assert.strictEqual(ast.circuit_ast[0].targets[0], 0);
assert.strictEqual(ast.circuit_ast[1].gate, "h");
assert.strictEqual(ast.circuit_ast[1].targets[0], 1);
assert.strictEqual(ast.circuit_ast[2].gate, "cx");
assert.deepStrictEqual(ast.circuit_ast[2].targets, [0, 1]);
assert.strictEqual(ast.circuit_ast[3].gate, "t");
assert.strictEqual(ast.circuit_ast[3].targets[0], 1);
console.log("✅ Test 1 Passed!");

// Test 2: AST to React Flow Nodes - Verify Stable Node IDs
console.log("Test 2: Converting AST to React Flow Nodes with Stable IDs...");
const nodes = astToReactFlowNodes(ast, 100, 80);
const wireNodes = nodes.filter((n) => n.type === "wire");
const gateNodes = nodes.filter((n) => n.type === "gate");

assert.strictEqual(wireNodes.length, 2, "Should create 2 wire nodes");
assert.strictEqual(gateNodes.length, 4, "Should create 4 gate nodes");
assert.strictEqual(gateNodes[0].id, "gate-ast-0-z-0", "Gate 0 ID should be stable");
assert.strictEqual(gateNodes[1].id, "gate-ast-1-h-1", "Gate 1 ID should be stable");
assert.strictEqual(gateNodes[2].id, "gate-ast-2-cx-0_1", "Gate 2 ID should be stable");
assert.strictEqual(gateNodes[3].id, "gate-ast-3-t-1", "Gate 3 ID should be stable");
console.log("✅ Test 2 Passed!");

// Test 3: Code Generator - Generate Qiskit code from AST
console.log("Test 3: Generating Qiskit Code from AST...");
const generatedCode = generateQiskitCode(ast);
assert.ok(generatedCode.includes("qc.z(0)"), "Should contain qc.z(0)");
assert.ok(generatedCode.includes("qc.h(1)"), "Should contain qc.h(1)");
assert.ok(generatedCode.includes("qc.cx(0, 1)"), "Should contain qc.cx(0, 1)");
assert.ok(generatedCode.includes("qc.t(1)"), "Should contain qc.t(1)");
console.log("✅ Test 3 Passed!");

console.log("==========================================");
console.log("🎉 ALL AUTOMATED SYNC UNIT TESTS PASSED CLEANLY!");
console.log("==========================================");
