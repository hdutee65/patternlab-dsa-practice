"""Challenge definitions and reference results for the practice catalog."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TestCase:
    name: str
    input_data: dict[str, Any]
    expected: Any


@dataclass(frozen=True)
class Challenge:
    slug: str
    title: str
    leetcode_id: int
    difficulty: str
    source_url: str
    category: str
    prompt: str
    complexity: str
    cases: tuple[TestCase, ...]


CHALLENGES: tuple[Challenge, ...] = (
    Challenge(
        "two_sum", "Two Sum", 1, "Easy", "https://leetcode.com/problems/two-sum/", "Hash maps",
        "Return the indices of two values that add to target. Assume exactly one pair exists.",
        "Expected: O(n) time and O(n) space with a hash map.",
        (
            TestCase("basic pair", {"nums": [2, 7, 11, 15], "target": 9}, [0, 1]),
            TestCase("pair later in list", {"nums": [3, 2, 4], "target": 6}, [1, 2]),
            TestCase("duplicate values", {"nums": [3, 3], "target": 6}, [0, 1]),
            TestCase("negative values", {"nums": [-4, 8, 5, 1], "target": 6}, [2, 3]),
            TestCase("negative target", {"nums": [4, -2, 7, 1], "target": -1}, [1, 3]),
            TestCase("pair at end", {"nums": [8, 1, 6, 4], "target": 10}, [2, 3]),
        ),
    ),
    Challenge(
        "binary_search", "Binary Search", 704, "Easy", "https://leetcode.com/problems/binary-search/", "Searching",
        "Return the index of target in a sorted list, or -1 if it is not present.",
        "Expected: O(log n) time and O(1) extra space for an iterative search.",
        (
            TestCase("middle value", {"nums": [1, 3, 5, 7, 9], "target": 5}, 2),
            TestCase("first value", {"nums": [2, 4, 6, 8], "target": 2}, 0),
            TestCase("missing value", {"nums": [1, 4, 7], "target": 5}, -1),
            TestCase("empty list", {"nums": [], "target": 5}, -1),
            TestCase("one value found", {"nums": [-3], "target": -3}, 0),
            TestCase("target before range", {"nums": [2, 4, 6, 8, 10], "target": 1}, -1),
        ),
    ),
    Challenge(
        "valid_palindrome", "Valid Palindrome", 125, "Easy", "https://leetcode.com/problems/valid-palindrome/", "Strings / two pointers",
        "Return true when text reads the same forward and backward after removing non-alphanumeric characters and ignoring case.",
        "Expected: O(n) time; O(1) extra space is possible with two pointers.",
        (
            TestCase("punctuation", {"text": "A man, a plan, a canal: Panama"}, True),
            TestCase("not a palindrome", {"text": "race a car"}, False),
            TestCase("punctuation only", {"text": "..."}, True),
            TestCase("mixed case", {"text": "No lemon, no melon"}, True),
            TestCase("single letter", {"text": "Z"}, True),
            TestCase("numbers and letters", {"text": "0P"}, False),
        ),
    ),
    Challenge(
        "max_subarray", "Maximum Subarray", 53, "Medium", "https://leetcode.com/problems/maximum-subarray/", "Dynamic programming",
        "Return the largest sum of any non-empty contiguous subarray.",
        "Expected: O(n) time and O(1) extra space using a running best sum.",
        (
            TestCase("mixed values", {"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]}, 6),
            TestCase("all negative", {"nums": [-8, -3, -6]}, -3),
            TestCase("one item", {"nums": [7]}, 7),
            TestCase("all positive", {"nums": [1, 2, 3]}, 6),
            TestCase("best segment at start", {"nums": [4, 3, -8, 2]}, 7),
            TestCase("zeros around best", {"nums": [0, -1, 0, 4, 0]}, 4),
        ),
    ),
    Challenge(
        "longest_unique_substring", "Longest Substring Without Repeating Characters", 3, "Medium", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "Sliding window",
        "Return the length of the longest substring with no repeated characters.",
        "Expected: O(n) time and O(min(n, alphabet size)) space.",
        (
            TestCase("repeated pattern", {"text": "abcabcbb"}, 3),
            TestCase("all same", {"text": "bbbbb"}, 1),
            TestCase("mixed window", {"text": "pwwkew"}, 3),
            TestCase("empty text", {"text": ""}, 0),
            TestCase("repeat just outside window", {"text": "dvdf"}, 3),
            TestCase("spaces count as characters", {"text": "a b a"}, 3),
        ),
    ),
    Challenge(
        "merge_sorted", "Merge Sorted Array", 88, "Easy", "https://leetcode.com/problems/merge-sorted-array/", "Two pointers",
        "Merge nums2 into nums1 in sorted order. nums1 has m valid values followed by n empty slots. Return the completed nums1 list.",
        "Expected: O(m + n) time and O(1) extra space by filling nums1 from the end.",
        (
            TestCase("interleaved", {"nums1": [1, 2, 3, 0, 0, 0], "m": 3, "nums2": [2, 5, 6], "n": 3}, [1, 2, 2, 3, 5, 6]),
            TestCase("duplicates", {"nums1": [1, 2, 2, 0, 0], "m": 3, "nums2": [2, 3], "n": 2}, [1, 2, 2, 2, 3]),
            TestCase("empty nums1 values", {"nums1": [0, 4], "m": 0, "nums2": [0, 4], "n": 2}, [0, 4]),
            TestCase("empty nums2", {"nums1": [-2], "m": 1, "nums2": [], "n": 0}, [-2]),
            TestCase("nums2 values are smaller", {"nums1": [4, 5, 6, 0, 0, 0], "m": 3, "nums2": [1, 2, 3], "n": 3}, [1, 2, 3, 4, 5, 6]),
            TestCase("all values match", {"nums1": [2, 0], "m": 1, "nums2": [2], "n": 1}, [2, 2]),
        ),
    ),
    Challenge(
        "valid_parentheses", "Valid Parentheses", 20, "Easy", "https://leetcode.com/problems/valid-parentheses/", "Stacks",
        "Return true when every opening bracket is closed by the right type in the right order.",
        "Expected: O(n) time and O(n) space in the worst case.",
        (
            TestCase("nested", {"text": "{[()]}"}, True),
            TestCase("wrong order", {"text": "([)]"}, False),
            TestCase("early close", {"text": ")("}, False),
            TestCase("empty string", {"text": ""}, True),
            TestCase("unclosed opener", {"text": "(("}, False),
            TestCase("different bracket type", {"text": "[{]}"}, False),
        ),
    ),
    Challenge(
        "merge_sort", "Sort an Array", 912, "Medium", "https://leetcode.com/problems/sort-an-array/", "Sorting",
        "Return the input values in ascending order. Do not use a built-in sorting function.",
        "Expected: O(n log n) time and O(n) additional space.",
        (
            TestCase("mixed values", {"nums": [5, 2, 9, 1, 5, 6]}, [1, 2, 5, 5, 6, 9]),
            TestCase("duplicates", {"nums": [3, 3, 1]}, [1, 3, 3]),
            TestCase("already sorted", {"nums": [1, 2, 3]}, [1, 2, 3]),
            TestCase("empty list", {"nums": []}, []),
            TestCase("negative and zero", {"nums": [0, -4, 2, -1]}, [-4, -1, 0, 2]),
            TestCase("single number", {"nums": [12]}, [12]),
        ),
    ),
)


def get_challenge(slug: str) -> Challenge:
    for challenge in CHALLENGES:
        if challenge.slug == slug:
            return challenge
    choices = ", ".join(item.slug for item in CHALLENGES)
    raise KeyError(f"Unknown challenge '{slug}'. Choose one of: {choices}")
