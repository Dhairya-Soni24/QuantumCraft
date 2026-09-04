import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, AsyncGenerator
from backend.config import settings

logger = logging.getLogger("ai_services")

# List of supported models in priority order for automatic fallback
CANDIDATE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash"
]

# Initialize modern Google GenAI Client
genai_client = None
if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your-"):
    try:
        from google import genai
        genai_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        logger.info("Google GenAI Client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Google GenAI Client: {e}")
        genai_client = None


class AIService:
    @staticmethod
    async def chat_tutor(
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        circuit_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Interactive Quantum AI Tutor answering user questions with live circuit awareness.
        """
        history = history or []
        circuit_context = circuit_context or {}

        # 1. Try Gemini LLMs across candidate models
        if genai_client:
            from google.genai import types
            prompt = (
                "You are the QuantumCraft AI Tutor, an expert quantum computing assistant.\n"
                f"Active Workspace Circuit Context: {json.dumps(circuit_context)}\n"
                f"Conversation History: {json.dumps(history[-6:] if history else [])}\n"
                f"Student Question: {message}\n\n"
                "Provide a thorough, intuitive, and accurate quantum explanation with Markdown formatting.\n"
                "If the student asks to explain their circuit, look closely at 'Active Workspace Circuit Context'.\n"
                "- If gates are present, provide a step-by-step gate breakdown and final state.\n"
                "- If no gates are placed, explain that all qubits are in the ground state |0...0> and suggest next steps.\n\n"
                "Respond with a JSON object containing exactly these keys:\n"
                "- 'reply': Detailed educational response with clear explanations, Dirac notation, and bullet points.\n"
                "- 'suggested_actions': A list of 2-3 short follow-up question strings.\n"
                "- 'concept_tags': A list of 2-4 relevant quantum concept tags.\n"
                "Do not output markdown code blocks around the JSON."
            )
            for model_name in CANDIDATE_MODELS:
                try:
                    response = await genai_client.aio.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    )
                    raw_text = response.text.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(raw_text)
                    if "reply" in parsed:
                        return {
                            "reply": parsed.get("reply", ""),
                            "suggested_actions": parsed.get("suggested_actions", []),
                            "concept_tags": parsed.get("concept_tags", [])
                        }
                except Exception as e:
                    logger.warning(f"Model {model_name} failed: {e}")
                    continue

        # 2. Comprehensive Rule-Based Fallback Engine (Works offline / when quota is exceeded)
        return AIService._fallback_chat(message, circuit_context)

    @staticmethod
    async def explain_circuit(
        qubit_count: int,
        circuit_ast: List[Dict[str, Any]],
        state_vector: Optional[List[Any]] = None,
        counts: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Provides step-by-step mathematical and intuitive explanation of a quantum circuit.
        """
        circuit_context = {
            "qubit_count": qubit_count,
            "circuit_ast": circuit_ast,
            "state_vector": state_vector,
            "counts": counts
        }

        if genai_client:
            from google.genai import types
            prompt = (
                "You are the QuantumCraft Circuit Explainer. Analyze the following quantum circuit:\n"
                f"{json.dumps(circuit_context)}\n\n"
                "Return a JSON object with keys:\n"
                "- 'summary': High-level intuitive summary of what this circuit does.\n"
                "- 'step_by_step': An array of strings describing each gate execution in order.\n"
                "- 'mathematical_state': Latex/Dirac representation of the final quantum state.\n"
                "- 'key_takeaways': An array of key quantum concepts demonstrated by this circuit."
            )
            for model_name in CANDIDATE_MODELS:
                try:
                    response = await genai_client.aio.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    )
                    raw_text = response.text.replace("```json", "").replace("```", "").strip()
                    return json.loads(raw_text)
                except Exception as e:
                    logger.warning(f"Explain with {model_name} failed: {e}")
                    continue

        return AIService._fallback_explain(qubit_count, circuit_ast, counts)

    @staticmethod
    async def get_challenge_hint(
        challenge_id: str,
        current_ast: List[Dict[str, Any]],
        attempt_count: int = 1
    ) -> Dict[str, Any]:
        hints_map = {
            "chal-001": [
                {
                    "hint_level": 1,
                    "hint": "To create entanglement (|Φ⁺⟩), you first need to place the control qubit (Qubit 0) into an equal superposition.",
                    "suggested_gate": "H",
                    "concept": "Superposition via Hadamard"
                },
                {
                    "hint_level": 2,
                    "hint": "After applying H to Qubit 0, you need a two-qubit gate to entangle Qubit 0 and Qubit 1.",
                    "suggested_gate": "CX",
                    "concept": "Controlled-NOT (CNOT) Entanglement"
                },
                {
                    "hint_level": 3,
                    "hint": "Place an H gate on Qubit 0, followed by a CX (CNOT) gate with control on Qubit 0 and target on Qubit 1.",
                    "suggested_gate": "CX(0, 1)",
                    "concept": "Bell State Synthesis"
                }
            ],
            "chal-002": [
                {
                    "hint_level": 1,
                    "hint": "The ground state |0⟩ needs to be flipped to |1⟩. Think about the quantum equivalent of a classical NOT gate.",
                    "suggested_gate": "X",
                    "concept": "Pauli-X Bit Flip"
                },
                {
                    "hint_level": 2,
                    "hint": "Apply a Pauli-X gate directly to Qubit 0 to transform |0⟩ into |1⟩.",
                    "suggested_gate": "X",
                    "concept": "Single Qubit Gate"
                }
            ]
        }

        challenge_hints = hints_map.get(challenge_id, [
            {
                "hint_level": 1,
                "hint": "Review the required target state and consider which single-qubit or two-qubit gates manipulate the amplitudes accordingly.",
                "suggested_gate": None,
                "concept": "Quantum Circuit Synthesis"
            }
        ])

        idx = min(attempt_count - 1, len(challenge_hints) - 1)
        if idx < 0:
            idx = 0
        return challenge_hints[idx]

    @staticmethod
    async def recommend_learning_path(
        user_id: Optional[str] = None,
        completed_lessons: Optional[List[str]] = None,
        solved_challenges: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        completed = completed_lessons or []
        solved = solved_challenges or []

        if not completed and not solved:
            return {
                "recommended_course_id": "c-001",
                "recommended_lesson_id": "l-001",
                "next_challenge_id": "chal-001",
                "reason": "Start your quantum journey with Qubit Fundamentals & Superposition!",
                "focus_areas": ["Qubit basics", "Superposition", "Hadamard gate"]
            }
        elif len(solved) < 2:
            return {
                "recommended_course_id": "c-001",
                "recommended_lesson_id": "l-002",
                "next_challenge_id": "chal-002",
                "reason": "You're progressing well with basic gates! Try bit flips and phase manipulation next.",
                "focus_areas": ["Pauli gates", "Bit flip", "Phase flips"]
            }
        else:
            return {
                "recommended_course_id": "c-002",
                "recommended_lesson_id": "l-003",
                "next_challenge_id": "chal-003",
                "reason": "Ready for multi-qubit algorithms! Explore Deutsch-Jozsa and Grover's search algorithm.",
                "focus_areas": ["Quantum Oracles", "Amplitude Amplification", "Grover Search"]
            }

    @staticmethod
    def _fallback_chat(message: str, circuit_context: Dict[str, Any]) -> Dict[str, Any]:
        msg = message.lower()
        ast = circuit_context.get("circuit_ast", [])
        qubits = circuit_context.get("qubit_count", 2)
        has_h = any(g.get("gate", "").lower() == "h" for g in ast)
        has_cx = any(g.get("gate", "").lower() in ["cx", "cnot"] for g in ast)

        if "circuit" in msg and ("explain" in msg or "what" in msg or "how" in msg or "describe" in msg or "analyze" in msg):
            if not ast or len(ast) == 0:
                reply = (
                    f"Your workspace currently has **{qubits} quantum wires** in the default ground state (**|{'0'*qubits}⟩**), with **no gates placed yet**.\n\n"
                    "👉 **How to build your circuit:**\n"
                    "1. Drag a **Hadamard (H)** gate from the Gate Library onto Qubit 0 to create a 50/50 superposition.\n"
                    "2. Drag a **CNOT (CX)** gate from Qubit 0 to Qubit 1 to create an entangled **Bell State**.\n"
                    "3. Click **Run Simulation** to measure the quantum probabilities!"
                )
                actions = ["How do I create a Bell state?", "What is a Hadamard gate?", "Explain Superposition"]
                tags = ["ground-state", "empty-circuit", "getting-started"]
            else:
                explain_res = AIService._fallback_explain(qubits, ast)
                gate_summary = ", ".join([f"{g.get('gate', '').upper()} on q{g.get('targets', [0])[0]}" for g in ast])
                reply = (
                    f"### 🔬 Circuit Analysis ({qubits} Qubits, {len(ast)} Gates)\n\n"
                    f"**Summary:** {explain_res['summary']}\n\n"
                    f"**Placed Operations:** {gate_summary}\n\n"
                    f"**Step-by-Step Execution:**\n" +
                    "\n".join([f"• {step}" for step in explain_res['step_by_step']]) +
                    f"\n\n**Theoretical Final State:** $${explain_res['mathematical_state']}$$\n\n"
                    f"**Key Concepts:** {', '.join(explain_res['key_takeaways'])}"
                )
                actions = ["Run Simulation", "What is the Bloch vector for this?", "How to add measurement?"]
                tags = ["circuit-explanation", "step-by-step", "analysis"]
            return {
                "reply": reply,
                "suggested_actions": actions,
                "concept_tags": tags
            }

        elif "qubit" in msg or "cubit" in msg or "quantum bit" in msg:
            reply = (
                "A **Qubit (Quantum Bit)** is the fundamental unit of quantum information:\n\n"
                "• **Classical Bit vs Qubit:** A classical bit can only be in one state at a time (`0` or `1`). A qubit can exist in a linear combination of both states simultaneously: **|ψ⟩ = α|0⟩ + β|1⟩** (where |α|² + |β|² = 1).\n"
                "• **Superposition:** Allows $N$ qubits to represent $2^N$ states simultaneously.\n"
                "• **Entanglement:** Two or more qubits can be strongly correlated such that measuring one instantly dictates the other.\n"
                "• **Bloch Sphere:** Single qubits are geometrically visualized on the 3D unit Bloch sphere."
            )
            actions = ["Explain Superposition", "What is the Bloch Sphere?", "How does a Hadamard gate create a qubit state?"]
            tags = ["qubit", "quantum-basics", "superposition"]
        elif "bell state" in msg or (has_h and has_cx and "explain" in msg):
            reply = (
                "You are working with a **Bell State** (|Φ⁺⟩ = (|00⟩ + |11⟩)/√2)!\n\n"
                "By applying a **Hadamard (H)** gate to qubit 0 followed by a **CNOT (CX)** gate from qubit 0 to qubit 1, "
                "you create maximum quantum entanglement. Measuring qubit 0 immediately determines the state of qubit 1 with 100% correlation."
            )
            actions = ["Explain Quantum Teleportation", "How to create |Ψ⁺⟩ Bell state?", "Run Simulation"]
            tags = ["entanglement", "bell-state", "superposition"]
        elif "hadamard" in msg or "superposition" in msg or " h " in f" {msg} ":
            reply = (
                "The **Hadamard gate (H)** transforms computational basis states into equal superpositions:\n\n"
                "• H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2\n"
                "• H|1⟩ = |−⟩ = (|0⟩ − |1⟩)/√2\n\n"
                "When measured, a qubit in state |+⟩ yields a 50% chance of 0 and a 50% chance of 1."
            )
            actions = ["Add CNOT to create Entanglement", "What is Phase Kickback?", "Simulate Hadamard"]
            tags = ["hadamard", "superposition", "probability"]
        elif "pauli" in msg or "bit flip" in msg or "not gate" in msg or " x gate" in msg:
            reply = (
                "The **Pauli-X gate** acts as the quantum NOT gate (Bit Flip):\n\n"
                "• X|0⟩ = |1⟩\n"
                "• X|1⟩ = |0⟩\n\n"
                "On the Bloch Sphere, it represents a 180° (π radians) rotation around the X-axis."
            )
            actions = ["What is Pauli-Y and Pauli-Z?", "How does X affect superposition?", "Explain Phase Flip"]
            tags = ["pauli-x", "bit-flip", "single-qubit-gates"]
        elif "pauli-z" in msg or "phase flip" in msg or " z gate" in msg:
            reply = (
                "The **Pauli-Z gate** performs a Phase Flip:\n\n"
                "• Z|0⟩ = |0⟩\n"
                "• Z|1⟩ = −|1⟩\n\n"
                "It leaves |0⟩ unchanged while inverting the relative phase of |1⟩. On |+⟩, Z|+⟩ = |−⟩."
            )
            actions = ["What is Phase Kickback?", "Explain S and T gates", "Difference between X and Z"]
            tags = ["pauli-z", "phase-flip", "relative-phase"]
        elif "cnot" in msg or "cx" in msg or "entanglement" in msg:
            reply = (
                "The **Controlled-NOT (CX)** gate flips the target qubit if and only if the control qubit is in state |1⟩:\n\n"
                "• CX|00⟩ = |00⟩\n"
                "• CX|10⟩ = |11⟩\n\n"
                "When the control qubit is in superposition, CX creates quantum entanglement between the qubits."
            )
            actions = ["How does measurement affect entanglement?", "Explain CZ and SWAP gates", "What is Toffoli gate?"]
            tags = ["cnot", "entanglement", "two-qubit-gates"]
        elif "teleportation" in msg or "teleport" in msg:
            reply = (
                "**Quantum Teleportation** transmits an unknown quantum state |ψ⟩ from Alice to Bob using an entangled Bell pair and 2 classical bits:\n\n"
                "1. Alice and Bob share an entangled pair (|Φ⁺⟩).\n"
                "2. Alice performs a Bell measurement on |ψ⟩ and her half of the pair.\n"
                "3. Alice transmits 2 classical bits to Bob.\n"
                "4. Bob applies correction gates (X, Z) to recover the exact state |ψ⟩."
            )
            actions = ["Load Teleportation Template", "Why can't we clone quantum states?", "Explain No-Cloning Theorem"]
            tags = ["teleportation", "bell-measurement", "quantum-protocols"]
        elif "grover" in msg or "search" in msg:
            reply = (
                "**Grover's Algorithm** provides a quadratic speedup for searching an unsorted database of N items in O(√N) evaluations.\n\n"
                "It works in two repeated phases:\n"
                "1. **Oracle (O_f)**: Flips the phase of the target state (marks the solution).\n"
                "2. **Diffusion Operator (D)**: Inverts all amplitudes about the average, amplifying the marked state's probability."
            )
            actions = ["Load Grover 2-Qubit Template", "What is an Oracle?", "Explain Amplitude Amplification"]
            tags = ["grover", "amplitude-amplification", "quantum-search"]
        elif "deutsch" in msg or "jozsa" in msg:
            reply = (
                "The **Deutsch-Jozsa Algorithm** determines whether a function f(x) is constant (same output for all inputs) "
                "or balanced (0 for half, 1 for half) with just **a single quantum query**, compared to 2^(n-1)+1 classical queries!"
            )
            actions = ["Load Deutsch-Jozsa Template", "What is Phase Kickback?", "How does Interference work?"]
            tags = ["deutsch-jozsa", "quantum-advantage", "oracles"]
        elif "bloch" in msg or "sphere" in msg:
            reply = (
                "The **Bloch Sphere** is a geometric representation of a single qubit state |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ on a unit 3D sphere:\n\n"
                "• North Pole (z=+1): |0⟩\n"
                "• South Pole (z=-1): |1⟩\n"
                "• Equator: Superposition states (|+⟩ at +x, |−⟩ at -x, |+i⟩ at +y, |−i⟩ at -y)."
            )
            actions = ["View Bloch Sphere Visualizer", "Explain Rotation Gates (Rx, Ry, Rz)", "What is Density Matrix?"]
            tags = ["bloch-sphere", "geometry", "qubit-visualization"]
        elif "measure" in msg or "collapse" in msg or "born rule" in msg:
            reply = (
                "**Measurement** forces a quantum superposition to instantaneously collapse into a definite basis state (|0⟩ or |1⟩).\n\n"
                "According to the **Born Rule**, the probability of measuring state |i⟩ is P(i) = |⟨i|ψ⟩|² (the squared magnitude of its amplitude)."
            )
            actions = ["Why are multiple simulation shots needed?", "What is a Statevector?", "Explain Decoherence"]
            tags = ["measurement", "born-rule", "wavefunction-collapse"]
        else:
            reply = (
                f"Hello! I am your **QuantumCraft AI Tutor**. I see your workspace currently has {qubits} qubits.\n\n"
                "Feel free to ask me about quantum gates (H, X, Y, Z, CNOT, CZ), superposition, entanglement, "
                "Dirac bra-ket notation, or quantum algorithms like Grover's and Deutsch-Jozsa!"
            )
            actions = ["What is a qubit?", "How do I create a Bell state?", "Explain Superposition"]
            tags = ["quantum-basics", "tutor", "getting-started"]

        return {
            "reply": reply,
            "suggested_actions": actions,
            "concept_tags": tags
        }

    @staticmethod
    def _fallback_explain(qubit_count: int, circuit_ast: List[Dict[str, Any]], counts: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not circuit_ast:
            return {
                "summary": f"An empty {qubit_count}-qubit circuit in the ground state |{'0'*qubit_count}⟩.",
                "step_by_step": ["Circuit initialized in ground state |0...0⟩."],
                "mathematical_state": f"|{'0'*qubit_count}\\rangle",
                "key_takeaways": ["Qubits default to the |0⟩ basis state."]
            }

        steps = []
        for i, g in enumerate(circuit_ast):
            gate = g.get("gate", "").upper()
            targets = g.get("targets", [])
            t_str = ", ".join(f"q{t}" for t in targets)
            steps.append(f"Step {i+1}: Apply {gate} gate to {t_str}")

        has_h = any(g.get("gate", "").lower() == "h" for g in circuit_ast)
        has_cx = any(g.get("gate", "").lower() in ["cx", "cnot"] for g in circuit_ast)

        if has_h and has_cx:
            summary = "This circuit creates an entangled Bell State (|Φ⁺⟩) between qubits using a Hadamard and CNOT gate."
            math_state = r"\frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)"
            takeaways = ["Quantum Superposition", "Quantum Entanglement", "Maximally Entangled Basis"]
        elif has_h:
            summary = "This circuit creates a superposition state across the computational basis."
            math_state = r"\frac{1}{\sqrt{2}}(|0\rangle + |1\rangle)"
            takeaways = ["Superposition", "Hadamard Transformation", "Equal Probability Amplitudes"]
        else:
            summary = f"This circuit applies {len(circuit_ast)} quantum operations to {qubit_count} qubits."
            math_state = r"|\psi\rangle"
            takeaways = ["Unitary Transformation", "Basis State Manipulation"]

        return {
            "summary": summary,
            "step_by_step": steps,
            "mathematical_state": math_state,
            "key_takeaways": takeaways
        }


async def chat_tutor_stream(
    message: str,
    history: Optional[List[Dict[str, Any]]] = None,
    circuit_context: Optional[Dict[str, Any]] = None
) -> AsyncGenerator[str, None]:
    """
    Asynchronous token-by-token streaming generator for SSE events.
    Yields data: {"token": "..."}\n\n and ends with data: [DONE]\n\n
    """
    history = history or []
    circuit_context = circuit_context or {}

    # 1. Try Gemini streaming across candidate models
    stream_successful = False
    if genai_client:
        prompt = (
            "You are the QuantumCraft AI Tutor, an expert quantum computing assistant.\n"
            f"Active Workspace Circuit Context: {json.dumps(circuit_context)}\n"
            f"Conversation History: {json.dumps(history[-6:] if history else [])}\n"
            f"Student Question: {message}\n\n"
            "Provide a direct, thorough, and clear explanation in markdown with clear steps and formulas."
        )
        for model_name in CANDIDATE_MODELS:
            try:
                response_stream = await genai_client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=prompt
                )
                async for chunk in response_stream:
                    if chunk.text:
                        token_data = json.dumps({"token": chunk.text})
                        yield f"data: {token_data}\n\n"
                        await asyncio.sleep(0.005)
                stream_successful = True
                break
            except Exception as e:
                logger.warning(f"Streaming with {model_name} failed: {e}")
                continue

    # 2. Fallback streaming if offline / quota exceeded
    if not stream_successful:
        fallback_res = AIService._fallback_chat(message, circuit_context)
        reply_text = fallback_res["reply"]
        words = reply_text.split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            token_data = json.dumps({"token": token})
            yield f"data: {token_data}\n\n"
            await asyncio.sleep(0.015)

    # Final event marking completion
    yield "data: [DONE]\n\n"
