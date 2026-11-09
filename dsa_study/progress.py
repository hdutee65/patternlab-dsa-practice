"""Load and save attempt history without losing the last valid progress file."""

import json
import os
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 1


def default_data_dir() -> Path:
    return Path.home() / ".dsa-self-study"


def progress_path(data_dir: Path) -> Path:
    return data_dir / "progress.json"


def load_progress(data_dir: Path) -> dict[str, Any]:
    path = progress_path(data_dir)
    if not path.exists():
        return {"schema_version": SCHEMA_VERSION, "attempts": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise ValueError(f"Could not read progress file {path}: {exc}") from exc
    if data.get("schema_version") != SCHEMA_VERSION or not isinstance(data.get("attempts"), list):
        raise ValueError(f"Unsupported or invalid progress file: {path}")
    return data


def record_attempt(
    data_dir: Path,
    *,
    slug: str,
    category: str,
    passed: int,
    total: int,
    elapsed_seconds: float,
) -> None:
    data = load_progress(data_dir)
    data["attempts"].append({
        "problem": slug,
        "category": category,
        "passed": passed,
        "total": total,
        "accepted": passed == total,
        "elapsed_seconds": round(elapsed_seconds, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    data_dir.mkdir(parents=True, exist_ok=True)
    destination = progress_path(data_dir)
    fd, temporary_name = tempfile.mkstemp(prefix="progress-", suffix=".tmp", dir=data_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary_name, destination)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def summarize(data: dict[str, Any]) -> tuple[dict[str, dict[str, int]], int, float | None]:
    grouped: dict[str, dict[str, int]] = defaultdict(lambda: {"attempts": 0, "accepted": 0})
    accepted_times: list[float] = []
    for attempt in data["attempts"]:
        group = grouped[attempt["category"]]
        group["attempts"] += 1
        group["accepted"] += int(bool(attempt["accepted"]))
        if attempt["accepted"]:
            accepted_times.append(float(attempt["elapsed_seconds"]))
    total = len(data["attempts"])
    average = sum(accepted_times) / len(accepted_times) if accepted_times else None
    return dict(grouped), total, average
