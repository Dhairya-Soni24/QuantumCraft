import httpx
import json
import sys

URL = "http://127.0.0.1:8000/api/v1/ai/chat/stream"

payload = {
    "message": "Can you explain why a Hadamard gate creates superposition?",
    "history": [],
    "circuit_context": {
        "qubit_count": 2,
        "gates": [{"gate": "h", "targets": [0]}]
    }
}

print("Initiating streaming request to AI Quantum Tutor...\n---")

with httpx.Client(timeout=30.0) as client:
    with client.stream("POST", URL, json=payload) as response:
        if response.status_code != 200:
            print(f"Failed with status {response.status_code}")
            sys.exit(1)

        for line in response.iter_lines():
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    print("\n---\nStream finished successfully ([DONE]).")
                    break
                try:
                    data_obj = json.loads(data_str)
                    if "token" in data_obj:
                        sys.stdout.write(data_obj["token"])
                        sys.stdout.flush()
                except json.JSONDecodeError:
                    pass