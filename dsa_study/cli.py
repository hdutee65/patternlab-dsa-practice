"""Command-line entry point for the DSA Self-Study Tool."""

import argparse
import sys
import time
from pathlib import Path

from .catalog import CHALLENGES, get_challenge
from .progress import default_data_dir, load_progress, record_attempt, summarize
from .runner import create_starter, run_cases


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="dsa-study", description="Practice algorithm patterns and track your progress.")
    parser.add_argument("--data-dir", type=Path, default=default_data_dir(), help="where progress.json is stored")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list", help="list problems and categories")
    show = commands.add_parser("show", help="show a problem prompt and sample cases")
    show.add_argument("problem")
    new = commands.add_parser("new", help="create a Python starter file")
    new.add_argument("problem")
    new.add_argument("--solution", type=Path, help="file to create; defaults to solutions/python/<problem>.py")
    practice = commands.add_parser("practice", help="time an attempt and run its test cases")
    practice.add_argument("problem")
    practice.add_argument("--solution", type=Path, help="Python file implementing solve(data)")
    commands.add_parser("progress", help="show saved category accuracy and attempt history")
    return parser


def _list_problems() -> None:
    print(f"{'PROBLEM':30} {'CATEGORY':27} TITLE")
    print("-" * 88)
    for challenge in CHALLENGES:
        print(f"{challenge.slug:30} {challenge.category:27} {challenge.title}")


def _show_problem(slug: str) -> None:
    challenge = get_challenge(slug)
    print(f"\n{challenge.title}  |  {challenge.category}")
    print(f"\n{challenge.prompt}\n")
    print(challenge.complexity)
    print("\nCases used by the checker:")
    for case in challenge.cases:
        print(f"  • {case.name}: input={case.input_data!r}; expected={case.expected!r}")


def _create(slug: str, solution: Path | None) -> int:
    challenge = get_challenge(slug)
    destination = solution or Path("solutions/python") / f"{challenge.slug}.py"
    created = create_starter(challenge, destination)
    print(("Created" if created else "File already exists; left unchanged:") + f" {destination}")
    if created:
        print("Edit solve(data), then run practice with --solution to check it.")
    return 0


def _practice(slug: str, solution: Path | None, data_dir: Path) -> int:
    challenge = get_challenge(slug)
    path = solution or Path("solutions/python") / f"{challenge.slug}.py"
    if not path.is_file():
        created = create_starter(challenge, path)
        print(f"Created starter file: {path}")
        print("Implement solve(data), then run this command again.")
        return 0 if created else 2

    _show_problem(slug)
    input("\nPress Enter when you are ready to start the timer. Edit the solution in another window, then return here. ")
    started = time.monotonic()
    input("\nPress Enter after saving your solution to run the cases. ")
    elapsed = time.monotonic() - started

    try:
        results = run_cases(challenge, path)
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    passed = sum(result["passed"] for result in results)
    for result in results:
        mark = "PASS" if result["passed"] else "FAIL"
        print(f"{mark:4}  {result['name']}: {result['detail']}")
    print(f"\nResult: {passed}/{len(results)} cases passed in {elapsed:.1f}s.")
    record_attempt(
        data_dir,
        slug=challenge.slug,
        category=challenge.category,
        passed=passed,
        total=len(results),
        elapsed_seconds=elapsed,
    )
    if passed == len(results):
        print("Accepted. Review the time and space complexity before moving on.")
        return 0
    print("Not accepted yet. Fix the failing cases and try again.")
    return 1


def _progress(data_dir: Path) -> None:
    data = load_progress(data_dir)
    grouped, total, average = summarize(data)
    print(f"Attempts: {total}")
    print(f"Accepted-attempt average time: {average:.1f}s" if average is not None else "Accepted-attempt average time: n/a")
    print("\nCategory accuracy (accepted attempts / total attempts):")
    if not grouped:
        print("  No attempts saved yet. Start with: python -m dsa_study practice two_sum")
    for category, counts in sorted(grouped.items()):
        percentage = counts["accepted"] / counts["attempts"] * 100
        print(f"  {category:27} {counts['accepted']:>3}/{counts['attempts']:<3}  {percentage:5.1f}%")
    if data["attempts"]:
        print("\nRecent attempts:")
        for attempt in data["attempts"][-5:][::-1]:
            state = "accepted" if attempt["accepted"] else "incomplete"
            print(f"  {attempt['timestamp'][:10]}  {attempt['problem']:27} {state:10} {attempt['passed']}/{attempt['total']}  {attempt['elapsed_seconds']:.1f}s")


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.command == "list":
            _list_problems()
        elif args.command == "show":
            _show_problem(args.problem)
        elif args.command == "new":
            return _create(args.problem, args.solution)
        elif args.command == "practice":
            return _practice(args.problem, args.solution, args.data_dir)
        elif args.command == "progress":
            _progress(args.data_dir)
    except (KeyError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    return 0
