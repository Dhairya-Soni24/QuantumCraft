# 🌌 QuantumCraft (IQ-ALP) - Project Status & Work Breakdown Document

**Date:** September 2026  
**Platform:** AI-Based Interactive Quantum Algorithm Learning Platform (IQ-ALP)  
**Current Overall Completion:** **~60%**

---

## 📊 1. Team Progress Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│ ROLE & TEAM MEMBER                  PROGRESS        PERCENTAGE│
├───────────────────────────────────────────────────────────────┤
│ 👤 DHAIRYA (Backend, Database & AI)  ████████████████░░░░  80%│
│ 👤 HET     (Quantum Engine & Algos)  ████████████░░░░░░░░  60%│
│ 👤 ANSH    (Frontend, Canvas & UX)   ████████░░░░░░░░░░░░  40%│
├───────────────────────────────────────────────────────────────┤
│ 🚀 TOTAL PROJECT COMPLETION          █████████████░░░░░░░  60%│
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Work Breakdown by Member

### 👤 SECTION A: DHAIRYA
**Role:** Backend Integration, Database Architecture & AI Orchestration Manager  
**Status:** **80% Completed**

#### ✅ Completed Work:
1. **PostgreSQL / Supabase Database Architecture**:
   - Designed 7 normalized tables in `database/schema.sql`:
     - `users`, `courses`, `lessons`, `saved_circuits`, `user_progress`, `challenges`, `challenge_submissions`.
   - Automatic timestamp triggers and Row-Level Security (RLS) policies.
   - Database seeder (`seed_db.py`) populated with starter quantum curriculum.
2. **FastAPI Application Gateway & Security**:
   - `backend/main.py`: CORS middleware, health check endpoint (`/health`), and dynamic router registration.
   - `backend/auth.py`: JWT token verification and dev fallback.
   - `backend/supabase_client.py`: Safe lazy-loaded client leveraging Service Role Key.
3. **AI Services & AI Tutor Engine (`backend/ai_services.py`)**:
   - Live **Gemini AI (`gemini-3.6-flash`)** integration with intelligent rule-based offline fallbacks.
   - `POST /api/v1/ai/chat`: Multi-turn quantum tutor aware of workspace circuit AST, gates, and measurement counts.
   - `POST /api/v1/ai/explain`: Step-by-step mathematical & intuitive circuit explanation.
   - `POST /api/v1/ai/hint`: Progressive challenge guidance.
   - `POST /api/v1/ai/recommend`: Adaptive curriculum recommendations.
4. **Educational & Circuits REST Endpoints**:
   - `backend/routers/courses_router.py`: `GET /api/v1/courses`, `GET /api/v1/courses/{id}`, `GET /api/v1/courses/{id}/lessons`.
   - `backend/routers/challenges_router.py`: `GET /api/v1/challenges`, `POST /api/v1/challenges/{id}/evaluate` (automated quantum grading).
   - `backend/routers/circuits_router.py`: Full CRUD for user quantum circuits.

#### ⏳ Remaining Tasks:
- [ ] **User Progress & Stats Tracking**:
  - `POST /api/v1/progress/complete-lesson`: Mark lessons complete and update streak.
  - `GET /api/v1/users/profile/stats`: Aggregate XP, streak, and activity heatmap data for `/profile`.
- [ ] **Streaming AI Responses (SSE)**:
  - Add Server-Sent Events for token-by-token real-time typing in AI tutor chat.

---

### 👤 SECTION B: HET
**Role:** Quantum Simulator & Algorithmic Concepts Engine Developer  
**Status:** **60% Completed**

#### ✅ Completed Work:
1. **Core Qiskit Simulation Engine (`backend/simulator.py`)**:
   - JSON AST to Qiskit `QuantumCircuit` translation.
   - Gate support:
     - **Single-Qubit**: `H, X, Y, Z, S, SDG, T, TDG, P, RX, RY, RZ`.
     - **Two-Qubit**: `CX (CNOT), CZ, SWAP`.
     - **Three-Qubit**: `CCX (Toffoli)`.
     - **Operations**: Measurement (`M`).
   - Strict boundary validation (out-of-bounds qubit indices, target count verification).
2. **Statevector & Bloch Vector Coordinates**:
   - Single-qubit reduced density matrix math using `partial_trace`.
   - Bloch sphere Cartesian vector coordinates $(x, y, z)$ computation for each qubit.
3. **Aer Execution & Measurement Sampling**:
   - `qasm_simulator` shot sampling (default 1024 shots) + statevector probability distribution fallback.

#### ⏳ Remaining Tasks:
- [ ] **Multi-Framework Simulator Backends**:
  - Integrate **Cirq** and **PennyLane** execution engines alongside Qiskit.
