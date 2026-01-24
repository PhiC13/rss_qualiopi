import json
from datetime import datetime

LOG_FILE = "logs.jsonl"

def log_json(level, event, **kwargs):
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "level": level,
        "event": event,
        **kwargs
    }

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
