import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Core algorithm implementations ported from the Python practice catalog. */
public final class DsaSolutions {
    private DsaSolutions() {}

    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] {seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }

    public static int binarySearch(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int middle = left + (right - left) / 2;
            if (nums[middle] == target) return middle;
            if (nums[middle] < target) left = middle + 1;
            else right = middle - 1;
        }
        return -1;
    }

    public static boolean validParentheses(String text) {
        Map<Character, Character> pairs = Map.of('(', ')', '[', ']', '{', '}');
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : text.toCharArray()) {
            if (pairs.containsKey(ch)) {
                stack.push(ch);
            } else {
                if (stack.isEmpty() || pairs.get(stack.pop()) != ch) return false;
            }
        }
        return stack.isEmpty();
    }

    public static int[] mergeSort(int[] values) {
        if (values.length <= 1) return values.clone();
        int middle = values.length / 2;
        int[] left = new int[middle];
        int[] right = new int[values.length - middle];
        System.arraycopy(values, 0, left, 0, left.length);
        System.arraycopy(values, middle, right, 0, right.length);
        return merge(mergeSort(left), mergeSort(right));
    }

    private static int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            result[k++] = left[i] <= right[j] ? left[i++] : right[j++];
        }
        while (i < left.length) result[k++] = left[i++];
        while (j < right.length) result[k++] = right[j++];
        return result;
    }
}
