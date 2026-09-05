import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from supabase import create_client, Client
from backend.config import settings

def seed_database():
    print("Initializing Supabase Client...")
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # 1. COURSES
    courses_data = [
        {
            "title": "Introduction to Quantum Computing",
            "description": "Learn the fundamentals of qubits, superposition, entanglement, and simple quantum algorithms.",
            "difficulty": "beginner"
        },
        {
            "title": "Quantum Algorithms & Oracles",
            "description": "Explore quantum speedups through phase kickback, oracle querying, Grover search, and the Quantum Fourier Transform.",
            "difficulty": "intermediate"
        },
        {
            "title": "Quantum Protocols & Error Correction",
            "description": "Master quantum teleportation, superdense coding, and multi-qubit error correction codes against decoherence.",
            "difficulty": "advanced"
        }
    ]

    course_ids = {}
    for c in courses_data:
        existing = supabase.table("courses").select("*").eq("title", c["title"]).execute()
        if existing.data:
            c_id = existing.data[0]["id"]
            print(f"Course '{c['title']}' exists (ID: {c_id})")
        else:
            res = supabase.table("courses").insert(c).execute()
            c_id = res.data[0]["id"]
            print(f"Inserted course '{c['title']}' (ID: {c_id})")
        course_ids[c["title"]] = c_id

    # 2. LESSONS
    lessons_data = [
        # Course 1
        {
            "course_id": course_ids["Introduction to Quantum Computing"],
            "title": "Qubit Basics and Dirac Notation",
            "content": "A qubit (quantum bit) is the fundamental unit of quantum information. Unlike a classical bit which is strictly 0 or 1, a qubit exists as a linear combination of both states in Dirac bra-ket notation:\n\n$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$$\n\nwhere $\\alpha$ and $\\beta$ are complex probability amplitudes satisfying the normalization condition:\n\n$$|\\alpha|^2 + |\\beta|^2 = 1$$\n\nWhen measured in the computational basis, the state collapses to $|0\\rangle$ with probability $|\\alpha|^2$ and to $|1\\rangle$ with probability $|\\beta|^2$.",
            "position": 1
        },
        {
            "course_id": course_ids["Introduction to Quantum Computing"],
            "title": "Superposition and the Hadamard Gate",
            "content": "Superposition is the ability of a quantum system to exist simultaneously across multiple basis states. The Hadamard gate (H) is the primary tool for creating equal superposition. When applied to the ground state $|0\\rangle$, it produces:\n\n$$H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$\n\nSimilarly, when applied to $|1\\rangle$, it produces:\n\n$$H|1\\rangle = |-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}}$$\n\nMeasuring state $|+\\rangle$ yields a 50% chance of observing 0 and a 50% chance of observing 1.",
            "position": 2
        },
        {
            "course_id": course_ids["Introduction to Quantum Computing"],
            "title": "Entanglement and Bell States",
            "content": "Quantum Entanglement is a correlation between qubits such that the quantum state of each particle cannot be described independently of the state of the others.\n\nThe canonical way to generate an entangled Bell State is by placing Qubit 0 into superposition with a Hadamard gate, then using a Controlled-NOT (CNOT) gate with Qubit 0 as control and Qubit 1 as target:\n\n$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$\n\nMeasuring Qubit 0 immediately determines the state of Qubit 1, even if they are physically separated across light-years.",
            "position": 3
        },
        {
            "course_id": course_ids["Introduction to Quantum Computing"],
            "title": "Pauli and Phase Rotation Gates",
            "content": "Quantum computation utilizes single-qubit rotation gates to navigate around the 3D Bloch Sphere:\n\n1. **Pauli-X:** Bit-flip gate ($X|0\\rangle = |1\\rangle$, $X|1\\rangle = |0\\rangle$).\n2. **Pauli-Y:** Bit and phase flip ($Y|0\\rangle = i|1\\rangle$, $Y|1\\rangle = -i|0\\rangle$).\n3. **Pauli-Z:** Phase-flip gate ($Z|0\\rangle = |0\\rangle$, $Z|1\\rangle = -|1\\rangle$).\n4. **S Gate & T Gate:** $\\pi/2$ and $\\pi/4$ phase rotations around the Z-axis.\n5. **Parameterized Rotations ($R_x, R_y, R_z$):** Arbitrary angle $\\theta$ rotations.",
            "position": 4
        },
        # Course 2
        {
            "course_id": course_ids["Quantum Algorithms & Oracles"],
            "title": "Phase Kickback and Quantum Parallelism",
            "content": "Phase Kickback occurs when a quantum gate applied to a target qubit modifies the relative phase of the control qubit.\n\nWhen an eigenvalue equation $U|y\\rangle = e^{i\\theta}|y\\rangle$ holds on the target register, a controlled-$U$ gate transforms:\n\n$$|x\\rangle|y\\rangle \\longrightarrow e^{i x \\theta}|x\\rangle|y\\rangle$$\n\nThis phenomenon is the fundamental mathematical mechanism behind the Deutsch-Jozsa algorithm, Grover search, and Quantum Phase Estimation.",
            "position": 1
        },
        {
            "course_id": course_ids["Quantum Algorithms & Oracles"],
            "title": "The Deutsch-Jozsa Algorithm",
            "content": "The Deutsch-Jozsa algorithm determines whether a black-box boolean function $f(x)$ is **Constant** (returns all 0s or all 1s) or **Balanced** (returns 0 for half of inputs and 1 for the other half).\n\n* **Classical Complexity:** Requires up to $2^{n-1} + 1$ queries in the worst case.\n* **Quantum Complexity:** Solves the problem in **exactly 1 query**!\n\nBy preparing inputs in equal superposition and using Phase Kickback, constructive interference causes constant functions to measure strictly to $|00\\dots0\\rangle$, while balanced functions always measure to a non-zero state.",
            "position": 2
        },
        {
            "course_id": course_ids["Quantum Algorithms & Oracles"],
            "title": "Grover's Search Algorithm",
            "content": "Grover's Algorithm searches an unsorted database of $N = 2^n$ elements in $\\mathcal{O}(\\sqrt{N})$ time, providing a quadratic speedup over classical $\\mathcal{O}(N)$ search.\n\nIt operates in two repeating iterative steps:\n1. **The Oracle ($U_\\omega$):** Flips the phase of the target marked state $|w\\rangle \\to -|w\\rangle$.\n2. **The Diffuser ($U_s$):** Inverts all amplitudes around their mean value ($2|s\\rangle\\langle s| - I$).\n\nEach Grover iteration increases the probability amplitude of the target state until measurement reveals the solution with near 100% certainty.",
            "position": 3
        },
        {
            "course_id": course_ids["Quantum Algorithms & Oracles"],
            "title": "Quantum Fourier Transform (QFT)",
            "content": "The Quantum Fourier Transform (QFT) is the quantum analogue of the Discrete Fourier Transform (DFT). It transforms a quantum state from the computational basis into the frequency/phase basis:\n\n$$\\text{QFT}|j\\rangle = \\frac{1}{\\sqrt{N}}\\sum_{k=0}^{N-1} e^{2\\pi i j k / N}|k\\rangle$$\n\nQFT runs in $\\mathcal{O}(n^2)$ gate operations, exponentially faster than classical Fast Fourier Transform (FFT) which takes $\\mathcal{O}(n 2^n)$. It is the mathematical cornerstone of Shor's algorithm for factoring primes.",
            "position": 4
        },
        # Course 3
        {
            "course_id": course_ids["Quantum Protocols & Error Correction"],
            "title": "Quantum Teleportation Protocol",
            "content": "Due to the No-Cloning Theorem, an arbitrary quantum state cannot be copied. However, Quantum Teleportation allows transmission of an unknown qubit $|\\psi\\rangle$ to a remote receiver using:\n1. One shared entangled Bell state ($|\\Phi^+\\rangle$).\n2. Two classical bits sent over standard communication channels.\n\nThe sender performs a Bell-basis measurement on the source qubit and their half of the Bell pair, then transmits the 2-bit result to the receiver, who applies single-qubit corrective gates ($X^m Z^n$) to reconstruct $|\\psi\\rangle$ perfectly.",
            "position": 1
        },
        {
            "course_id": course_ids["Quantum Protocols & Error Correction"],
            "title": "Superdense Coding",
            "content": "Superdense Coding is the dual of quantum teleportation: it enables a sender to transmit **two classical bits** of information by physically sending only **one quantum qubit**.\n\nThe protocol requires pre-sharing an entangled Bell pair between Alice and Bob. Alice applies one of four local Pauli operations ($I, X, Z, XZ$) to her qubit depending on her 2-bit message, and sends her qubit to Bob. Bob then measures both qubits in the Bell basis to decode the full 2 bits.",
            "position": 2
        },
        {
            "course_id": course_ids["Quantum Protocols & Error Correction"],
            "title": "3-Qubit Quantum Bit-Flip Error Correction",
            "content": "Environmental noise causes quantum states to decohere. The 3-Qubit Bit-Flip code protects 1 logical qubit against unwanted Pauli-X noise by encoding it redundantly across 3 physical qubits:\n\n$$|0_L\\rangle = |000\\rangle, \\quad |1_L\\rangle = |111\\rangle$$\n\nSyndrome measurement uses ancillary qubits to detect whether a bit flip occurred on qubit 0, 1, or 2 without measuring or destroying the superposition state $|\\psi_L\\rangle = \\alpha|000\\rangle + \\beta|111\\rangle$.",
            "position": 3
        }
    ]

    for lesson in lessons_data:
        existing = supabase.table("lessons").select("*").eq("title", lesson["title"]).eq("course_id", lesson["course_id"]).execute()
        if existing.data:
            print(f"Lesson '{lesson['title']}' already exists. Skipping.")
        else:
            supabase.table("lessons").insert(lesson).execute()
            print(f"Inserted lesson '{lesson['title']}'")

    # 3. CHALLENGES
    challenges_data = [
        {
            "title": "Quantum Bit Flip (|1⟩ State)",
            "description": "Transform the ground state |0⟩ into the excited state |1⟩ using a Pauli-X gate.",
            "difficulty": "beginner",
            "points": 20,
            "target_state_vector": "[[0.0, 0.0], [1.0, 0.0]]",
            "target_counts": {"1": 1024}
        },
        {
            "title": "Create a Bell State (|Φ⁺⟩)",
            "description": "Construct a 2-qubit circuit that produces the maximally entangled state (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.",
            "difficulty": "beginner",
            "points": 50,
            "target_state_vector": "[[0.707106, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707106, 0.0]]",
            "target_counts": {"00": 512, "11": 512}
        },
        {
            "title": "Superposition Phase Flip (|-⟩ State)",
            "description": "Create the negative superposition state (|0⟩ - |1⟩)/√2 with a 180-degree relative phase using single-qubit gates.",
            "difficulty": "intermediate",
            "points": 40,
            "target_state_vector": "[[0.707106, 0.0], [-0.707106, 0.0]]",
            "target_counts": {"0": 512, "1": 512}
        },
        {
            "title": "Synthesize the 3-Qubit GHZ State",
            "description": "Create the tripartite Greenberger–Horne–Zeilinger (GHZ) state (|000⟩ + |111⟩)/√2 across 3 qubits using Hadamard and cascaded CNOT gates.",
            "difficulty": "intermediate",
            "points": 75,
            "target_state_vector": "[[0.707106, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707106, 0.0]]",
            "target_counts": {"000": 512, "111": 512}
        },
        {
            "title": "Grover 2-Qubit Search Oracle",
            "description": "Implement a 2-qubit Grover search algorithm to mark and amplify the target state |11⟩ to 100% probability using an Oracle and Diffuser.",
            "difficulty": "advanced",
            "points": 100,
            "target_state_vector": "[[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [1.0, 0.0]]",
            "target_counts": {"11": 1024}
        }
    ]

    for chal in challenges_data:
        existing = supabase.table("challenges").select("*").eq("title", chal["title"]).execute()
        if existing.data:
            print(f"Challenge already exists. Skipping.")
        else:
            supabase.table("challenges").insert(chal).execute()
            print("Inserted challenge successfully.")

    print("\nDatabase successfully seeded with Courses, Lessons, and Challenges!")

if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')
    load_dotenv()
    seed_database()
