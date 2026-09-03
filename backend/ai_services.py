import os
import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False

from backend.config import settings

# Configure Gemini Client if API key is present
GEMINI_KEY = getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY", "")
if GEMINI_KEY and GENAI_AVAILABLE:
    try:
        genai.configure(api_key=GEMINI_KEY)
    except Exception as e:
        print(f"[AIService Warning] Failed to configure Gemini: {e}")

MODEL_NAME = "gemini-3.6-flash"

SYSTEM_PROMPT = """You are QuantumCraft's intelligent AI Quantum Tutor. 
Guide students through quantum computing concepts (superposition, entanglement, phase, quantum gates, circuits).
Keep explanations intuitive, concise, mathematically sound, and encouraging.
If circuit context is provided, tailor your response directly to the student's active qubits and gate sequence."""

# -----------------------------------------------------------------------------
# Streaming Utilities
# -----------------------------------------------------------------------------
def _build_prompt_payload(message: str, history: List[Dict[str, str]], circuit_context: Dict[str, Any]) -> str:
    prompt_parts = [f"System: {SYSTEM_PROMPT}\n"]
    if circuit_context:
        prompt_parts.append(f"Active Circuit State: {json.dumps(circuit_context, indent=2)}\n")
    for turn in (history or [])[-6:]:
        role = "Student" if turn.get("role") == "user" else "Tutor"
        prompt_parts.append(f"{role}: {turn.get('content', '')}")
    prompt_parts.append(f"Student: {message}\nTutor:")
    return "\n".join(prompt_parts)

async def _offline_fallback_stream(message: str, circuit_context: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """Provides a natural token-stream fallback if Gemini is offline or rate-limited."""
    qubit_count = circuit_context.get("qubit_count", "N/A") if circuit_context else "N/A"
    sample_text = (
        f"I see you're working on a circuit with {qubit_count} qubits! "
        f"Regarding your question ('{message}'): In quantum computing, gates act as unitary "
        "transformations on complex amplitude vectors. For instance, applying a Hadamard gate creates an "
        "equal superposition (|0⟩ + |1⟩)/√2, allowing quantum parallelism before measurement."
    )
    tokens = sample_text.split(" ")
    for token in tokens:
        yield token + " "
        await asyncio.sleep(0.03)

async def chat_tutor_stream(
    message: str, 
    history: List[Dict[str, str]] = None, 
    circuit_context: Dict[str, Any] = None
) -> AsyncGenerator[str, None]:
    """
    Streams quantum tutor responses token-by-token using gemini-3.6-flash.
    Falls back gracefully to a simulated token stream if offline.
    """
    history = history or []
    circuit_context = circuit_context or {}

    if not GEMINI_KEY or not GENAI_AVAILABLE:
        async for chunk in _offline_fallback_stream(message, circuit_context):
            yield chunk
        return

    try:
        model = genai.GenerativeModel(model_name=MODEL_NAME)
        prompt = _build_prompt_payload(message, history, circuit_context)
        response = model.generate_content(prompt, stream=True)
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.01)
    except Exception as e:
        print(f"[AIService Warning] Streaming Gemini call failed, using fallback stream: {e}")
        async for chunk in _offline_fallback_stream(message, circuit_context):
            yield chunk


