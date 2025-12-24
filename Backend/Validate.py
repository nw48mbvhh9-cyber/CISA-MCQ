import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Check count
print("Total questions:", len(data))

# 2. Detect duplicates by question text
seen = set()
duplicates = []

for q in data:
    text = q["question"].strip().lower()
    if text in seen:
        duplicates.append(q["id"])
    else:
        seen.add(text)

print("Duplicate question IDs:", duplicates)

# 3. Manual spot-gap detection helper
for i, q in enumerate(data, start=1):
    if len(q["question"]) < 30:
        print(f"Suspicious short question at ID {q['id']}")