- [ ] **Prebuilt Quantum Algorithm Templates**:
  - Add backend algorithmic templates:
    - Deutsch-Jozsa Algorithm (constant vs balanced oracle).
    - Grover's Search Algorithm (oracle + diffusion operator).
    - Quantum Teleportation Protocol.
    - Quantum Fourier Transform (QFT).
- [ ] **NISQ Noise Modeling (Optional)**:
  - Add realistic quantum noise models (depolarizing noise, thermal relaxation $T_1/T_2$, readout errors).

---

### 👤 SECTION C: ANSH
**Role:** Interactive Frontend & User Experience (UX) Developer  
**Status:** **40% Completed**

#### ✅ Completed Work:
1. **Next.js 16 Workspace Layout & Theme**:
   - Dark quantum-themed UI layouts using Tailwind CSS, Lucide icons, and Resizable Panels (`components/ui/resizable.tsx`).
   - `frontend/app/page.jsx`: Workspace IDE layout with TopNav, Activity Bar, Gate Library, Canvas area, Qiskit Code Editor, AI Tutor, and Output panels.
   - `frontend/app/profile/page.jsx`: Student profile with activity heatmap, XP, and stats cards.
2. **React Flow Circuit Store (`frontend/store/useQuantumStore.js`)**:
   - Zustand global store for adding/removing quantum wires (`addWire`, `removeWire`).
   - Drag-and-drop gate positioning and grid lane snapping (`snapPosition`, `snapNodeToLane`).
   - Custom `WireNode` and `GateNode` components.

#### ⏳ Remaining Tasks:
- [ ] **Frontend-to-Backend API Integration (`frontend/lib/api.js`)**:
  - Connect **Run Simulation** button to `POST /api/v1/simulate`.
  - Connect **AI Tutor chat** input and message history to `POST /api/v1/ai/chat`.
  - Connect **Lessons & Challenges** views to `GET /api/v1/courses` and `GET /api/v1/challenges`.
- [ ] **Live Qiskit Code Generation**:
  - Dynamically generate Python Qiskit code in the editor panel based on the placed canvas gates in `useQuantumStore`.
- [ ] **Dynamic Simulation Visualizations**:
  - Render live probability histograms (e.g. `|00⟩: 50%`, `|11⟩: 50%`) from simulation counts.
  - Render 3D Bloch sphere vector rotations using Three.js / `@react-three/fiber`.
- [ ] **Multi-Qubit Gate Connectors**:
  - Render visual control-target connector lines for CNOT, CZ, and SWAP gates across lanes.

---

## 3. Active REST API Endpoints

| Endpoint | Method | Description | Handler / File |
|---|:---:|---|---|
| `/health` | `GET` | Health check & Supabase connectivity | `backend/main.py` |
| `/api/v1/simulate` | `POST` | Simulates AST circuit, returns counts & Bloch vectors | `backend/routers/simulation_router.py` |
| `/api/v1/ai/chat` | `POST` | Context-aware AI Quantum Tutor chat | `backend/routers/ai_router.py` |
| `/api/v1/ai/explain` | `POST` | Step-by-step mathematical circuit explanation | `backend/routers/ai_router.py` |
| `/api/v1/ai/hint` | `POST` | Progressive challenge hints without full solutions | `backend/routers/ai_router.py` |
| `/api/v1/ai/recommend` | `POST` | Adaptive learning path recommendations | `backend/routers/ai_router.py` |
| `/api/v1/courses` | `GET` | Lists available quantum courses | `backend/routers/courses_router.py` |
| `/api/v1/courses/{id}` | `GET` | Course details and ordered lessons | `backend/routers/courses_router.py` |
| `/api/v1/challenges` | `GET` | Lists quantum algorithm challenges | `backend/routers/challenges_router.py` |
| `/api/v1/challenges/{id}/evaluate` | `POST` | Grades student circuit against target state | `backend/routers/challenges_router.py` |
| `/api/v1/circuits/save` | `POST` | Saves circuit to user profile in Supabase | `backend/routers/circuits_router.py` |
| `/api/v1/circuits/my-circuits` | `GET` | Retrieves user's saved circuits | `backend/routers/circuits_router.py` |

---

## 4. Immediate Next Steps & Action Plan

1. **Next for Dhairya**:
   - Implement `user_progress` routes (`/api/v1/progress/...`) to connect user achievements with the database.
2. **Next for Ansh**:
   - Create `frontend/lib/api.js` and wire up the "Run Simulation" and "AI Tutor" buttons in `frontend/app/page.jsx`.
3. **Next for Het**:
   - Add Cirq / PennyLane simulation engines and prebuilt algorithm templates (Deutsch-Jozsa, Grover, Teleportation).
