import time
import json
import os
from google import genai

# -------------------------------------------------
# CONFIGURATION
# -------------------------------------------------
API_KEY = "AIzaSyD6R-D-NzIKrE-29e0sBit43Y9smWXIxiU"   # move to env later
PDF_PATH = "CISA QNA 13th Edition_148 to 165 questions_Domain 1.pdf"
OUTPUT_FILE = "data.json"

START_QUESTION = 1      # change this to resume
TOTAL_QUESTIONS = 18
CHUNK_SIZE = 18
SLEEP_SECONDS = 3
# -------------------------------------------------


def safe_json_parse(text):
    try:
        text = text.strip()
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1:
            return []
        return json.loads(text[start:end + 1])
    except Exception as e:
        print("JSON parse error:", e)
        return []

def get_response_text(response):
    """
    Safely extract text from Gemini response (new SDK)
    """
    try:
        parts = response.candidates[0].content.parts
        texts = []
        for part in parts:
            if hasattr(part, "text") and part.text:
                texts.append(part.text)
        return "\n".join(texts)
    except Exception as e:
        print("Failed to extract response text:", e)
        return None


def main():
    client = genai.Client(api_key=API_KEY)

    print("Uploading PDF...")
    pdf_file = client.files.upload(file=PDF_PATH)

    print("PDF uploaded. Waiting for processing...")
    while True:
        f = client.files.get(name=pdf_file.name)
        if f.state.name == "ACTIVE":
            file_uri = f.uri
            break
        print(".", end="", flush=True)
        time.sleep(1)

    print("\nPDF is ACTIVE")

    # Load existing data if present (resume support)
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            all_questions = json.load(f)
        print(f"Resuming from existing file with {len(all_questions)} questions")
    else:
        all_questions = []
        print("Starting fresh extraction")

    current_id = len(all_questions) + 1

    for start_q in range(START_QUESTION, TOTAL_QUESTIONS + 1, CHUNK_SIZE):
        end_q = min(start_q + CHUNK_SIZE - 1, TOTAL_QUESTIONS)

        print(f"\nExtracting questions {start_q} to {end_q}...")

        prompt = f"""
You are a STRICT data extractor for CISA exam preparation.

Extract MCQ questions numbered {start_q} to {end_q} from the document.

Rules:
- Ignore introduction pages, domain headers, footers, page numbers, and non-question text
- Extract ONLY real MCQ questions
- Output ONLY valid JSON
- No markdown, no commentary outside JSON

IMPORTANT ABOUT EXPLANATIONS:
- The document provides option-wise justifications labeled A, B, C, and D
- You MUST extract the justification for EACH option separately
- Do NOT merge explanations
- Preserve the meaning of official CISA explanations
- Keep explanations concise and exam-oriented

Each MCQ MUST follow EXACTLY this schema:

[
  {{
    "question": string,
    "options": {{
      "A": string,
      "B": string,
      "C": string,
      "D": string
    }},
    "correct_answer": "A|B|C|D",
    "explanations": {{
      "A": string,
      "B": string,
      "C": string,
      "D": string
    }}
  }}
]
"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    {
                        "file_data": {
                            "mime_type": "application/pdf",
                            "file_uri": file_uri
                        }
                    },
                    prompt
                ]
            )

            raw_text = get_response_text(response)
            batch = safe_json_parse(raw_text)

            for q in batch:
                q["id"] = current_id
                all_questions.append(q)
                current_id += 1

            # Save after successful batch
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f_out:
                json.dump(all_questions, f_out, indent=2, ensure_ascii=False)

            print(f"Added {len(batch)} questions")
            print(f"Saved progress up to question ID {current_id - 1}")

        except Exception as e:
            print(f"Batch {start_q}-{end_q} failed:", e)

        time.sleep(SLEEP_SECONDS)

    print("\n------------------------------------")
    print("Extraction complete")
    print(f"Total questions saved: {len(all_questions)}")
    print(f"Output file: {OUTPUT_FILE}")
    print("------------------------------------")


if __name__ == "__main__":
    main()
