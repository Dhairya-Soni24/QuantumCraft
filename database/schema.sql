-- ============================================================================
-- 0. EXTENSIONS & UTILITY FUNCTIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.saved_circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    canvas_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    code_snippet TEXT,
    framework TEXT NOT NULL DEFAULT 'qiskit',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id)
);

CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_state_vector TEXT,
    target_counts JSONB,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    points INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.challenge_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    submitted_circuit_json JSONB,
    submitted_code TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed')),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 2. CREATE AUTOMATIC TIMESTAMP TRIGGERS
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_circuits_updated_at BEFORE UPDATE ON public.saved_circuits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenge_submissions_updated_at BEFORE UPDATE ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR: users
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR: saved_circuits
CREATE POLICY "Users can view their own circuits" ON public.saved_circuits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own circuits" ON public.saved_circuits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own circuits" ON public.saved_circuits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own circuits" ON public.saved_circuits FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR: user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.user_progress FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR: challenge_submissions
CREATE POLICY "Users can view their own submissions" ON public.challenge_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own submissions" ON public.challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON public.challenge_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own submissions" ON public.challenge_submissions FOR DELETE USING (auth.uid() = user_id);




-- ============================================================================
-- QUANTUMCRAFT: SEED COURSES, LESSONS & CHALLENGES
-- ============================================================================

DO $$
DECLARE
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
BEGIN

    -- ------------------------------------------------------------------------
    -- 1. COURSES
    -- ------------------------------------------------------------------------
    
    -- Course 1: Beginner
    SELECT id INTO course1_id FROM public.courses WHERE title = 'Introduction to Quantum Computing';
    IF course1_id IS NULL THEN
        INSERT INTO public.courses (title, description, difficulty)
        VALUES (
            'Introduction to Quantum Computing',
            'Learn the fundamentals of qubits, superposition, entanglement, and simple quantum algorithms.',
            'beginner'
        ) RETURNING id INTO course1_id;
    END IF;

    -- Course 2: Intermediate
    SELECT id INTO course2_id FROM public.courses WHERE title = 'Quantum Algorithms & Oracles';
    IF course2_id IS NULL THEN
        INSERT INTO public.courses (title, description, difficulty)
        VALUES (
            'Quantum Algorithms & Oracles',
            'Explore quantum speedups through phase kickback, oracle querying, Grover search, and the Quantum Fourier Transform.',
            'intermediate'
        ) RETURNING id INTO course2_id;
    END IF;

    -- Course 3: Advanced
    SELECT id INTO course3_id FROM public.courses WHERE title = 'Quantum Protocols & Error Correction';
    IF course3_id IS NULL THEN
        INSERT INTO public.courses (title, description, difficulty)
        VALUES (
            'Quantum Protocols & Error Correction',
            'Master quantum teleportation, superdense coding, and multi-qubit error correction codes against decoherence.',
            'advanced'
        ) RETURNING id INTO course3_id;
    END IF;


    -- ------------------------------------------------------------------------
    -- 2. LESSONS FOR COURSE 1 (Beginner)
    -- ------------------------------------------------------------------------

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course1_id AND position = 1) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course1_id,
            'Qubit Basics and Dirac Notation',
            'A qubit (quantum bit) is the fundamental unit of quantum information. Unlike a classical bit which is strictly 0 or 1, a qubit exists as a linear combination of both states in Dirac bra-ket notation:

$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$

where $\alpha$ and $\beta$ are complex probability amplitudes satisfying the normalization condition:

$$|\alpha|^2 + |\beta|^2 = 1$$

When measured in the computational basis, the state collapses to $|0\rangle$ with probability $|\alpha|^2$ and to $|1\rangle$ with probability $|\beta|^2$.',
            1
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course1_id AND position = 2) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course1_id,
            'Superposition and the Hadamard Gate',
            'Superposition is the ability of a quantum system to exist simultaneously across multiple basis states. The Hadamard gate (H) is the primary tool for creating equal superposition. When applied to the ground state $|0\rangle$, it produces:

$$H|0\rangle = |+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$

Similarly, when applied to $|1\rangle$, it produces:

$$H|1\rangle = |-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$$

Measuring state $|+\rangle$ yields a 50% chance of observing 0 and a 50% chance of observing 1.',
            2
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course1_id AND position = 3) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course1_id,
            'Entanglement and Bell States',
            'Quantum Entanglement is a correlation between qubits such that the quantum state of each particle cannot be described independently of the state of the others.

