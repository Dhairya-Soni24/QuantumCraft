import json
import google.generativeai as genai
from backend.config import settings

# Configure Gemini Client
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class AIService:
    @staticmethod
    async def recommend_next_steps(completed_lessons: list, recent_quiz_scores: list, failed_challenges: list) -> dict:
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
            if not settings.GEMINI_API_KEY:
                raise ValueError("Gemini API key is not configured.")

            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)

        except Exception as e:
            # Rule-based fallback if Gemini API is unavailable or fails
            print(f"[AIService Warning] Gemini call failed, falling back to rules: {e}")
            
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
                "title": "Continue to Next Core Quantum Concepts"
            })
            
            return {
                "recommendation_reasoning": "Fallback recommendation generated while AI engine is offline.",
                "next_steps": fallback_steps
            }