
import json
import sys
from pathlib import Path

sys.path.insert(0, "quran-g2p/src")
from quran_g2p import tokenlayer_tj3 as tj3

out = Path("public")
out.mkdir(exist_ok=True)

found = set()

with open("quran_phonetics.jsonl", encoding="utf-8") as source:
    for line in source:
        row = json.loads(line)

        if row.get("surah") != 113 or row.get("ayah") not in range(1, 6):
            continue

        ayah = row["ayah"]
        phones = row["phones"]
        units, first = tj3.phones_to_tj3_units([[p] for p in phones])

        reference = []

        for i, token in enumerate(units):
            related = [
                p for k, p in enumerate(phones)
                if first[k] == i
            ]

            reference.append({
                "token": token,
                "id": tj3.INDEX[token],
                "word": related[0].get("word_index") if related else None,
                "geminated": any(p.get("geminated", False) for p in related),
                "ghunna": [p["ghunna"] for p in related if "ghunna" in p],
                "qalqalah": [p["qalqalah"] for p in related if "qalqalah" in p],
                "length": [p["length"] for p in related if "length" in p],
                "rules": list(dict.fromkeys(
                    r for p in related
                    for r in p.get("rules", [])
                    if r != "EMIT"
                ))
            })

        target = out / f"falaq_{ayah}_reference.json"

        target.write_text(
            json.dumps({
                "surah": 113,
                "ayah": ayah,
                "text": row["text"],
                "tokens": reference
            }, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )

        found.add(ayah)

        sites = [
            (i, t["token"], t["qalqalah"])
            for i, t in enumerate(reference)
            if t["qalqalah"]
        ]

        print(f"{target}: Qalqalah sites = {sites}")

if len(found) != 5:
    raise RuntimeError(f"Expected 5 ayahs, found {sorted(found)}")

print("Surah Al-Falaq exported successfully!")
