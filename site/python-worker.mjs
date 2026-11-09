import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

const pyodideReady = loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/" });
pyodideReady.then(
  () => self.postMessage({ready:true}),
  (error) => self.postMessage({ready_error:String(error)})
);

self.onmessage = async ({ data }) => {
  const { runId, code, testCase, index } = data;
  try {
    const pyodide = await pyodideReady;
    pyodide.globals.set("PATTERNLAB_CODE", code);
    pyodide.globals.set("PATTERNLAB_INPUT", JSON.stringify(testCase.input));
    const actual = pyodide.runPython(`
import json
namespace = {"__name__": "__patternlab_solution__"}
exec(compile(PATTERNLAB_CODE, "<solution>", "exec"), namespace)
if "solve" not in namespace or not callable(namespace["solve"]):
    raise TypeError("Define solve(data) and return one JSON-compatible value")
json.dumps(namespace["solve"](json.loads(PATTERNLAB_INPUT)), separators=(",", ":"), ensure_ascii=False)
`);
    self.postMessage({ runId, index, actual: String(actual) });
  } catch (error) {
    self.postMessage({ runId, index, error: String(error).split("\n").slice(-1)[0] });
  }
};
