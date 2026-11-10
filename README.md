# PatternLab — DSA Practice

PatternLab is a data structures and algorithms practice app with a recruiter-friendly browser interface and a Python command-line version. The browser site links each challenge to its official LeetCode page and runs Python (Pyodide) and JavaScript (a dedicated Web Worker) locally in your browser. C++, Java, and TypeScript open the official LeetCode compiler for each challenge. It has no code-execution backend.

The browser site has separate Home, Practice, Patterns, and Progress pages with normal links between them. The Patterns page lists 107 LeetCode problems grouped by technique: 22 have a local Python/JavaScript editor with automated checks, and the remaining 85 link directly to LeetCode with a short study focus. Drafts, attempts, hints, and reflections for the guided problems stay in the current browser by default. Optional cross-device accounts use Supabase Auth and a row-level-security protected progress table. Account sync stays unavailable until a Supabase project URL and publishable key are configured; setup is documented in [`docs/cloud-accounts.md`](docs/cloud-accounts.md) and at the site’s Account Setup page. Never put a Supabase secret/service-role key in frontend code.

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

## Guided challenges

The browser editor currently supports 22 guided problems with sample cases, generated checks, hints, and saved notes. The Patterns page adds 85 more LeetCode exercises with concise study cues and direct links. Those 85 are a roadmap, not locally auto-graded challenges.

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
| `contains_duplicate` | [#217 Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | Sets and hash maps |
| `valid_anagram` | [#242 Valid Anagram](https://leetcode.com/problems/valid-anagram/) | Sets and hash maps |
| `best_time_stock` | [#121 Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Arrays and running state |
| `product_except_self` | [#238 Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | Arrays and running state |
| `move_zeroes` | [#283 Move Zeroes](https://leetcode.com/problems/move-zeroes/) | Arrays and two pointers |
| `search_insert` | [#35 Search Insert Position](https://leetcode.com/problems/search-insert-position/) | Binary search |
| `reverse_list` | [#206 Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/) | Linked lists |
| `merge_two_lists` | [#21 Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) | Linked lists |
| `daily_temperatures` | [#739 Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | Stacks |
| `number_of_islands` | [#200 Number of Islands](https://leetcode.com/problems/number-of-islands/) | Graphs and grid traversal |
| `climbing_stairs` | [#70 Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) | Dynamic programming |
| `coin_change` | [#322 Coin Change](https://leetcode.com/problems/coin-change/) | Dynamic programming |
| `merge_intervals` | [#56 Merge Intervals](https://leetcode.com/problems/merge-intervals/) | Sorting and intervals |
| `max_depth` | [#104 Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Trees and recursion |

## Language support

The local editor and check runner support Python and JavaScript using the same `solve(data)` input/output contract. C++, Java, and TypeScript are offered as language choices that open the matching LeetCode problem, where the official compiler and function signature are available.

## How checking works

Every local run executes the code from the editor in a dedicated browser worker. It is checked against the listed examples plus six newly generated inputs. Expected values are calculated independently for each generated case. The sample/reference solutions in `solutions/` are separate study examples and are not used to answer submissions.

The browser-side worker keeps candidate code out of a server. The separate Python CLI and local web API are for local practice only; do not expose `dsa_study.web_app` publicly, because it executes code with the host user's permissions.
