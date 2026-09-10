import type { Config, Result, Saved } from "./types";

// This adapter is selected only by the public static build. Docker still calls FastAPI.
// Computation runs the unchanged backend/app/model.py in a Python Web Worker.
const root = import.meta.env.BASE_URL;
let worker: Worker | undefined;
let serial = 0;
type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; clean: () => void };
const pending = new Map<number, Pending>();

function compute(config: unknown, signal?: AbortSignal): Promise<Result> {
  if (!worker) {
    worker = new Worker(root + "python-worker.js");
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.id);
      if (!task) return;
      task.clean();
      pending.delete(data.id);
      if (data.error) task.reject(new Error(data.error));
      else task.resolve(data.result);
    };
    worker.onerror = () => {
      for (const task of pending.values()) {
        task.clean();
        task.reject(new Error("Python could not start. Reload the page to retry the runtime download."));
      }
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const currentWorker = worker;
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const abort = () => {
      pending.get(id)?.clean();
      pending.delete(id);
      reject(new DOMException("Request cancelled", "AbortError"));
    };
    if (signal?.aborted) return abort();
    const timer = window.setTimeout(() => {
      pending.get(id)?.clean();
      pending.delete(id);
      reject(new Error("Python is taking too long to load. Check your connection and retry."));
    }, 120000);
    pending.set(id, { resolve: (v) => resolve(v as Result), reject, clean: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }});
    signal?.addEventListener("abort", abort, { once: true });
    currentWorker.postMessage({ id, config });
  });
}

const notebookKey = "trace-public-notebook-v1";
const progressKey = "trace-public-progress-v1";
type Entry = Saved & { result: Result };
function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw) as T; }
  catch { throw new Error("Browser notebook data could not be read. Export or clear this site's storage to reset it."); }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error("This browser could not save the notebook. Allow site storage or export the experiment as JSON."); }
}

export async function publicApi<T>(path: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
  let value: unknown;
  if (path === "/auth/me") throw new Error("This public demo does not use accounts.");
  else if (path === "/experiments/run" && method === "POST") value = await compute(body, signal);
  else if (path === "/model") {
    const response = await fetch(root + "python/artifacts/metrics.json", { signal });
    if (!response.ok) throw new Error("Model evidence could not be loaded.");
    value = await response.json();
  } else if (path === "/progress") {
    if (method === "PUT") save(progressKey, body);
    value = read(progressKey, { completed: [] });
  } else if (path === "/experiments" && method === "GET") value = read<Entry[]>(notebookKey, []).map(({ result: _result, ...entry }) => entry);
  else if (path === "/experiments" && method === "POST") {
    const input = body as { name: string; config: Config };
    if (!input.name?.trim() || input.name.trim().length > 80) throw new Error("Use a notebook title between 1 and 80 characters.");
    const result = await compute(input.config, signal);
    const entries = read<Entry[]>(notebookKey, []);
    if (entries.length >= 100) throw new Error("This browser notebook holds 100 experiments. Export and remove an older one first.");
    const entry: Entry = { id: Math.max(Date.now(), ...entries.map(e => e.id + 1)), name: input.name.trim(), config: result.config, result, created_at: new Date().toISOString().slice(0,-1) };
    save(notebookKey, [entry, ...entries]);
    value = entry;
  } else if (/^\/experiments\/\d+$/.test(path)) {
    const id = Number(path.split("/").at(-1));
    const entries = read<Entry[]>(notebookKey, []);
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error("This experiment is no longer in the browser notebook.");
    if (method === "DELETE") { save(notebookKey, entries.filter(e => e.id !== id)); value = { ok: true }; }
    else value = entry;
  } else throw new Error("Account features are available in the Docker edition. The public lab needs no sign-in.");
  return value as T;
}
