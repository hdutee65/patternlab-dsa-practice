"""Create starter files and run a learner's JSON-in/JSON-out solution."""

import json
import random
import secrets
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

from .catalog import Challenge, TestCase


def starter_source(challenge: Challenge) -> str:
    sample = "\n".join("    # " + line for line in json.dumps(challenge.cases[0].input_data, indent=4).splitlines())
    return f'''"""Your solution for {challenge.title}. Keep the JSON protocol at the bottom."""
import json
import sys


def solve(data):
    # TODO: implement {challenge.title.lower()}.
    # Input example:
{sample}
    raise NotImplementedError("Write your solution here")


if __name__ == "__main__":
    payload = json.load(sys.stdin)
    print(json.dumps(solve(payload)))
'''


def create_starter(challenge: Challenge, destination: Path) -> bool:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        with destination.open("x", encoding="utf-8") as stream:
            stream.write(starter_source(challenge))
    except FileExistsError:
        return False
    return True


def _expected(challenge: Challenge, data: dict[str, Any]) -> Any:
    """Calculate expected values for generated checks using simple independent oracles."""
    if challenge.slug == "two_sum":
        nums, target = data["nums"], data["target"]
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
    elif challenge.slug == "binary_search":
        nums, target = data["nums"], data["target"]
        left, right = 0, len(nums) - 1
        while left <= right:
            middle = (left + right) // 2
            if nums[middle] == target:
                return middle
            if nums[middle] < target:
                left = middle + 1
            else:
                right = middle - 1
        return -1
    elif challenge.slug == "valid_palindrome":
        normalized = "".join(char.lower() for char in data["text"] if char.isalnum())
        return normalized == normalized[::-1]
    elif challenge.slug == "max_subarray":
        nums = data["nums"]
        best = current = nums[0]
        for value in nums[1:]:
            current = max(value, current + value)
            best = max(best, current)
        return best
    elif challenge.slug == "longest_unique_substring":
        text = data["text"]
        best = 0
        for start in range(len(text)):
            seen = set()
            for end in range(start, len(text)):
                if text[end] in seen:
                    break
                seen.add(text[end])
                best = max(best, end - start + 1)
        return best
    elif challenge.slug == "merge_sorted":
        return sorted(data["nums1"][:data["m"]] + data["nums2"][:data["n"]])
    elif challenge.slug == "valid_parentheses":
        pairs = {"(": ")", "[": "]", "{": "}"}
        stack = []
        for char in data["text"]:
            if char in pairs:
                stack.append(char)
            elif not stack or pairs[stack.pop()] != char:
                return False
        return not stack
    elif challenge.slug == "merge_sort":
        return sorted(data["nums"])
    raise ValueError(f"No generated-check oracle for {challenge.slug}")


def _generated_cases(challenge: Challenge, count: int = 6) -> list[TestCase]:
    """Make fresh cases so a solution cannot pass by matching only the listed examples."""
    rng = random.Random(secrets.randbits(64))
    cases: list[TestCase] = []
    for index in range(count):
        if challenge.slug == "two_sum":
            while True:
                nums = rng.sample(range(-40, 41), rng.randint(4, 12))
                first, second = rng.sample(range(len(nums)), 2)
                target = nums[first] + nums[second]
                if sum(nums[i] + nums[j] == target for i in range(len(nums)) for j in range(i + 1, len(nums))) == 1:
                    break
            data = {"nums": nums, "target": target}
        elif challenge.slug == "binary_search":
            nums = sorted(rng.sample(range(-60, 61), rng.randint(0, 20)))
            target = rng.choice(nums) if nums and rng.choice([True, False]) else rng.randint(-70, 70)
            data = {"nums": nums, "target": target}
        elif challenge.slug == "valid_palindrome":
            chars = "abCDefg012 ,.!?"
            data = {"text": "".join(rng.choice(chars) for _ in range(rng.randint(0, 35)))}
        elif challenge.slug == "max_subarray":
            data = {"nums": [rng.randint(-25, 25) for _ in range(rng.randint(1, 18))]}
        elif challenge.slug == "longest_unique_substring":
            data = {"text": "".join(rng.choice("abcdef gh") for _ in range(rng.randint(0, 30)))}
        elif challenge.slug == "merge_sorted":
            m, n = rng.randint(0, 14), rng.randint(0, 14)
            values = sorted(rng.randint(-30, 30) for _ in range(m))
            other = sorted(rng.randint(-30, 30) for _ in range(n))
            data = {"nums1": values + [0] * n, "m": m, "nums2": other, "n": n}
        elif challenge.slug == "valid_parentheses":
            data = {"text": "".join(rng.choice("()[]{}") for _ in range(rng.randint(0, 35)))}
        elif challenge.slug == "merge_sort":
            data = {"nums": [rng.randint(-100, 100) for _ in range(rng.randint(0, 40))]}
        else:
            raise ValueError(f"No generated cases for {challenge.slug}")
        cases.append(TestCase(f"generated check {index + 1}", data, _expected(challenge, data)))
    return cases


def run_cases(
    challenge: Challenge,
    solution_path: Path,
    timeout_seconds: float = 2.0,
    total_timeout_seconds: float = 8.0,
) -> list[dict[str, Any]]:
    if not solution_path.is_file():
        raise FileNotFoundError(f"Solution file does not exist: {solution_path}")
    if solution_path.suffix.lower() != ".py":
        raise ValueError("The runner currently accepts Python solution files (.py).")

    results: list[dict[str, Any]] = []
    cases = (*challenge.cases, *_generated_cases(challenge))
    deadline = time.monotonic() + total_timeout_seconds
    for index, case in enumerate(cases):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            results.extend({"name": pending.name, "passed": False, "detail": "Stopped after the overall run time limit"} for pending in cases[index:])
            break
        try:
            completed = subprocess.run(
                [sys.executable, "-I", str(solution_path.resolve())],
                input=json.dumps(case.input_data),
                text=True,
                capture_output=True,
                timeout=min(timeout_seconds, remaining),
                cwd=solution_path.resolve().parent,
                check=False,
            )
        except subprocess.TimeoutExpired:
            results.append({"name": case.name, "passed": False, "detail": f"Timed out after {timeout_seconds:g}s"})
            continue

        if completed.returncode != 0:
            detail = completed.stderr.strip().splitlines()
            message = detail[-1] if detail else f"Program exited with status {completed.returncode}"
            results.append({"name": case.name, "passed": False, "detail": message})
            continue
        try:
            actual = json.loads(completed.stdout)
        except json.JSONDecodeError:
            results.append({"name": case.name, "passed": False, "detail": "Expected one JSON value on stdout"})
            continue

        passed = actual == case.expected
        results.append({
            "name": case.name,
            "passed": passed,
            "detail": "Passed" if passed else f"Expected {case.expected!r}; got {actual!r}",
        })
    return results
