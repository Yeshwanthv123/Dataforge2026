/* TRACE: same Python model and trained weights as Docker, executed by Pyodide.
 * The public build copies a pinned runtime here. No experiment data leaves this worker.
 */
let runtime;
async function initialize() {
  importScripts("runtime/pyodide.js");
  const py = await loadPyodide({ indexURL: new URL("runtime/", self.location.href).href });
  await py.loadPackage(["numpy", "pydantic"]);
  py.FS.mkdirTree("/trace/app");
  py.FS.mkdirTree("/trace/artifacts");
  for (const [source, target] of [
    ["python/model.py", "/trace/app/model.py"],
    ["python/artifacts/decoder.npz", "/trace/artifacts/decoder.npz"],
    ["python/artifacts/metrics.json", "/trace/artifacts/metrics.json"],
  ]) {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Missing public model file: " + source);
    py.FS.writeFile(target, new Uint8Array(await response.arrayBuffer()));
  }
  await py.runPythonAsync(`
import sys, json, hashlib
sys.path.insert(0, '/trace/app')
from model import Experiment, MemoryModel
trace_model = MemoryModel()
with open('/trace/artifacts/decoder.npz', 'rb') as weights:
    assert hashlib.sha256(weights.read()).hexdigest() == trace_model.metrics['sha256'], 'Model checksum mismatch'
`);
  return py;
}
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  // Run requests in order. Every experiment starts with a fresh memory state.
  queue = queue.then(async () => {
    try {
      runtime ??= initialize().catch(error => { runtime = undefined; throw error; });
      const py = await runtime;
      py.globals.set("trace_input_json", JSON.stringify(data.config));
      const result = await py.runPythonAsync("json.dumps(trace_model.run(Experiment.model_validate_json(trace_input_json)))");
      self.postMessage({ id: data.id, result: JSON.parse(result) });
    } catch (error) {
      self.postMessage({ id: data.id, error: "Python experiment failed: " + String(error.message || error) });
    }
  });
};
