# 🌌 QuantumCraft (IQ-ALP) - Project Status & Work Breakdown Document

**Date:** September 2026  
**Platform:** AI-Based Interactive Quantum Algorithm Learning Platform (IQ-ALP)  
**Team Structure:** 2-Member Core Team (Dhairya & Ansh — Het's responsibilities reallocated)  
**Current Overall Completion:** **~60%**

---

## 📊 1. Team Progress Dashboard

```
┌───────────────────────────────────────────────────────────────┐
│ ROLE & TEAM MEMBER                  PROGRESS        PERCENTAGE│
├───────────────────────────────────────────────────────────────┤
│ 👤 DHAIRYA (Backend, DB, AI & Sim)   ████████████████░░░░  75%│
│ 👤 ANSH    (Frontend, Canvas, UX)    ████████░░░░░░░░░░░░  40%│
├───────────────────────────────────────────────────────────────┤
│ 🚀 TOTAL PROJECT COMPLETION          █████████████░░░░░░░  60%│
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Reallocated Work Breakdown (2-Member Structure)

### 👤 SECTION A: DHAIRYA
**Role:** Backend Integration, Database Architecture, AI Orchestration & Quantum Simulation Engine  
**Status:** **75% Completed**

#### ✅ Completed Work:
1. **PostgreSQL / Supabase Database Architecture**:
   - Designed 7 normalized tables in `database/schema.sql`:
     - `users`, `courses`, `lessons`, `saved_circuits`, `user_progress`, `challenges`, `challenge_submissions`.
   - Automated timestamp triggers and Row-Level Security (RLS) policies.
   - Database seeder (`seed_db.py`) with starter quantum curriculum.
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
5. **Core Quantum Simulator (`backend/simulator.py`)**:
   - AST translation to Qiskit `QuantumCircuit`.
   - Gate support (Single-qubit, two-qubit CX/CZ/SWAP, three-qubit Toffoli, Measurement).
   - Reduced density matrix math via `partial_trace` and single-qubit Bloch vector coordinates $(x, y, z)$.

#### ⏳ Remaining Tasks for Dhairya:
- [ ] **Quantum Algorithm Templates & Multi-Framework Engines *(Reallocated from Het)***:
  - Add backend algorithmic circuit templates (`GET /api/v1/algorithms/templates`):
    - **Deutsch-Jozsa Algorithm** (Constant vs Balanced Oracle).
    - **Grover's Search Algorithm** (Oracle + Diffusion Operator).
    - **Quantum Teleportation Protocol**.
    - **Superdense Coding & Quantum Fourier Transform (QFT)**.
  - Multi-framework translation support (**Cirq** and **PennyLane** code generators/backends in `backend/simulator.py`).
- [ ] **User Progress & Stats Tracking**:
  - `POST /api/v1/progress/complete-lesson`: Mark lessons complete and update streak.
  - `GET /api/v1/users/profile/stats`: Aggregate XP, streak, and activity heatmap data for `/profile`.
- [ ] **Streaming AI Responses (SSE)**:
  - Add Server-Sent Events for token-by-token real-time typing in AI tutor chat.

---

### 👤 SECTION B: ANSH
**Role:** Interactive Frontend, Quantum Canvas, 3D Visualizations & UX  
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

#### ⏳ Remaining Tasks for Ansh:
- [ ] **Frontend-to-Backend API Integration (`frontend/lib/api.js`)**:
  - Connect **Run Simulation** button to `POST /api/v1/simulate`.
  - Connect **AI Tutor chat** input and message history to `POST /api/v1/ai/chat`.
  - Connect **Lessons & Challenges** views to `GET /api/v1/courses` and `GET /api/v1/challenges`.
- [ ] **Algorithm Presets & Framework Switcher UI *(Reallocated from Het)***:
  - Add an **Algorithm Template Selector** dropdown (Bell State, Grover, Teleportation, Deutsch-Jozsa) in the workspace toolbar that auto-populates the visual circuit.
  - Add a **Framework Toggle** in the code editor (Qiskit ↔ Cirq ↔ PennyLane).
- [ ] **Live Qiskit / Cirq Code Generator**:
  - Dynamically generate Python code in the editor panel based on the placed canvas gates in `useQuantumStore`.
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

## 4. Coordinated Action Plan

1. **Dhairya (Backend Focus)**:
   - Add algorithm template endpoint & multi-framework (Cirq/PennyLane) generator.
   - Add user progress & profile stats APIs.
2. **Ansh (Frontend Focus)**:
   - Wire frontend API client (`api.js`) for simulation, AI tutor, and template loading.
   - Build 3D Bloch Sphere component and live histogram visualizer.
