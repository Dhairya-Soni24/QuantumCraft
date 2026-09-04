const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Execute quantum circuit simulation via FastAPI Aer backend.
 * @param {Object} astPayload - Circuit AST matching SimulationRequest schema
 */
export async function runSimulation(astPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(astPayload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Simulation failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API Error [runSimulation]:", error);
    throw error;
  }
}

/**
 * Send message to context-aware AI Quantum Tutor.
 * @param {string} message - Student prompt
 * @param {Array} history - Previous chat turns
 * @param {Object} circuitContext - Active workspace AST and counts
 */
export async function sendTutorMessage(message, history = [], circuitContext = {}) {
  try {
    const cleanHistory = (history || []).map((h) => ({
      role: h.role || "user",
      content: typeof h.content === "string" ? h.content : "",
    }));

    const res = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: cleanHistory,
        circuit_context: circuitContext,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `AI Tutor service error ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API Error [sendTutorMessage]:", error);
    throw error;
  }
}

/**
 * Stream message from context-aware AI Quantum Tutor via Server-Sent Events (SSE).
 * @param {string} message - Student prompt
 * @param {Array} history - Previous chat turns
 * @param {Object} circuitContext - Active workspace AST and counts
 * @param {Function} onToken - Callback for each streamed token (text chunk)
 * @param {Function} onComplete - Callback when stream completes
 * @param {Function} onError - Callback on error
 */
export async function streamTutorMessage(message, history = [], circuitContext = {}, onToken, onComplete, onError) {
  try {
    const cleanHistory = (history || []).map((h) => ({
      role: h.role || "user",
      content: typeof h.content === "string" ? h.content : "",
    }));

    const res = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: cleanHistory,
        circuit_context: circuitContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI Stream error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") {
            if (onComplete) onComplete(accumulated);
            return accumulated;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              accumulated += parsed.token;
              if (onToken) onToken(parsed.token, accumulated);
            }
          } catch {
            // Ignored non-JSON heartbeat
          }
        }
      }
    }

    if (onComplete) onComplete(accumulated);
    return accumulated;
  } catch (error) {
    console.error("API Error [streamTutorMessage]:", error);
    if (onError) onError(error);
    throw error;
  }
}

/**
 * Fetch preset canonical quantum algorithm templates.
 */
export async function fetchAlgorithmTemplates() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/algorithms/templates`);
    if (!res.ok) throw new Error(`Failed to fetch templates (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [fetchAlgorithmTemplates]:", error);
    throw error;
  }
}

/**
 * Fetch available quantum computing curriculum courses.
 */
export async function fetchCourses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/courses`);
    if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [fetchCourses]:", error);
    throw error;
  }
}

/**
 * Fetch interactive quantum algorithm challenges.
 */
export async function fetchChallenges() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/challenges`);
    if (!res.ok) throw new Error(`Failed to fetch challenges (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [fetchChallenges]:", error);
    throw error;
  }
}

/**
 * Request mathematical & intuitive circuit explanation from AI.
 */
export async function explainCircuit(circuitAst, stateVector = null, counts = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qubit_count: circuitAst.qubit_count || 2,
        circuit_ast: circuitAst.circuit_ast || [],
        state_vector: stateVector,
        counts,
      }),
    });
    if (!res.ok) throw new Error(`Circuit explanation failed (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [explainCircuit]:", error);
    throw error;
  }
}

/**
 * Request progressive hints for a quantum challenge from AI.
 */
export async function getChallengeHint(challengeId, currentAst = [], attemptCount = 1) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge_id: challengeId,
        current_ast: currentAst,
        attempt_count: attemptCount,
      }),
    });
    if (!res.ok) throw new Error(`Challenge hint failed (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [getChallengeHint]:", error);
    throw error;
  }
}

/**
 * Request personalized curriculum recommendations.
 */
export async function getCurriculumRecommendations(userId, completedLessons = [], solvedChallenges = []) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        completed_lessons: completedLessons,
        solved_challenges: solvedChallenges,
      }),
    });
    if (!res.ok) throw new Error(`Curriculum recommendation failed (${res.status})`);
    return await res.json();
  } catch (error) {
    console.error("API Error [getCurriculumRecommendations]:", error);
    throw error;
  }
}
