import os
import sys
from dotenv import load_dotenv

# Ensure the root and backend paths are in sys.path so we can import from backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from supabase import create_client, Client
from backend.config import settings

def seed_database():
    print("Initializing Supabase Client...")
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # 1. Insert Course
    print("Inserting Course...")
    course_data = {
        "title": "Introduction to Quantum Computing",
        "description": "Learn the fundamentals of qubits, superposition, entanglement, and simple quantum algorithms.",
        "difficulty": "beginner"
    }
    
    try:
        # Check if the course already exists to avoid duplicates
        existing_courses = supabase.table("courses").select("*").eq("title", course_data["title"]).execute()
        if existing_courses.data:
            print("Course already exists. Skipping course creation.")
            course_id = existing_courses.data[0]["id"]
        else:
            insert_res = supabase.table("courses").insert(course_data).execute()
            if not insert_res.data:
                print("Failed to insert course.")
                return
            course_id = insert_res.data[0]["id"]
            print(f"Course inserted successfully with ID: {course_id}")
            
        # 2. Insert Lessons
        print("Inserting Lessons...")
        lessons_data = [
            {
                "course_id": course_id,
                "title": "Qubit Basics and Dirac Notation",
                "content": "A qubit (quantum bit) is the basic unit of quantum information. Unlike a classical bit which can only be 0 or 1, a qubit can exist in a linear combination of both states, represented mathematically in Dirac (bra-ket) notation as:\n\n$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$$\n\nwhere $\\alpha$ and $\\beta$ are complex probability amplitudes satisfying $|\\alpha|^2 + |\\beta|^2 = 1$.",
                "position": 1
            },
            {
                "course_id": course_id,
                "title": "Superposition and the Hadamard Gate",
                "content": "Superposition is the ability of a quantum system to be in multiple states at once. The Hadamard gate (H) is the primary single-qubit gate used to create superposition. When applied to the ground state $|0\\rangle$, it transforms it into the equal superposition state $|+\\rangle$:\n\n$$H|0\\rangle = |+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$\n\nIf measured, this state yields a 50% probability of collapsing to 0 and 50% probability of collapsing to 1.",
                "position": 2
            },
            {
                "course_id": course_id,
                "title": "Entanglement and Bell States",
                "content": "Quantum Entanglement is a phenomenon where the physical states of two or more qubits become perfectly correlated. The canonical way to create entanglement is by applying a Hadamard gate on Qubit 0, followed by a CNOT (Controlled-NOT) gate using Qubit 0 as the control and Qubit 1 as the target. This creates the maximally entangled Bell State:\n\n$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$\n\nMeasuring Qubit 0 instantly determines the state of Qubit 1, regardless of their distance.",
                "position": 3
            }
        ]
        
        for lesson in lessons_data:
            # Check if lesson already exists
            existing_lessons = supabase.table("lessons").select("*").eq("title", lesson["title"]).eq("course_id", course_id).execute()
            if existing_lessons.data:
                print(f"Lesson '{lesson['title']}' already exists. Skipping.")
            else:
                supabase.table("lessons").insert(lesson).execute()
                print(f"Lesson '{lesson['title']}' inserted successfully.")
                
        print("\nDatabase seeding completed successfully!")
        
    except Exception as e:
        print(f"\nError seeding database: {str(e)}")
        print("Please check your .env settings and verify database credentials.")

if __name__ == "__main__":
    load_dotenv()
    seed_database()