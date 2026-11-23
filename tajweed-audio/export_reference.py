
import json
import sys
from pathlib import Path

sys.path.insert(0, "quran-g2p/src")
from quran_g2p import tokenlayer_tj3 as tj3

output_dir = Path("public")
output_dir.mkdir(exist_ok=True)

exported = 0

with open("quran_phonetics.jsonl", encoding="utf-8") as f:
    for line in f:
        row = json.loads(line)

        if not 78 <= row["surah"] <= 114:
            continue

        ayah = row["ayah"]
        phones = row["phones"]

        units, first = tj3.phones_to_tj3_units(
            [[p] for p in phones]
        )

        reference = []

        for i, token in enumerate(units):
            related = [
                p for k, p in enumerate(phones)
                if first[k] == i
            ]

            reference.append({
                "token": token,
                "id": tj3.INDEX[token],
                "word": related[0]["word_index"] if related else None,
                "geminated": any(
                    p.get("geminated", False)
                    for p in related
                ),
                "ghunna": [
                    p["ghunna"] for p in related
                    if "ghunna" in p
                ],
                "qalqalah": [
                    p["qalqalah"] for p in related
                    if "qalqalah" in p
                ],
                "length": [
                    p["length"] for p in related
                    if "length" in p
                ],
                "rules": list(dict.fromkeys(
                    r for p in related
                    for r in p.get("rules", [])
                    if r != "EMIT"
                ))
            })

        filename = output_dir / f"surah_{row['surah']}_ayah_{ayah}_reference.json"

        with open(filename, "w", encoding="utf-8") as out:
            json.dump({
                "surah": row["surah"],
                "ayah": ayah,
                "text": row["text"],
                "tokens": reference
            }, out, ensure_ascii=False, indent=2)

        exported += 1
        print(f"Exported Surah {row['surah']} Ayah {ayah}: {len(reference)} tokens")

with open("rulings.jsonl", encoding="utf-8") as f:
    rulings = {
        rule["rule_id"]: rule
        for line in f
        if (rule := json.loads(line)).get("rule_id")
    }

with open(output_dir / "tajweed_rules.json", "w", encoding="utf-8") as f:
    json.dump(rulings, f, ensure_ascii=False, indent=2)

print(f"\nExported {exported} Ayahs")
print(f"Exported {len(rulings)} Tajweed rules")