# -----------------------------------------------------------------------------
# AIService Class: Full Structured Generation Methods
# -----------------------------------------------------------------------------
class AIService:
    @staticmethod
    def _get_model():
        if not GEMINI_KEY or not GENAI_AVAILABLE:
            return None
        return genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config={"temperature": 0.3}
        )

    # 1. Interactive AI Quantum Tutor Chat (Structured JSON)
    @staticmethod
    async def chat_tutor(
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
        circuit_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        history = history or []
        circuit_context = circuit_context or {}

        context_str = ""
        if circuit_context:
            qubits = circuit_context.get("qubit_count", "unknown")
            ast = circuit_context.get("circuit_ast", [])
            counts = circuit_context.get("counts", {})
            context_str = f"""
Current Quantum Circuit in Student's Workspace:
- Number of Qubits: {qubits}
- Gates Applied (AST): {json.dumps(ast)}
- Simulation Measurement Counts: {json.dumps(counts)}
"""

        system_prompt = f"""
You are "QuantumCraft AI Tutor", an expert, encouraging, and pedagogically sound quantum computing mentor.
You teach students quantum mechanics and quantum computing principles intuitively and mathematically using Dirac notation ($|0\\rangle, |1\\rangle, |+\\rangle$).
{context_str}

Guidelines:
1. Reference the student's active circuit when relevant.
2. Be concise, clear, and engaging.
3. Suggest 1-2 interactive follow-up questions or next steps.

Return ONLY a JSON object with this exact structure:
{{
    "reply": "Your helpful response in Markdown (supports LaTeX math like $|0\\rangle$)",
    "suggested_actions": ["Suggestion 1", "Suggestion 2"],
    "concept_tags": ["superposition", "entanglement"]
}}
"""
        prompt = f"Conversation History:\n{json.dumps(history[-6:] if history else [])}\n\nStudent: {message}"

        try:
            model = AIService._get_model()
            if not model:
                raise ValueError("Gemini API key is not configured.")

            response = await asyncio.to_thread(
                model.generate_content,
                f"{system_prompt}\n\n{prompt}",
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)

        except Exception as e:
            print(f"[AIService Warning] Gemini chat failed, using fallback: {e}")
            return AIService._fallback_chat(message, circuit_context)

    # 2. Step-by-Step Circuit Explainer
    @staticmethod
    async def explain_circuit(
        circuit_ast: List[Dict[str, Any]],
        qubit_count: int,
        state_vector: Optional[List[List[float]]] = None,
        counts: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        prompt = f"""
Analyze this quantum circuit and explain its operation step-by-step:
- Qubits: {qubit_count}
- Circuit Instructions (AST): {json.dumps(circuit_ast)}
- Final State Vector: {json.dumps(state_vector if state_vector else [])}
- Measurement Probabilities/Counts: {json.dumps(counts if counts else {})}

Return ONLY a JSON object with this exact schema:
{{
    "title": "Short descriptive title of what this circuit creates (e.g. Bell State Generator)",
    "summary": "High-level summary of the circuit's purpose and quantum effects",
    "step_by_step": [
        {{
            "step": 1,
            "gate": "H on qubit 0",
            "effect": "Puts qubit 0 into equal superposition (|0> + |1>)/sqrt(2)",
            "state_after": "(|00> + |10>)/sqrt(2)"
        }}
    ],
    "quantum_phenomena": ["superposition", "entanglement", "phase shift"],
    "dirac_notation": "|\\psi\\rangle = \\frac{{|00\\rangle + |11\\rangle}}{{\\sqrt{{2}}}}",
    "key_takeaways": [
        "Key takeaway 1",
        "Key takeaway 2"
    ]
}}
"""

        try:
            model = AIService._get_model()
            if not model:
                raise ValueError("Gemini API key is not configured.")

            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)

        except Exception as e:
            print(f"[AIService Warning] Gemini explain failed, using fallback: {e}")
            return AIService._fallback_explain(circuit_ast, qubit_count, counts)

    # 3. Progressive Challenge Hint Generator
    @staticmethod
    async def generate_hint(
        challenge_title: str,
        challenge_description: str,
        target_state: Optional[str] = None,
        current_circuit: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        current_circuit = current_circuit or {}
        prompt = f"""
You are a Quantum Computing Challenge Tutor. A student is working on a challenge:
- Challenge Title: {challenge_title}
- Description: {challenge_description}
- Target State / Goal: {target_state or "Target quantum state"}
- Student's Current Circuit: {json.dumps(current_circuit)}

Provide a helpful, pedagogical hint that guides their intuition without immediately giving away the entire solution.

Return ONLY a JSON object with this structure:
{{
    "hint": "Clear, encouraging hint guiding the next gate or concept to think about",
    "suggested_gate": "H | X | CX | CZ | None",
    "level": "gentle | moderate | direct",
    "conceptual_question": "A leading question to help the student deduce the answer"
}}
"""

        try:
            model = AIService._get_model()
            if not model:
                raise ValueError("Gemini API key is not configured.")

            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)

        except Exception as e:
            print(f"[AIService Warning] Gemini hint failed, using fallback: {e}")
            return {
                "hint": f"To reach the target state for '{challenge_title}', examine which qubits require superposition (Hadamard) and which require conditional entanglement (CNOT).",
                "suggested_gate": "H",
                "level": "gentle",
                "conceptual_question": "Does your circuit need to create equal probability amplitudes across multiple basis states?"
            }

    # 4. Learning Path Recommendations
    @staticmethod
    async def recommend_next_steps(
        completed_lessons: list,
        recent_quiz_scores: list,
        failed_challenges: list
    ) -> Dict[str, Any]:
        prompt = f"""
You are an AI Quantum Computing Tutor. Analyze the student's learning progress and suggest next steps.

Student Progress Data:
- Completed Lessons: {completed_lessons}
- Recent Quiz Scores: {recent_quiz_scores}
- Failed Challenges: {failed_challenges}

Return ONLY a JSON object with this exact structure:
{{
    "recommendation_reasoning": "Clear brief explanation based on performance",
    "next_steps": [
        {{
            "type": "review_lesson | new_lesson | practice_challenge",
            "lesson_id": "string_or_id",
            "title": "Title of step"
        }}
    ]
}}
"""

        try:
            model = AIService._get_model()
            if not model:
                raise ValueError("Gemini API key is not configured.")

            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)

        except Exception as e:
            print(f"[AIService Warning] Gemini recommendation failed, falling back to rules: {e}")
            fallback_steps = []
            if failed_challenges:
                fallback_steps.append({
                    "type": "practice_challenge",
                    "lesson_id": failed_challenges[0],
                    "title": f"Retry Challenge: {failed_challenges[0]}"
                })
            
            fallback_steps.append({
                "type": "new_lesson",
                "lesson_id": "lesson-next",
                "title": "Continue to Core Quantum Superposition & Entanglement"
            })
            
            return {
                "recommendation_reasoning": "Standard curriculum progression recommendation generated by QuantumCraft Tutor.",
                "next_steps": fallback_steps
            }

    # 5. Offline Fallbacks
    @staticmethod
    def _fallback_chat(message: str, circuit_context: Dict[str, Any]) -> Dict[str, Any]:
        msg = message.lower()
        ast = circuit_context.get("circuit_ast", [])
        has_h = any(g.get("gate", "").lower() == "h" for g in ast)
        has_cx = any(g.get("gate", "").lower() in ["cx", "cnot"] for g in ast)

        if "bell state" in msg or (has_h and has_cx):
            reply = (
                "You are working with a **Bell State** ($|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$)! "
                "By applying a **Hadamard (H)** gate to qubit 0 followed by a **CNOT (CX)** gate from qubit 0 to qubit 1, "
                "you create maximum quantum entanglement. Measuring qubit 0 immediately determines the state of qubit 1."
            )
            actions = ["Explain Quantum Teleportation", "How to create |Ψ⁺⟩ Bell state?"]
            tags = ["entanglement", "bell-state", "superposition"]
        elif "hadamard" in msg or "superposition" in msg:
            reply = (
                "The **Hadamard gate ($H$)** transforms the computational basis states into equal superposition states:\n\n"
                "$$H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$\n\n"
                "When measured, it yields a 50% probability of collapsing into $|0\\rangle$ and 50% into $|1\\rangle$."
            )
            actions = ["Add CNOT to create Entanglement", "What is Phase Kickback?"]
            tags = ["hadamard", "superposition", "probability"]
        elif "cnot" in msg or "cx" in msg or "entanglement" in msg:
            reply = (
                "The **Controlled-NOT ($CX$)** gate flips the target qubit if and only if the control qubit is in state $|1\\rangle$. "
                "When combined with superposition on the control qubit, it produces quantum entanglement!"
            )
            actions = ["Run simulation shots", "How does measurement affect entanglement?"]
            tags = ["cnot", "entanglement", "two-qubit-gates"]
        elif "measure" in msg or "collapse" in msg:
            reply = (
                "**Measurement** forces a delicate quantum superposition to instantaneously collapse into one of the definite "
                "basis eigenstates ($|0\\rangle$ or $|1\\rangle$) governed by the Born Rule ($P(x) = |\\alpha_x|^2$)."
            )
            actions = ["Why are multiple shots needed?", "What is a Statevector?"]
            tags = ["measurement", "born-rule", "wavefunction-collapse"]
        else:
            reply = (
                f"Hello! I am your **QuantumCraft AI Tutor**. I see your workspace has {circuit_context.get('qubit_count', 2)} qubits. "
                "Feel free to ask me about quantum gates (H, X, Y, Z, CNOT), Dirac bra-ket notation, superposition, or quantum algorithms!"
            )
            actions = ["How do I create a Bell state?", "Explain Superposition"]
            tags = ["quantum-basics", "tutor"]

        return {
            "reply": reply,
            "suggested_actions": actions,
            "concept_tags": tags
        }

    @staticmethod
    def _fallback_explain(circuit_ast: List[Dict[str, Any]], qubit_count: int, counts: Optional[Dict[str, int]]) -> Dict[str, Any]:
        has_h = any(g.get("gate", "").lower() == "h" for g in circuit_ast)
        has_cx = any(g.get("gate", "").lower() in ["cx", "cnot"] for g in circuit_ast)

        steps = []
        for i, g in enumerate(circuit_ast):
            gate_name = g.get("gate", "").upper()
            targets = g.get("targets", [])
            steps.append({
                "step": i + 1,
                "gate": f"{gate_name} on qubit(s) {targets}",
                "effect": f"Applies {gate_name} unitary operator on target {targets}",
                "state_after": "Transformed quantum state"
            })

        if has_h and has_cx:
            title = "Bell State Generator (Maximally Entangled Pair)"
            summary = "This circuit creates a canonical Bell State (|Φ⁺⟩) through single-qubit superposition followed by two-qubit conditional entanglement."
            phenomena = ["superposition", "entanglement"]
            dirac = "|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}"
            takeaways = [
                "The H gate creates an equal superposition on qubit 0.",
                "The CX gate correlates qubit 1 with qubit 0, destroying separable product state into an entangled state."
            ]
        elif has_h:
            title = "Quantum Superposition State"
            summary = "This circuit applies Hadamard gate(s) to create unbiased quantum superpositions across basis states."
            phenomena = ["superposition"]
            dirac = "|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}"
            takeaways = [
                "Measurement will collapse the state into definite basis outcomes with equal probability."
            ]
        else:
            title = "Quantum Circuit Transformation"
            summary = f"A {qubit_count}-qubit quantum circuit applying {len(circuit_ast)} quantum gate instruction(s)."
            phenomena = ["deterministic transformation"]
            dirac = "|\\psi\\rangle"
            takeaways = [
                "Unitary operations evolve the quantum state deterministically."
            ]

        return {
            "title": title,
            "summary": summary,
            "step_by_step": steps,
            "quantum_phenomena": phenomena,
            "dirac_notation": dirac,
            "key_takeaways": takeaways
        }