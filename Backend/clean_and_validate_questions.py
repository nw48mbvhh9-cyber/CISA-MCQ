import json
import re

INPUT_FILE = "domain1_raw.json"
OUTPUT_FILE = "domain1_clean.json"
ISSUES_FILE = "domain1_validation_issues.json"

OPTION_KEYS = {"A", "B", "C", "D"}

def clean_question_text(text):
    """
    Remove leading question numbers like:
    1.  Q12.  12)  etc.
    """
    if not isinstance(text, str):
        return text

    text = text.strip()
    text = re.sub(r"^\s*(Q)?\d+[\.\)\-:]\s*", "", text, flags=re.IGNORECASE)
    return text.strip()

def validate_question(q):
    issues = []

    # ID
    if not isinstance(q.get("id"), int):
        issues.append("Invalid or missing id")

    # Question
    question = q.get("question", "")
    if not question:
        issues.append("Missing question text")

    # Options
    options = q.get("options")
    if not isinstance(options, dict):
        issues.append("Options is not a dictionary")
    else:
        missing_opts = OPTION_KEYS - options.keys()
        if missing_opts:
            issues.append(f"Missing options: {missing_opts}")
        for k, v in options.items():
            if not isinstance(v, str) or not v.strip():
                issues.append(f"Empty option text for {k}")

    # Correct answer
    correct = q.get("correct_answer")
    if correct not in OPTION_KEYS:
        issues.append("Invalid correct_answer")
    elif options and correct not in options:
        issues.append("Correct answer not found in options")

    # Explanations
    explanations = q.get("explanations")
    if not isinstance(explanations, dict):
        issues.append("Explanations is not a dictionary")
    else:
        missing_exp = OPTION_KEYS - explanations.keys()
        if missing_exp:
            issues.append(f"Missing explanations for: {missing_exp}")

    # Logical consistency
    if correct and explanations and correct not in explanations:
        issues.append("No explanation for correct answer")

    return issues

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    cleaned_questions = []
    validation_issues = []

    seen_ids = set()

    for q in questions:
        q_clean = q.copy()

        # Clean question text
        q_clean["question"] = clean_question_text(q.get("question", ""))

        # Validate
        issues = validate_question(q_clean)

        # ID uniqueness
        qid = q_clean.get("id")
        if qid in seen_ids:
            issues.append("Duplicate question id")
        seen_ids.add(qid)

        if issues:
            validation_issues.append({
                "id": qid,
                "issues": issues
            })

        cleaned_questions.append(q_clean)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(cleaned_questions, f, indent=2, ensure_ascii=False)

    with open(ISSUES_FILE, "w", encoding="utf-8") as f:
        json.dump(validation_issues, f, indent=2, ensure_ascii=False)

    print(f"Loaded {len(questions)} questions from input file")
    print(f"Total questions processed: {len(cleaned_questions)}")
    print(f"Questions with issues: {len(validation_issues)}")

if __name__ == "__main__":
    main()
