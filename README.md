# PatternLab — DSA Practice

PatternLab is a data structures and algorithms practice app with a recruiter-friendly browser interface and a Python command-line version. The browser site links each challenge to its official LeetCode page and runs submitted Python locally in a Web Worker powered by Pyodide. It has no code-execution backend: your solution, draft, and progress stay in your browser.

## Open the live app

The live app is at <https://hdutee65.github.io/patternlab-dsa-practice/>. The `site/` folder is deployed through GitHub Pages using `.github/workflows/deploy-pages.yml`; pushes to `main` publish updates. Python downloads from the official Pyodide distribution on first load, so the browser needs internet access.

To preview locally:

```bash
python3 -m http.server 8001 --directory site
```

Open <http://127.0.0.1:8001>.

## Student developer offers

See [`site/student-perks.html`](site/student-perks.html) for official student programs, including the GitHub Student Developer Pack, current Azure for Students terms, and free learning resources. My Azure for Students subscription currently shows Disabled, so this project uses free static hosting and does not upgrade or incur Azure charges.

## Command-line version

Requires Python 3.10 or newer. From this folder:

```bash
python3 -m dsa_study list
python3 -m dsa_study show two_sum
python3 -m dsa_study new two_sum
python3 -m dsa_study practice two_sum
python3 -m dsa_study progress
```

A solution is a Python file with `solve(data)`. The runner passes one JSON object on standard input and expects one JSON value on standard output. Progress is saved locally under `~/.dsa-self-study/`.

## Challenges

| Slug | LeetCode | Pattern |
| --- | --- | --- |
| `two_sum` | [#1 Two Sum](https://leetcode.com/problems/two-sum/) | Hash maps |
| `binary_search` | [#704 Binary Search](https://leetcode.com/problems/binary-search/) | Searching |
| `valid_palindrome` | [#125 Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | Strings / two pointers |
| `max_subarray` | [#53 Maximum Subarray](https://leetcode.com/problems/maximum-subarray/) | Dynamic programming |
| `longest_unique_substring` | [#3 Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Sliding window |
| `merge_sorted` | [#88 Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/) | Two pointers |
| `valid_parentheses` | [#20 Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Stacks |
| `merge_sort` | [#912 Sort an Array](https://leetcode.com/problems/sort-an-array/) | Sorting |

## How checking works

Every run executes the code from the editor. It is checked against the listed examples plus six newly generated inputs. Expected values are calculated independently for each generated case. The sample/reference solutions in `solutions/` are separate study examples and are not used to answer submissions.

The browser-side worker keeps candidate code out of a server. The separate Python CLI and local web API are for local practice only; do not expose `dsa_study.web_app` publicly, because it executes code with the host user's permissions.
