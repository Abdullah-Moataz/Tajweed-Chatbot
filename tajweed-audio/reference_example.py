# reference_example.py: the reference for one ayah, joined to the model's expected units.
#   python reference_example.py 1 1             each unit with its phones, their rules, and the rules' sources
#   python reference_example.py R185_MUTTASIL   one ruling: its row of rulings.jsonl and its reviewed rows
# Beside this file: a clone of quran-g2p, and rulings.jsonl, quran_phonetics.jsonl and register_reviewed.jsonl
# from the dataset. The ruling mode also needs pyyaml (pip install pyyaml).
import glob, json, sys
sys.path.insert(0, "quran-g2p/src")
from quran_g2p import tokenlayer_tj3 as tj3

def rows(name):
    with open(name, encoding="utf-8") as f:
        yield from map(json.loads, f)

rulings = {r["rule_id"]: r for r in rows("rulings.jsonl")}

def ayah(surah, number):
    row = next(r for r in rows("quran_phonetics.jsonl") if (r["surah"], r["ayah"]) == (surah, number))
    phones = row["phones"]
    units, first = tj3.phones_to_tj3_units([[p] for p in phones])  # first[k]: the unit phone k became
    print(row["text"])
    print("ids", [tj3.INDEX[u] for u in units])                      # what model.reference gives for the ayah
    named = []
    for i, u in enumerate(units):
        mine = [p for k, p in enumerate(phones) if first[k] == i]
        if not mine:                                                  # "|", the word boundary
            continue
        rules = list(dict.fromkeys(r for p in mine for r in p.get("rules", []) if r != "EMIT"))
        marks = ["geminated" for p in mine if p["geminated"]]
        marks += [f"{k} {p[k]}" for p in mine for k in ("ghunna", "qalqalah") if k in p]
        marks += [f"length {p['length']['allowed']}" for p in mine if "length" in p]
        print(f"{i:3} {tj3.INDEX[u]:2} {u:3} word {mine[0]['word_index']}", "+".join(p["base"] for p in mine), *marks, *rules)
        named += [r for r in rules if r not in named]
    for r in named:
        print(r, "|", rulings[r]["name_ar"], "|", rulings[r]["name_en"], "|", rulings[r]["citation"])

def ruling(rule_id):
    import yaml
    from quran_g2p.rules.registry import COVERAGE                     # the golden rows put before the reviewers
    print(json.dumps(rulings[rule_id], ensure_ascii=False))
    golden = {g["id"]: g for f in glob.glob("quran-g2p/tests/goldens/*.yaml")
              for g in yaml.safe_load(open(f, encoding="utf-8")) or []}
    sites = {(golden[g]["surah"], golden[g]["ayah"], golden[g]["rule"]) for g in COVERAGE[rule_id]}
    for r in rows("register_reviewed.jsonl"):
        if (r["surah"], r["ayah"], r["rule_id"]) in sites:
            print("row", r["row"], f"{r['surah']}:{r['ayah']}", r["rule_id"], "|", r["ruling_ar"], "|", r["review_verdict"])

if sys.argv[1].startswith("R"):
    ruling(sys.argv[1])
else:
    ayah(int(sys.argv[1]), int(sys.argv[2]))