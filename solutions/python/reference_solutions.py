"""Reference implementations for every challenge in the catalog."""


def two_sum(data):
    seen = {}
    for index, value in enumerate(data["nums"]):
        complement = data["target"] - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    return []


def binary_search(data):
    nums, target = data["nums"], data["target"]
    left, right = 0, len(nums) - 1
    while left <= right:
        middle = left + (right - left) // 2
        if nums[middle] == target:
            return middle
        if nums[middle] < target:
            left = middle + 1
        else:
            right = middle - 1
    return -1


def valid_palindrome(data):
    chars = [char.lower() for char in data["text"] if char.isalnum()]
    left, right = 0, len(chars) - 1
    while left < right:
        if chars[left] != chars[right]:
            return False
        left += 1
        right -= 1
    return True


def max_subarray(data):
    best = current = data["nums"][0]
    for value in data["nums"][1:]:
        current = max(value, current + value)
        best = max(best, current)
    return best


def longest_unique_substring(data):
    last_seen = {}
    left = best = 0
    for right, char in enumerate(data["text"]):
        if char in last_seen and last_seen[char] >= left:
            left = last_seen[char] + 1
        last_seen[char] = right
        best = max(best, right - left + 1)
    return best


def merge_sorted(data):
    nums1, m = data["nums1"], data["m"]
    nums2, n = data["nums2"], data["n"]
    i, j, write = m - 1, n - 1, m + n - 1
    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[write] = nums1[i]
            i -= 1
        else:
            nums1[write] = nums2[j]
            j -= 1
        write -= 1
    return nums1


def valid_parentheses(data):
    opening = {"(": ")", "[": "]", "{": "}"}
    stack = []
    for char in data["text"]:
        if char in opening:
            stack.append(char)
        elif not stack or opening[stack.pop()] != char:
            return False
    return not stack


def merge_sort(data):
    def sort(values):
        if len(values) <= 1:
            return values
        middle = len(values) // 2
        left, right = sort(values[:middle]), sort(values[middle:])
        result, i, j = [], 0, 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        result.extend(left[i:])
        result.extend(right[j:])
        return result

    return sort(data["nums"])