The canonical way to generate an entangled Bell State is by placing Qubit 0 into superposition with a Hadamard gate, then using a Controlled-NOT (CNOT) gate with Qubit 0 as control and Qubit 1 as target:

$$|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$$

Measuring Qubit 0 immediately determines the state of Qubit 1, even if they are physically separated across light-years.',
            3
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course1_id AND position = 4) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course1_id,
            'Pauli and Phase Rotation Gates',
            'Quantum computation utilizes single-qubit rotation gates to navigate around the 3D Bloch Sphere:

1. **Pauli-X:** Bit-flip gate ($X|0\rangle = |1\rangle$, $X|1\rangle = |0\rangle$).
2. **Pauli-Y:** Bit and phase flip ($Y|0\rangle = i|1\rangle$, $Y|1\rangle = -i|0\rangle$).
3. **Pauli-Z:** Phase-flip gate ($Z|0\rangle = |0\rangle$, $Z|1\rangle = -|1\rangle$).
4. **S Gate & T Gate:** $\pi/2$ and $\pi/4$ phase rotations around the Z-axis.
5. **Parameterized Rotations ($R_x, R_y, R_z$):** Arbitrary angle $\theta$ rotations.',
            4
        );
    END IF;


    -- ------------------------------------------------------------------------
    -- 3. LESSONS FOR COURSE 2 (Intermediate)
    -- ------------------------------------------------------------------------

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course2_id AND position = 1) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course2_id,
            'Phase Kickback and Quantum Parallelism',
            'Phase Kickback occurs when a quantum gate applied to a target qubit modifies the relative phase of the control qubit.

When an eigenvalue equation $U|y\rangle = e^{i\theta}|y\rangle$ holds on the target register, a controlled-$U$ gate transforms:

$$|x\rangle|y\rangle \longrightarrow e^{i x \theta}|x\rangle|y\rangle$$

This phenomenon is the fundamental mathematical mechanism behind the Deutsch-Jozsa algorithm, Grover search, and Quantum Phase Estimation.',
            1
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course2_id AND position = 2) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course2_id,
            'The Deutsch-Jozsa Algorithm',
            'The Deutsch-Jozsa algorithm determines whether a black-box boolean function $f(x)$ is **Constant** (returns all 0s or all 1s) or **Balanced** (returns 0 for half of inputs and 1 for the other half).

* **Classical Complexity:** Requires up to $2^{n-1} + 1$ queries in the worst case.
* **Quantum Complexity:** Solves the problem in **exactly 1 query**!

By preparing inputs in equal superposition and using Phase Kickback, constructive interference causes constant functions to measure strictly to $|00\dots0\rangle$, while balanced functions always measure to a non-zero state.',
            2
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course2_id AND position = 3) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course2_id,
            'Grover''s Search Algorithm',
            'Grover''s Algorithm searches an unsorted database of $N = 2^n$ elements in $\mathcal{O}(\sqrt{N})$ time, providing a quadratic speedup over classical $\mathcal{O}(N)$ search.

It operates in two repeating iterative steps:
1. **The Oracle ($U_\omega$):** Flips the phase of the target marked state $|w\rangle \to -|w\rangle$.
2. **The Diffuser ($U_s$):** Inverts all amplitudes around their mean value ($2|s\rangle\langle s| - I$).

Each Grover iteration increases the probability amplitude of the target state until measurement reveals the solution with near 100% certainty.',
            3
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course2_id AND position = 4) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course2_id,
            'Quantum Fourier Transform (QFT)',
            'The Quantum Fourier Transform (QFT) is the quantum analogue of the Discrete Fourier Transform (DFT). It transforms a quantum state from the computational basis into the frequency/phase basis:

$$\text{QFT}|j\rangle = \frac{1}{\sqrt{N}}\sum_{k=0}^{N-1} e^{2\pi i j k / N}|k\rangle$$

QFT runs in $\mathcal{O}(n^2)$ gate operations, exponentially faster than classical Fast Fourier Transform (FFT) which takes $\mathcal{O}(n 2^n)$. It is the mathematical cornerstone of Shor''s algorithm for factoring primes.',
            4
        );
    END IF;


    -- ------------------------------------------------------------------------
    -- 4. LESSONS FOR COURSE 3 (Advanced)
    -- ------------------------------------------------------------------------

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course3_id AND position = 1) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course3_id,
            'Quantum Teleportation Protocol',
            'Due to the No-Cloning Theorem, an arbitrary quantum state cannot be copied. However, Quantum Teleportation allows transmission of an unknown qubit $|\psi\rangle$ to a remote receiver using:
1. One shared entangled Bell state ($|\Phi^+\rangle$).
2. Two classical bits sent over standard communication channels.

