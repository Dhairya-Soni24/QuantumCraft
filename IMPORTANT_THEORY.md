# 🌌 QuantumCraft (IQ-ALP) - Important Quantum Theory & Mathematical Foundations

This document serves as the master theoretical reference for the **QuantumCraft** platform, covering foundational principles, mathematical formalisms, quantum gates, canonical algorithms, and the quantum software ecosystem.

---

## 📑 Table of Contents
1. [Fundamental Quantum Principles](#1-fundamental-quantum-principles)
2. [Mathematical Formulations](#2-mathematical-formulations)
3. [Quantum Gate Mechanics & Matrix Library](#3-quantum-gate-mechanics--matrix-library)
4. [Canonical Quantum Circuits & Algorithms](#4-canonical-quantum-circuits--algorithms)
5. [Quantum Software & Simulation Architecture](#5-quantum-software--simulation-architecture)
6. [Comprehensive Quantum Terminology Glossary](#6-comprehensive-quantum-terminology-glossary)

---

## 1. Fundamental Quantum Principles

### 1.1 The Qubit
Unlike a classical bit that exists deterministically as either `0` or `1`, a **qubit** (quantum bit) is a two-level quantum mechanical system represented as a unit vector in a 2-dimensional complex Hilbert space $\mathcal{H}_2$.

### 1.2 Quantum Superposition
A pure qubit state $|\psi\rangle$ is expressed as a linear combination of orthonormal computational basis states $|0\rangle$ and $|1\rangle$:

$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle = \begin{pmatrix} \alpha \\ \beta \end{pmatrix}$$

where $\alpha, \beta \in \mathbb{C}$ are complex probability amplitudes satisfying the normalization condition:

$$\|\alpha\|^2 + \|\beta\|^2 = 1$$

### 1.3 The Born Rule & Wavefunction Collapse
Upon measurement in the computational basis $\{|0\rangle, |1\rangle\}$, the continuous superposition collapses instantaneously into a definite state:
* Probability of measuring outcome $0$: $P(0) = \|\alpha\|^2 = |\langle 0|\psi\rangle|^2$
* Probability of measuring outcome $1$: $P(1) = \|\beta\|^2 = |\langle 1|\psi\rangle|^2$

### 1.4 Quantum Entanglement
When two or more qubits interact, they can enter an **entangled state** where the composite quantum state $|\psi_{AB}\rangle$ cannot be factored into product states of individual qubits ($|\psi_{AB}\rangle \neq |\psi_A\rangle \otimes |\psi_B\rangle$).
* Measuring one qubit instantly determines the outcome of the other, regardless of spatial separation (Einstein-Podolsky-Rosen paradox).

### 1.5 Phase Kickback
A core quantum algorithmic primitive where applying a controlled gate to a target qubit in an eigenstate causes the eigenvalue phase factor $e^{i\theta}$ to be transferred ("kicked back") into the phase of the control qubit.

---

## 2. Mathematical Formulations

### 2.1 Dirac Bra-Ket Notation
* **Ket** $|\psi\rangle$: Column vector representing a quantum state.
* **Bra** $\langle\psi| = (|\psi\rangle)^\dagger$: Conjugate transpose (row vector) of $|\psi\rangle$.
* **Inner Product** $\langle\phi|\psi\rangle$: Scalar product representing state overlap / probability amplitude.
* **Outer Product** $|\psi\rangle\langle\phi|$: Linear operator (projection matrix).

### 2.2 Tensor Product for Multi-Qubit Systems
The state space of an $n$-qubit composite system is the tensor product of single-qubit spaces $\mathcal{H}_{2^n} = \mathcal{H}_2^{\otimes n}$:

$$|q_0\rangle \otimes |q_1\rangle = |q_0 q_1\rangle = \begin{pmatrix} \alpha_0 \begin{pmatrix} \alpha_1 \\ \beta_1 \end{pmatrix} \\ \beta_0 \begin{pmatrix} \alpha_1 \\ \beta_1 \end{pmatrix} \end{pmatrix} = \begin{pmatrix} \alpha_0\alpha_1 \\ \alpha_0\beta_1 \\ \beta_0\alpha_1 \\ \beta_0\beta_1 \end{pmatrix}$$

### 2.3 The Bloch Sphere Representation
Any single-qubit pure state can be geometrically visualized on the surface of a unit 3D sphere parameterized by spherical angles $\theta \in [0, \pi]$ (polar) and $\phi \in [0, 2\pi)$ (azimuthal):

$$|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\phi}\sin\left(\frac{\theta}{2}\right)|1\rangle$$

The Cartesian coordinates $(r_x, r_y, r_z)$ on the Bloch sphere are calculated using Pauli expectation values:
* $r_x = \langle\psi|\sigma_x|\psi\rangle = \sin\theta\cos\phi = 2\text{Re}(\alpha^*\beta)$
* $r_y = \langle\psi|\sigma_y|\psi\rangle = \sin\theta\sin\phi = 2\text{Im}(\alpha^*\beta)$
* $r_z = \langle\psi|\sigma_z|\psi\rangle = \cos\theta = \|\alpha\|^2 - \|\beta\|^2$

### 2.4 Density Matrix & Partial Trace
For mixed states or subsystems of entangled qubits:
* **Density Matrix**: $\rho = \sum_i p_i |\psi_i\rangle\langle\psi_i|$, with $\text{Tr}(\rho) = 1$ and $\rho = \rho^\dagger \ge 0$.
* **Reduced Density Matrix (Partial Trace)**: For a 2-qubit system $\rho_{AB}$, tracing out qubit $B$ yields qubit $A$'s local state:
  $$\rho_A = \text{Tr}_B(\rho_{AB})$$

---

## 3. Quantum Gate Mechanics & Matrix Library

All quantum gates are represented by **Unitary Operators** $U$ where $U^\dagger U = U U^\dagger = I$, ensuring probability conservation.

### 3.1 Single-Qubit Standard Gates

#### 1. Hadamard Gate ($H$)
Transforms computational basis states into balanced superposition states:
$$H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \quad H|0\rangle = |+\rangle = \frac{|0\rangle+|1\rangle}{\sqrt{2}}, \quad H|1\rangle = |-\rangle = \frac{|0\rangle-|1\rangle}{\sqrt{2}}$$

#### 2. Pauli-X Gate ($X$ / Quantum NOT)
Performs a $180^\circ$ rotation about the X-axis (bit flip):
$$X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}, \quad X|0\rangle = |1\rangle, \quad X|1\rangle = |0\rangle$$

#### 3. Pauli-Y Gate ($Y$)
Performs a $180^\circ$ rotation about the Y-axis (bit & phase flip):
$$Y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}, \quad Y|0\rangle = i|1\rangle, \quad Y|1\rangle = -i|0\rangle$$

#### 4. Pauli-Z Gate ($Z$)
Performs a $180^\circ$ rotation about the Z-axis (phase flip):
$$Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}, \quad Z|0\rangle = |0\rangle, \quad Z|1\rangle = -|1\rangle$$

#### 5. Phase Gate ($S$) & S-Dagger ($S^\dagger$)
Applies a $\pi/2$ phase shift ($S^2 = Z$):
$$S = \begin{pmatrix} 1 & 0 \\ 0 & i \end{pmatrix}, \quad S^\dagger = \begin{pmatrix} 1 & 0 \\ 0 & -i \end{pmatrix}$$

#### 6. $\pi/8$ Gate ($T$) & T-Dagger ($T^\dagger$)
Applies a $\pi/4$ phase shift ($T^2 = S$):
$$T = \begin{pmatrix} 1 & 0 \\ 0 & e^{i\pi/4} \end{pmatrix}, \quad T^\dagger = \begin{pmatrix} 1 & 0 \\ 0 & e^{-i\pi/4} \end{pmatrix}$$

---

### 3.2 Single-Qubit Parametric Rotation Gates

* **Rotation-X ($R_x(\theta)$)**:
  $$R_x(\theta) = \exp\left(-i\frac{\theta}{2}X\right) = \begin{pmatrix} \cos\frac{\theta}{2} & -i\sin\frac{\theta}{2} \\ -i\sin\frac{\theta}{2} & \cos\frac{\theta}{2} \end{pmatrix}$$
* **Rotation-Y ($R_y(\theta)$)**:
  $$R_y(\theta) = \exp\left(-i\frac{\theta}{2}Y\right) = \begin{pmatrix} \cos\frac{\theta}{2} & -\sin\frac{\theta}{2} \\ \sin\frac{\theta}{2} & \cos\frac{\theta}{2} \end{pmatrix}$$
* **Rotation-Z ($R_z(\phi)$)**:
  $$R_z(\phi) = \exp\left(-i\frac{\phi}{2}Z\right) = \begin{pmatrix} e^{-i\phi/2} & 0 \\ 0 & e^{i\phi/2} \end{pmatrix}$$
* **Phase-Shift Gate ($P(\lambda)$)**:
  $$P(\lambda) = \begin{pmatrix} 1 & 0 \\ 0 & e^{i\lambda} \end{pmatrix}$$

---

### 3.3 Multi-Qubit & Entangling Gates

#### 1. Controlled-NOT Gate ($CX$ / $CNOT$)
Flips the target qubit $q_1$ if and only if the control qubit $q_0$ is $|1\rangle$:
$$CX = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}, \quad CX|c, t\rangle = |c, c \oplus t\rangle$$

#### 2. Controlled-Z Gate ($CZ$)
Applies a $Z$ phase flip if both qubits are in state $|1\rangle$:
$$CZ = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & -1 \end{pmatrix}$$

#### 3. SWAP Gate
Exchanges the state vectors of two qubits:
$$SWAP = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \end{pmatrix}, \quad SWAP|a, b\rangle = |b, a\rangle$$

#### 4. Toffoli Gate ($CCX$ / Controlled-Controlled-NOT)
A universal 3-qubit reversible logic gate that flips target qubit $q_2$ iff both control qubits $q_0, q_1$ are $|1\rangle$:
$$CCX|c_1, c_2, t\rangle = |c_1, c_2, t \oplus (c_1 \cdot c_2)\rangle$$

---

## 4. Canonical Quantum Circuits & Algorithms

### 4.1 Bell State Generation (EPR Pairs)
The 4 maximally entangled 2-qubit Bell states are generated using a Hadamard followed by a CNOT:

| Bell State | Mathematical Formula | Circuit Generation Sequence |
|:---:|:---:|---|
| $|\Phi^+\rangle$ | $\frac{\|00\rangle + \|11\rangle}{\sqrt{2}}$ | $H(q_0) \rightarrow CX(q_0, q_1)$ |
| $|\Phi^-\rangle$ | $\frac{\|00\rangle - \|11\rangle}{\sqrt{2}}$ | $X(q_0) \rightarrow H(q_0) \rightarrow CX(q_0, q_1)$ |
| $|\Psi^+\rangle$ | $\frac{\|01\rangle + \|10\rangle}{\sqrt{2}}$ | $X(q_1) \rightarrow H(q_0) \rightarrow CX(q_0, q_1)$ |
| $|\Psi^-\rangle$ | $\frac{\|01\rangle - \|10\rangle}{\sqrt{2}}$ | $X(q_0) \rightarrow X(q_1) \rightarrow H(q_0) \rightarrow CX(q_0, q_1)$ |

---

### 4.2 Deutsch-Jozsa Algorithm
* **Problem**: Determine whether an unknown boolean oracle function $f: \{0, 1\}^n \rightarrow \{0, 1\}$ is **constant** (returns all 0s or all 1s) or **balanced** (returns 0 for half of inputs and 1 for the other half).
* **Quantum Speedup**: Solves in **1 single query** ($O(1)$) compared to classical deterministic algorithms requiring $2^{n-1} + 1$ queries ($O(2^n)$).
* **Key Mechanism**: Phase kickback via $|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$ ancilla qubit, followed by destructive interference on balanced functions.

---

### 4.3 Grover's Search Algorithm
* **Problem**: Find a marked item $x^*$ in an unsorted database of $N = 2^n$ elements.
* **Quantum Speedup**: $\mathcal{O}(\sqrt{N})$ quantum queries vs. classical $\mathcal{O}(N)$ brute-force search.
* **Algorithm Steps**:
  1. Initialize uniform superposition: $|\psi_0\rangle = H^{\otimes n}|0\rangle^{\otimes n} = \frac{1}{\sqrt{N}}\sum_{x=0}^{N-1}|x\rangle$.
  2. **Phase Oracle $U_f$**: Inverts the sign of target state: $U_f|x\rangle = (-1)^{f(x)}|x\rangle$.
  3. **Grover Diffusion Operator $D$**: Inversion about the mean:
     $$D = 2|\psi_0\rangle\langle\psi_0| - I = H^{\otimes n}(2|0\rangle\langle 0| - I)H^{\otimes n}$$
  4. Repeat $\approx \frac{\pi}{4}\sqrt{N}$ iterations before measuring.

---

### 4.4 Quantum Teleportation Protocol
* **Purpose**: Teleports an unknown quantum state $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$ from Alice to Bob using an entangled Bell pair and 2 classical bits.
* **Steps**:
  1. Create shared Bell state between Alice ($q_1$) and Bob ($q_2$): $\frac{|00\rangle + |11\rangle}{\sqrt{2}}$.
  2. Alice performs Bell-basis measurement: applies $CX(q_0, q_1)$ and $H(q_0)$ on her message qubit $q_0$ and entangled qubit $q_1$.
  3. Alice measures $q_0, q_1$ and transmits 2 classical bits $(m_0, m_1)$ to Bob.
  4. Bob reconstructs $|\psi\rangle$ on $q_2$ by applying conditional Pauli corrections:
     $$|\psi_{\text{out}}\rangle = Z^{m_0} X^{m_1}|q_2\rangle$$

---

### 4.5 Quantum Fourier Transform (QFT)
* **Definition**: Maps computational basis states into frequency phase basis:
  $$|j\rangle \mapsto \frac{1}{\sqrt{2^n}}\sum_{k=0}^{2^n-1} e^{2\pi i j k / 2^n}|k\rangle$$
* **Significance**: Foundational sub-routine for Shor's Period Finding & Factoring Algorithm, Quantum Phase Estimation (QPE), and HHL algorithm for linear systems.

---

## 5. Quantum Software & Simulation Architecture

### 5.1 Qiskit (IBM Quantum)
* Used as the primary quantum circuit compiler and simulation backend in `backend/simulator.py`.
* Converts AST JSON into `qiskit.QuantumCircuit` objects for exact statevector evolution and shot-based sampling with `qiskit-aer`.

### 5.2 Cirq (Google Quantum AI)
* Supports grid-based quantum devices and hardware compilation with `cirq.Circuit` and `cirq.LineQubit`.

### 5.3 PennyLane (Xanadu)
* Differentiable quantum programming engine for Variational Quantum Algorithms (VQE, QAOA) and Quantum Machine Learning.

### 5.4 AI Quantum Tutor Engine (Gemini `gemini-3.6-flash`)
* Leverages active circuit AST context, gate histories, and measurement outcomes to provide personalized Dirac-notation explanations, step-by-step mathematical derivations, and progressive challenge hints via real-time Server-Sent Events (SSE).

---

## 6. Comprehensive Quantum Terminology Glossary

| Term | Category | Definition |
|---|:---:|---|
| **Qubit** | Core Concept | Quantum bit capable of holding linear combinations of basis states. |
| **Superposition** | Core Concept | The mathematical property allowing states to exist simultaneously in multiple basis states. |
| **Entanglement** | Core Concept | Inseparable quantum correlation between multiple qubits. |
| **Bra-Ket** | Mathematics | Standard Dirac notation for quantum state vectors and operators. |
| **Statevector** | Mathematics | A normalized complex vector containing all $2^n$ quantum amplitudes. |
| **Density Matrix** | Mathematics | Positive semi-definite Hermitian operator representing pure or mixed states. |
| **Partial Trace** | Mathematics | Linear mapping tracing out subsystem degrees of freedom. |
| **Bloch Sphere** | Visualization | Unit sphere representing single-qubit pure state geometry. |
| **Hadamard ($H$)** | Gate | Equal superposition generator creating unbiased basis states. |
| **Pauli-X ($X$)** | Gate | Quantum NOT gate that interchanges $|0\rangle$ and $|1\rangle$. |
| **Pauli-Y ($Y$)** | Gate | Combined bit and phase flip operator. |
| **Pauli-Z ($Z$)** | Gate | Phase flip operator leaving $|0\rangle$ unchanged and negating $|1\rangle$. |
| **CNOT / CX** | Gate | 2-qubit entangling gate controlled by the first qubit. |
| **Toffoli / CCX** | Gate | 3-qubit universal reversible logic gate. |
| **SWAP** | Gate | 2-qubit state exchange operator. |
| **Measurement** | Operation | Projection of quantum wavefunction into classical computational basis. |
| **Shot Sampling** | Simulation | Repeating circuit execution (e.g. 1024 times) to gather probability distributions. |
| **Born Rule** | Principle | States that measurement probability is the squared magnitude of the complex amplitude. |
| **Phase Kickback** | Technique | Shifting phase from target ancilla into control register. |
| **Diffusion Operator** | Algorithm | Inversion-about-the-mean operator in Grover's algorithm. |
| **QFT** | Algorithm | Quantum Fourier Transform for phase estimation and period finding. |
| **NISQ** | Hardware | Noisy Intermediate-Scale Quantum era computing. |
