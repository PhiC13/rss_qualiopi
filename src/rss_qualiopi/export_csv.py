import json
import csv

LOG_FILE = "logs.jsonl"
CSV_FILE = "logs.csv"

def export_logs_to_csv():
    rows = []

    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            try:
                entry = json.loads(line)
                rows.append(entry)
            except json.JSONDecodeError:
                continue

    if not rows:
        print("Aucun log à exporter.")
        return

    # Colonnes dynamiques (tous les champs rencontrés)
    fieldnames = sorted({key for row in rows for key in row.keys()})

    with open(CSV_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Export CSV terminé : {CSV_FILE}")