The sender performs a Bell-basis measurement on the source qubit and their half of the Bell pair, then transmits the 2-bit result to the receiver, who applies single-qubit corrective gates ($X^m Z^n$) to reconstruct $|\psi\rangle$ perfectly.',
            1
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course3_id AND position = 2) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course3_id,
            'Superdense Coding',
            'Superdense Coding is the dual of quantum teleportation: it enables a sender to transmit **two classical bits** of information by physically sending only **one quantum qubit**.

The protocol requires pre-sharing an entangled Bell pair between Alice and Bob. Alice applies one of four local Pauli operations ($I, X, Z, XZ$) to her qubit depending on her 2-bit message, and sends her qubit to Bob. Bob then measures both qubits in the Bell basis to decode the full 2 bits.',
            2
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.lessons WHERE course_id = course3_id AND position = 3) THEN
        INSERT INTO public.lessons (course_id, title, content, position)
        VALUES (
            course3_id,
            '3-Qubit Quantum Bit-Flip Error Correction',
            'Environmental noise causes quantum states to decohere. The 3-Qubit Bit-Flip code protects 1 logical qubit against unwanted Pauli-X noise by encoding it redundantly across 3 physical qubits:

$$|0_L\rangle = |000\rangle, \quad |1_L\rangle = |111\rangle$$

Syndrome measurement uses ancillary qubits to detect whether a bit flip occurred on qubit 0, 1, or 2 without measuring or destroying the superposition state $|\psi_L\rangle = \alpha|000\rangle + \beta|111\rangle$.',
            3
        );
    END IF;


    -- ------------------------------------------------------------------------
    -- 5. CHALLENGES
    -- ------------------------------------------------------------------------

    -- Challenge 1: Bit Flip
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Quantum Bit Flip (|1⟩ State)') THEN
        INSERT INTO public.challenges (title, description, difficulty, points, target_state_vector, target_counts)
        VALUES (
            'Quantum Bit Flip (|1⟩ State)',
            'Transform the ground state |0⟩ into the excited state |1⟩ using a Pauli-X gate.',
            'beginner',
            20,
            '[[0.0, 0.0], [1.0, 0.0]]',
            '{"1": 1024}'::jsonb
        );
    END IF;

    -- Challenge 2: Bell State
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Create a Bell State (|Φ⁺⟩)') THEN
        INSERT INTO public.challenges (title, description, difficulty, points, target_state_vector, target_counts)
        VALUES (
            'Create a Bell State (|Φ⁺⟩)',
            'Construct a 2-qubit circuit that produces the maximally entangled state (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.',
            'beginner',
            50,
            '[[0.707106, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707106, 0.0]]',
            '{"00": 512, "11": 512}'::jsonb
        );
    END IF;

    -- Challenge 3: Superposition Phase Flip
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Superposition Phase Flip (|-⟩ State)') THEN
        INSERT INTO public.challenges (title, description, difficulty, points, target_state_vector, target_counts)
        VALUES (
            'Superposition Phase Flip (|-⟩ State)',
            'Create the negative superposition state (|0⟩ - |1⟩)/√2 with a 180-degree relative phase using single-qubit gates.',
            'intermediate',
            40,
            '[[0.707106, 0.0], [-0.707106, 0.0]]',
            '{"0": 512, "1": 512}'::jsonb
        );
    END IF;

    -- Challenge 4: GHZ State
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Synthesize the 3-Qubit GHZ State') THEN
        INSERT INTO public.challenges (title, description, difficulty, points, target_state_vector, target_counts)
        VALUES (
            'Synthesize the 3-Qubit GHZ State',
            'Create the tripartite Greenberger–Horne–Zeilinger (GHZ) state (|000⟩ + |111⟩)/√2 across 3 qubits using Hadamard and cascaded CNOT gates.',
            'intermediate',
            75,
            '[[0.707106, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.707106, 0.0]]',
            '{"000": 512, "111": 512}'::jsonb
        );
    END IF;

    -- Challenge 5: Grover Oracle
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Grover 2-Qubit Search Oracle') THEN
        INSERT INTO public.challenges (title, description, difficulty, points, target_state_vector, target_counts)
        VALUES (
            'Grover 2-Qubit Search Oracle',
            'Implement a 2-qubit Grover search algorithm to mark and amplify the target state |11⟩ to 100% probability using an Oracle and Diffuser.',
            'advanced',
            100,
            '[[0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [1.0, 0.0]]',
            '{"11": 1024}'::jsonb
        );
    END IF;

END $$;
