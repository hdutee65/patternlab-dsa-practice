"""Local web interface for the DSA practice tool."""

import json
import math
import os
import tempfile
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .catalog import CHALLENGES, get_challenge
from .progress import default_data_dir, load_progress, record_attempt, summarize
from .runner import run_cases, starter_source


WEB_DIR = Path(__file__).parent / "web"
MAX_REQUEST_BYTES = 64_000
MAX_CODE_CHARS = 24_000


def _challenge_payload(challenge):
    return {
        "slug": challenge.slug,
        "title": challenge.title,
        "leetcode_id": challenge.leetcode_id,
        "difficulty": challenge.difficulty,
        "source_url": challenge.source_url,
        "category": challenge.category,
        "prompt": challenge.prompt,
        "complexity": challenge.complexity,
        "sample_input": challenge.cases[0].input_data,
        "sample_output": challenge.cases[0].expected,
        "test_count": len(challenge.cases) + 6,
        "starter": starter_source(challenge),
    }


def _progress_payload(data_dir: Path):
    data = load_progress(data_dir)
    grouped, attempts, average = summarize(data)
    accepted = sum(bool(item["accepted"]) for item in data["attempts"])
    return {
        "attempts": attempts,
        "accepted": accepted,
        "accuracy": accepted / attempts if attempts else 0,
        "average_seconds": average,
        "categories": grouped,
        "recent": list(reversed(data["attempts"][-5:])),
    }


def make_handler(data_dir: Path):
    class Handler(BaseHTTPRequestHandler):
        server_version = "PatternLab/1.0"

        def _send(self, status: int, payload, content_type="application/json; charset=utf-8"):
            body = payload if isinstance(payload, bytes) else json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

        def _json_error(self, status: int, message: str):
            self._send(status, {"error": message})

        def do_GET(self):
            url = urlparse(self.path)
            if url.path == "/api/challenges":
                data = load_progress(data_dir)
                accepted_slugs = {item["problem"] for item in data["attempts"] if item["accepted"]}
                self._send(200, [
                    {
                        "slug": challenge.slug,
                        "title": challenge.title,
                        "leetcode_id": challenge.leetcode_id,
                        "difficulty": challenge.difficulty,
                        "source_url": challenge.source_url,
                        "category": challenge.category,
                        "solved": challenge.slug in accepted_slugs,
                    }
                    for challenge in CHALLENGES
                ])
                return
            if url.path == "/api/challenge":
                slug = parse_qs(url.query).get("slug", [""])[0]
                try:
                    self._send(200, _challenge_payload(get_challenge(slug)))
                except KeyError as exc:
                    self._json_error(404, str(exc))
                return
            if url.path == "/api/progress":
                try:
                    self._send(200, _progress_payload(data_dir))
                except ValueError as exc:
                    self._json_error(500, str(exc))
                return

            assets = {
                "/": ("index.html", "text/html; charset=utf-8"),
                "/styles.css": ("styles.css", "text/css; charset=utf-8"),
                "/app.js": ("app.js", "text/javascript; charset=utf-8"),
            }
            asset = assets.get(url.path)
            if not asset:
                self._json_error(404, "Page not found")
                return
            filename, content_type = asset
            try:
                content = (WEB_DIR / filename).read_bytes()
            except OSError:
                self._json_error(500, "Web interface files are missing")
                return
            self._send(200, content, content_type)

        def do_POST(self):
            if urlparse(self.path).path != "/api/run":
                self._json_error(404, "Endpoint not found")
                return
            try:
                size = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._json_error(400, "Invalid content length")
                return
            if size <= 0 or size > MAX_REQUEST_BYTES:
                self._json_error(413, "Request must contain less than 64 KB of JSON")
                return
            try:
                body = json.loads(self.rfile.read(size))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self._json_error(400, "Request body must be valid JSON")
                return
            if not isinstance(body, dict) or not isinstance(body.get("code"), str):
                self._json_error(400, "Include a string field named code")
                return
            code = body["code"]
            if not code.strip() or len(code) > MAX_CODE_CHARS:
                self._json_error(400, "Solution must contain code and stay below 24,000 characters")
                return
            try:
                challenge = get_challenge(str(body.get("slug", "")))
            except KeyError as exc:
                self._json_error(404, str(exc))
                return
            try:
                raw_elapsed = float(body.get("elapsed_seconds", 0))
            except (TypeError, ValueError):
                self._json_error(400, "elapsed_seconds must be a number")
                return
            if not math.isfinite(raw_elapsed):
                self._json_error(400, "elapsed_seconds must be finite")
                return
            elapsed = max(0.0, min(raw_elapsed, 7 * 24 * 60 * 60))

            try:
                with tempfile.TemporaryDirectory(prefix="dsa-study-") as temporary_dir:
                    candidate = Path(temporary_dir) / "solution.py"
                    candidate.write_text(code, encoding="utf-8")
                    results = run_cases(challenge, candidate)
                passed = sum(result["passed"] for result in results)
                record_attempt(
                    data_dir,
                    slug=challenge.slug,
                    category=challenge.category,
                    passed=passed,
                    total=len(results),
                    elapsed_seconds=elapsed,
                )
                self._send(200, {
                    "results": results,
                    "passed": passed,
                    "total": len(results),
                    "accepted": passed == len(results),
                    "elapsed_seconds": round(elapsed, 1),
                    "progress": _progress_payload(data_dir),
                })
            except (OSError, ValueError) as exc:
                self._json_error(500, f"Could not run or save this attempt: {exc}")

        def log_message(self, format_string, *args):
            print(f"[PatternLab] {self.address_string()} - {format_string % args}")

    return Handler


def main(argv=None):
    import argparse

    parser = argparse.ArgumentParser(description="Run the DSA Self-Study web interface on this computer.")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--data-dir", type=Path, default=Path(os.environ.get("DSA_STUDY_DATA_DIR", default_data_dir())))
    parser.add_argument("--no-browser", action="store_true", help="start without opening a browser window")
    args = parser.parse_args(argv)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(args.data_dir))
    url = f"http://127.0.0.1:{args.port}"
    print(f"PatternLab is running at {url}")
    print("Keep this terminal open. Press Ctrl+C to stop the server.")
    try:
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except Exception as exc:
                print(f"Could not open a browser automatically: {exc}")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPatternLab stopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
