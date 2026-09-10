import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  FlaskConical,
  GitBranch,
  Layers3,
  LogOut,
  Menu,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api, PUBLIC_DEMO } from "./api";
import type { Config, Metrics, Result, Saved, Step, User } from "./types";
import "./style.css";

const keys = [
  "Atlas",
  "Birch",
  "Coral",
  "Drift",
  "Ember",
  "Fern",
  "Grove",
  "Halo",
];
const values = [
  "Amber",
  "Mint",
  "Violet",
  "Rose",
  "Sky",
  "Lime",
  "Peach",
  "Pearl",
];
const colors = [
  "#e8b96b",
  "#74d2b0",
  "#b49be5",
  "#e594ac",
  "#80b7e9",
  "#bddb79",
  "#edac8c",
  "#dbe2e9",
];
const base: Config = {
  pairs: [
    { key: 0, value: 0 },
    { key: 1, value: 1 },
    { key: 2, value: 2 },
    { key: 3, value: 3 },
  ],
  query: 0,
  retention: 1,
  overlap: 0,
  noise: 0,
  strength: 1,
  rule: "hebbian",
  seed: 42,
};
const presets = [
  { name: "Clean recall", desc: "Distinct cues, clear memories", config: base },
  {
    name: "Memory collision",
    desc: "One cue, two competing answers",
    config: {
      ...base,
      pairs: [
        { key: 0, value: 0 },
        { key: 0, value: 0 },
        { key: 0, value: 2 },
      ],
    },
  },
  {
    name: "Interference",
    desc: "Similar cues compete for space",
    config: {
      ...base,
      overlap: 0.85,
      pairs: [
        { key: 0, value: 0 },
        { key: 1, value: 2 },
        { key: 2, value: 2 },
        { key: 3, value: 2 },
      ],
    },
  },
  {
    name: "Fading trace",
    desc: "New writes weaken old memories",
    config: { ...base, retention: 0.35, overlap: 0.35 },
  },
];
const nav = [
  { id: "lab", label: "Memory lab", icon: FlaskConical },
  { id: "learn", label: "Guided journey", icon: BookOpen },
  { id: "bdh", label: "Inside BDH", icon: GitBranch },
  { id: "evidence", label: "Model & evidence", icon: Activity },
  { id: "notebook", label: "My notebook", icon: Bookmark },
];
const pct = (n: number) => `${Math.round(n * 100)}%`;
function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <i />
        <i />
        <i />
      </span>
      trace<span className="brand-dot">.</span>
    </div>
  );
}
function Tag({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"tag " + tone}>{children}</span>;
}
function download(data: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "lab");
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [config, setConfig] = useState<Config>(base);
  const [result, setResult] = useState<Result | null>(null);
  const [step, setStep] = useState(4);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [playing, setPlaying] = useState(false);
  const [preset, setPreset] = useState("Clean recall");
  const [saveOpen, setSaveOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [complete, setComplete] = useState<number[]>([]);
  function go(id: string) {
    setPage(id);
    location.hash = id;
    setMobile(false);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    const f = () => setPage(location.hash.slice(1) || "lab");
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user || PUBLIC_DEMO)
      api<{ completed: number[] }>("/progress")
        .then((p) => setComplete(p.completed))
        .catch(() => {});
    else setComplete([]);
  }, [user]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setPlaying(false);
    const t = setTimeout(() => {
      api<Result>("/experiments/run", "POST", config, controller.signal)
        .then((r) => {
          setResult(r);
          setStep(r.steps.length - 1);
          setBusy(false);
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            setError(
              e.message === "Failed to fetch"
                ? "The lab could not reach the API. Check that the backend is running, then retry."
                : e.message,
            );
            setBusy(false);
          }
        });
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [config, retry]);
  useEffect(() => {
    if (!playing || !result) return;
    const t = setInterval(
      () =>
        setStep((s) => {
          if (s >= result.steps.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      900,
    );
    return () => clearInterval(t);
  }, [playing, result]);
  function update(p: Partial<Config>) {
    setConfig((c) => ({ ...c, ...p }));
    setPreset("Custom experiment");
  }
  function load(p: (typeof presets)[number]) {
    setConfig(structuredClone(p.config));
    setPreset(p.name);
  }
  async function logout() {
    try {
      await api("/auth/logout", "POST");
      setUser(null);
      setToast("Signed out");
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  async function mark(i: number) {
    const next = [...new Set([...complete, i])];
    if (user || PUBLIC_DEMO) {
      try {
        await api("/progress", "PUT", { completed: next });
      } catch (e) {
        setToast((e as Error).message);
        return;
      }
    }
    setComplete(next);
  }
  const current = result?.steps[Math.min(step, result.steps.length - 1)];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <Brand />
        <div className="workspace">
          <span className="workspace-icon">
            <Layers3 size={17} />
          </span>
          <div>
            Frontier workspace<small>DATAFORGE / 2026</small>
          </div>
        </div>
        <div className="nav-caption">EXPLORE & UNDERSTAND</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item active" : "nav-item"}
              onClick={() => go(n.id)}
              aria-current={page === n.id ? "page" : undefined}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "learn" && (
                <span className="nav-count">{complete.length}/4</span>
              )}
              {n.id === "lab" && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="tiny-orbit">
            <Sparkles size={20} />
          </div>
          <h4>
            A little curiosity.
            <br />A lasting understanding.
          </h4>
          <p>
            See the mechanism.
            <br />
            Change one thing. Make it click.
          </p>
          <button onClick={() => go("learn")}>
            Take the 60-second tour <ArrowRight size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" /> {PUBLIC_DEMO ? "Python in your browser" : "Local computation"}{" "}
          <span className="muted">v1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {nav.find((n) => n.id === page)?.label || "Memory lab"}
            </strong>
          </div>
          <div className="header-right">
            <span className="research-badge">EXPLAIN THE FRONTIER</span>
            {PUBLIC_DEMO ? <a className="button small" href={import.meta.env.BASE_URL + "submission/"}>Submission files <Download size={14} /></a> : user ? (
              <>
                <span className="avatar">{user.name[0].toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  title="Sign out"
                  onClick={logout}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <button className="button small" onClick={() => setAuth(true)}>
                Sign in <ArrowRight size={14} />
              </button>
            )}
          </div>
        </header>
        <main id="main">
          {PUBLIC_DEMO && <div className="public-demo-notice">
            <strong>Public demo. No sign-in needed.</strong>{" "}
            Python runs on this device. Notebook entries stay in this browser.
            {busy && !result && <span> First load downloads the Python runtime. Please wait…</span>}
            <a href="https://github.com/Yeshwanthv123/Dataforge2026" target="_blank" rel="noreferrer">Source &amp; Docker edition <ArrowRight size={13} /></a>
          </div>}
          {page === "lab" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span /> THE ASSOCIATIVE MEMORY LAB
                  </div>
                  <h1>
                    Make a memory.
                    <br className="phone-break" /> <span>See what stays.</span>
                  </h1>
                  <p>
                    Explore how AI stores, recalls, and sometimes forgets. One
                    connection at a time.
                  </p>
                </div>
                <button
                  className="button"
                  disabled={busy || !result || !!error}
                  onClick={() => (user || PUBLIC_DEMO ? setSaveOpen(true) : setAuth(true))}
                >
                  <Save size={16} /> Save experiment
                </button>
              </div>
              <div className="insight-banner">
                <span className="insight-icon">
                  <Sparkles size={19} />
                </span>
                <div>
                  <strong>Small memory. Surprising behavior.</strong>
                  <span>
                    A fixed-size state can keep learning new associations — but
                    similar cues can interfere.
                  </span>
                </div>
                <button onClick={() => go("learn")}>
                  Follow the story <ArrowRight size={16} />
                </button>
              </div>
              <div className="section-line">
                <div>
                  <span className="section-number">01</span>
                  <h2>Choose your experiment</h2>
                </div>
                <Tag>
                  <span className="status-dot" /> LIVE PYTHON MODEL
                </Tag>
              </div>
              <div className="preset-grid">
                {presets.map((p, i) => (
                  <button
                    className={
                      "preset " + (preset === p.name ? "selected" : "")
                    }
                    key={p.name}
                    onClick={() => load(p)}
                  >
                    <span className="preset-number">0{i + 1}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.desc}</small>
                    </div>
                    <span className="radio-circle">
                      {preset === p.name && <span />}
                    </span>
                  </button>
                ))}
              </div>
              {error && (
                <div role="alert" className="error-banner">
                  {error}
                  <button
                    className="button small"
                    onClick={() => setRetry((v) => v + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}
              <div
                className={"lab-grid " + (busy ? "computing" : "")}
                aria-busy={busy}
              >
                <section className="panel input-panel">
                  <div className="panel-heading">
                    <h2>
                      <span className="section-number">02</span> Write memories
                    </h2>
                    <Tag>{config.pairs.length} PAIRS</Tag>
                  </div>
                  <p className="panel-intro">
                    A cue goes in. An association takes shape.
                  </p>
                  <div className="pair-labels">
                    <span>CUE</span>
                    <span>ASSOCIATION</span>
                  </div>
                  <div className="pairs">
                    {config.pairs.map((p, i) => (
                      <div
                        className={"pair " + (step === i + 1 ? "at-step" : "")}
                        key={i}
                      >
                        <span className="pair-index">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <select
                          aria-label={`Cue ${i + 1}`}
                          value={p.key}
                          onChange={(e) =>
                            update({
                              pairs: config.pairs.map((v, j) =>
                                j === i ? { ...v, key: +e.target.value } : v,
                              ),
                            })
                          }
                        >
                          {keys.map((k, j) => (
                            <option key={k} value={j}>
                              {k}
                            </option>
                          ))}
                        </select>
                        <ArrowRight size={13} />
                        <span
                          className="color-dot"
                          style={{ background: colors[p.value] }}
                        />
                        <select
                          aria-label={`Association ${i + 1}`}
                          value={p.value}
                          onChange={(e) =>
                            update({
                              pairs: config.pairs.map((v, j) =>
                                j === i ? { ...v, value: +e.target.value } : v,
                              ),
                            })
                          }
                        >
                          {values.map((v, j) => (
                            <option key={v} value={j}>
                              {v}
                            </option>
                          ))}
                        </select>
                        <button
                          className="remove-pair"
                          aria-label={`Remove pair ${i + 1}`}
                          disabled={config.pairs.length === 1}
                          onClick={() =>
                            update({
                              pairs: config.pairs.filter((_, j) => j !== i),
                            })
                          }
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-pair"
                    disabled={config.pairs.length >= 32}
                    onClick={() =>
                      update({
                        pairs: [
                          ...config.pairs,
                          {
                            key: config.pairs.length % 8,
                            value: config.pairs.length % 8,
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={15} /> Add association{" "}
                    <span>{config.pairs.length}/32</span>
                  </button>
                  <div className="divider" />
                  <div className="control-title">
                    Memory behavior <CircleHelp size={14} />
                  </div>
                  <label className="field-label">
                    Write rule
                    <select
                      className="full-select"
                      value={config.rule}
                      onChange={(e) =>
                        update({ rule: e.target.value as Config["rule"] })
                      }
                    >
                      <option value="hebbian">Hebbian · accumulate</option>
                      <option value="delta">Delta · correct the error</option>
                    </select>
                  </label>
                  <Slider
                    label="Cue overlap"
                    symbol="ρ"
                    value={config.overlap}
                    onChange={(overlap) => update({ overlap })}
                    hint="Higher overlap makes different cues look alike."
                  />
                  <Slider
                    label="Memory retention"
                    symbol="λ"
                    value={config.retention}
                    onChange={(retention) => update({ retention })}
                    hint="The fraction of old memory kept on each write."
                  />
                  <details className="advanced">
                    <summary>
                      More controls <Plus size={13} />
                    </summary>
                    <Slider
                      label="Write strength"
                      symbol="η"
                      value={config.strength}
                      onChange={(strength) => update({ strength })}
                      hint="Scale of each new memory update."
                    />
                    <Slider
                      label="Query noise"
                      symbol="σ"
                      max={0.8}
                      value={config.noise}
                      onChange={(noise) => update({ noise })}
                      hint="Standard deviation of seeded Gaussian cue noise."
                    />
                    <label className="field-label">
                      Random seed
                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        value={config.seed}
                        onChange={(e) =>
                          update({
                            seed: Math.max(
                              0,
                              Math.min(1000000, Math.trunc(+e.target.value)),
                            ),
                          })
                        }
                      />
                    </label>
                  </details>
                </section>
                <section className="panel memory-panel">
                  <div className="panel-heading">
                    <h2>
                      <span className="section-number">03</span> Inside the
                      memory
                    </h2>
                    <span className="live-label">
                      <span className="status-dot" />
                      {busy ? "Computing…" : "Live state"}
                    </span>
                  </div>
                  <p className="panel-intro">
                    Every cell is a real connection weight. Every write leaves a
                    trace.
                  </p>
                  <div className="memory-topline">
                    <span className="mono">
                      STATE M<sub>t</sub> <span className="muted">/ 9 × 8</span>
                    </span>
                    <span className="subtle">
                      {step === 0 ? "Before any writes" : `After write ${step}`}
                    </span>
                  </div>
                  <Heatmap step={current} />
                  <div className="heatmap-legend">
                    <span>Negative</span>
                    <span className="gradient-key" />
                    <span>Positive</span>
                    <span className="legend-note">
                      Fixed scale ±2 · hover for exact values
                    </span>
                  </div>
                  <div className="equation">
                    <span className="equation-caption">
                      {config.rule === "hebbian"
                        ? "THE HEBBIAN WRITE"
                        : "THE DELTA WRITE"}
                    </span>
                    <div>
                      {config.rule === "hebbian" ? (
                        <>
                          M<sub>t</sub> = <b>λ</b>M<sub>t−1</sub> + <b>η</b>k
                          <sub>t</sub>v<sub>t</sub>
                          <sup>T</sup>
                        </>
                      ) : (
                        <>
                          M̄ = <b>λ</b>M<sub>t−1</sub>
                          <br />M<sub>t</sub> = M̄ + <b>η</b>k<sub>t</sub>(v
                          <sub>t</sub> − M̄<sup>T</sup>k<sub>t</sub>)<sup>T</sup>
                        </>
                      )}
                    </div>
                    <p>
                      {config.rule === "hebbian"
                        ? "Keep the old trace. Add the new association."
                        : "Read the current guess. Write only the correction."}
                    </p>
                  </div>
                  <div className="playback">
                    <button
                      className="play-button"
                      disabled={busy || !result || !!error}
                      aria-label={playing ? "Pause writes" : "Replay writes"}
                      onClick={() => {
                        if (!playing && step >= config.pairs.length) setStep(0);
                        setPlaying(!playing);
                      }}
                    >
                      {playing ? <Pause size={17} /> : <Play size={17} />}
                    </button>
                    <input
                      aria-label="Memory write step"
                      type="range"
                      min="0"
                      max={config.pairs.length}
                      value={step}
                      disabled={busy || !!error}
                      onChange={(e) => {
                        setPlaying(false);
                        setStep(+e.target.value);
                      }}
                    />
                    <span className="mono">
                      {step} / {config.pairs.length}
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Next write"
                      disabled={busy || !!error || step >= config.pairs.length}
                      onClick={() => {
                        setPlaying(false);
                        setStep((s) => Math.min(s + 1, config.pairs.length));
                      }}
                    >
                      <SkipForward size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Reset playback"
                      onClick={() => {
                        setPlaying(false);
                        setStep(0);
                      }}
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                  <div className="memory-footer">
                    <span>
                      <span className="status-dot" /> Actual computed state
                    </span>
                    <span>72 cells. Always.</span>
                  </div>
                </section>
                <section className="panel recall-panel">
                  <div className="panel-heading">
                    <h2>
                      <span className="section-number">04</span> Recall &
                      compare
                    </h2>
                  </div>
                  <p className="panel-intro">
                    Give it a cue. See what comes back.
                  </p>
                  <label className="field-label">
                    QUERY CUE
                    <select
                      className="query-select"
                      value={config.query}
                      onChange={(e) => update({ query: +e.target.value })}
                    >
                      {keys.map((k, i) => (
                        <option key={k} value={i}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="query-flow">
                    <span />
                    <ArrowDown size={17} />
                    <span />
                  </div>
                  <div
                    className={
                      "prediction " +
                      (current?.correct === false ? "wrong" : "")
                    }
                  >
                    <div className="eyebrow">MODEL RECALL</div>
                    <div className="prediction-word">
                      {current?.prediction != null ? (
                        <>
                          <span
                            className="large-dot"
                            style={{ background: colors[current.prediction] }}
                          />
                          {values[current.prediction]}
                        </>
                      ) : (
                        <span className="muted">No signal</span>
                      )}
                    </div>
                    <div className="truth">
                      Ground truth{" "}
                      <strong>
                        {current?.expected != null
                          ? values[current.expected]
                          : "Not written yet"}
                      </strong>
                    </div>
                    <span
                      className={
                        "match " + (current?.correct === false ? "miss" : "")
                      }
                    >
                      {current?.correct === true ? (
                        <>
                          <CheckCircle2 size={14} /> Match
                        </>
                      ) : current?.correct === false ? (
                        <>
                          <Activity size={14} /> Memory mismatch
                        </>
                      ) : (
                        <>Awaiting a known cue</>
                      )}
                    </span>
                  </div>
                  <div className="score-title">
                    DECODER DISTRIBUTION{" "}
                    <span title="Softmax decoder scores are not calibrated confidence.">
                      <CircleHelp size={13} />
                    </span>
                  </div>
                  <div className="score-bars">
                    {values.map((v, i) => (
                      <div className="score-row" key={v}>
                        <span>
                          <i style={{ background: colors[i] }} />
                          {v}
                        </span>
                        <div className="score-track">
                          <div
                            style={{
                              width: pct(current?.probabilities[i] || 0),
                              background: colors[i],
                            }}
                          />
                        </div>
                        <strong>{pct(current?.probabilities[i] || 0)}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="micro">
                    Softmax scores, not calibrated confidence. At zero state, no
                    answer is returned.
                  </p>
                  <div className="recall-note">
                    <GitBranch size={17} />
                    <p>
                      Memory changes during the experiment.
                      <br />
                      <strong>Trained decoder weights stay fixed.</strong>
                    </p>
                  </div>
                </section>
              </div>
              <div className="bottom-grid">
                <div className="metric-card">
                  <span>STATE SIZE</span>
                  <strong>
                    72 <small>cells</small>
                  </strong>
                  <p>576 bytes of float64 memory</p>
                </div>
                <div className="metric-card">
                  <span>RECALL ACROSS KNOWN CUES</span>
                  <strong>
                    {current?.accuracy != null ? pct(current.accuracy) : "—"}
                    <small> / {current?.known_keys || 0} cues</small>
                  </strong>
                  <p>Clean cues · latest written value is the target</p>
                </div>
                <div className="metric-card">
                  <span>EXPLICIT-TOKEN REFERENCE</span>
                  <strong>
                    {result ? values[result.reference.prediction] : "—"}
                  </strong>
                  <p>Final sequence · dot-product softmax attention</p>
                  <details>
                    <summary>Compare storage & assumptions</summary>
                    <p>
                      Stores {result?.token_cache_cells} key/value scalars for{" "}
                      {config.pairs.length} writes. Uses the same cues, with
                      logits scaled by 8. Keeps all writes; duplicates can still
                      conflict. This is a teaching reference, not a full
                      Transformer.
                    </p>
                  </details>
                </div>
                <div className="metric-card export-card">
                  <span>REPRODUCIBLE BY DESIGN</span>
                  <strong>Same seed. Same trace.</strong>
                  <p>Export inputs, weights metadata, and every step.</p>
                  <button
                    className="text-button"
                    disabled={!result || busy || !!error}
                    onClick={() => download(result, "trace-experiment.json")}
                  >
                    Export experiment <Download size={15} />
                  </button>
                </div>
              </div>
              <div className="lab-footnote">
                <span>
                  Educational fast-weight model · inspired by associative memory
                  research · not a BDH reproduction
                </span>
                <button onClick={() => go("bdh")}>
                  How this connects to BDH <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
          {page === "learn" && (
            <Journey
              complete={complete}
              mark={mark}
              load={(p) => {
                load(p);
                go("lab");
              }}
              user={user}
              signIn={() => setAuth(true)}
            />
          )}
          {page === "bdh" && (
            <BDH
              onLab={() => {
                load(presets[2]);
                go("lab");
              }}
            />
          )}
          {page === "evidence" && <Evidence />}
          {page === "notebook" && (
            <Notebook
              user={user}
              signIn={() => setAuth(true)}
              open={(s) => {
                setConfig(s.config);
                setPreset(s.name);
                go("lab");
              }}
              notify={setToast}
            />
          )}
          <footer>
            <Brand />
            <span>An open window into how AI remembers.</span>
            <span>DATAFORGE 2026 · PATHWAY TRACK</span>
          </footer>
        </main>
      </div>
      {auth && (
        <Auth
          close={() => setAuth(false)}
          success={(u) => {
            setUser(u);
            setAuth(false);
            setToast(`Welcome, ${u.name}. Your notebook is ready.`);
          }}
        />
      )}
      {saveOpen && (
        <SaveDialog
          config={config}
          defaultName={preset}
          close={() => setSaveOpen(false)}
          saved={() => {
            setSaveOpen(false);
            setToast("Experiment saved to your notebook.");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function Slider({
  label,
  symbol,
  value,
  onChange,
  hint,
  max = 1,
}: {
  label: string;
  symbol: string;
  value: number;
  onChange: (n: number) => void;
  hint: string;
  max?: number;
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <span>
          <i>{symbol}</i> {value.toFixed(2)}
        </span>
      </span>
      <input
        type="range"
        min="0"
        max={max}
        step=".01"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <small>{hint}</small>
    </label>
  );
}
function Heatmap({ step }: { step?: Step }) {
  const matrix: number[][] =
    step?.matrix || Array.from({ length: 9 }, () => Array(8).fill(0));
  return (
    <div className="heatmap-wrap">
      <div className="axis-top">VALUE FEATURES →</div>
      <div className="matrix-layout">
        <div className="axis-left">CUE FEATURES</div>
        <div className="row-labels">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i}>{i === 8 ? "ρ" : i + 1}</span>
          ))}
        </div>
        <div
          className="heatmap"
          role="group"
          aria-label={`Memory matrix after ${step?.index || 0} writes. ${step?.norm || 0} Frobenius norm.`}
        >
          {matrix.flatMap((row, i) =>
            row.map((v, j) => (
              <div
                tabIndex={0}
                key={`${i}-${j}`}
                className="cell"
                style={{
                  background:
                    v === 0
                      ? "#20272d"
                      : v > 0
                        ? `rgba(235,183,101,${0.12 + Math.min(Math.abs(v) / 2, 1) * 0.88})`
                        : `rgba(114,164,197,${0.12 + Math.min(Math.abs(v) / 2, 1) * 0.88})`,
                }}
                aria-label={`Row ${i + 1}, column ${j + 1}: ${v.toFixed(5)}`}
              >
                <span className="cell-tooltip">
                  M[{i + 1}, {j + 1}]<b>{v.toFixed(5)}</b>Δ{" "}
                  {step?.update[i][j].toFixed(5) || "0"}
                </span>
              </div>
            )),
          )}
        </div>
      </div>
      <div className="col-labels">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

function Modal({
  children,
  close,
  label,
}: {
  children: React.ReactNode;
  close: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("input,button")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,a[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
function Auth({
  close,
  success,
}: {
  close: () => void;
  success: (u: User) => void;
}) {
  const [signup, setSignup] = useState(false),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      success(
        await api<User>("/auth/" + (signup ? "register" : "login"), "POST", {
          name: f.get("name") || "Explorer",
          email: f.get("email"),
          password: f.get("password"),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal label={signup ? "Create an account" : "Sign in"} close={close}>
      <div className="modal-top">
        <Brand />
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close sign in"
        >
          <X size={20} />
        </button>
      </div>
      <div className="auth-art">
        <Layers3 size={36} />
        <span>Your ideas deserve a place to stay.</span>
      </div>
      <h2>{signup ? "Start your notebook." : "Welcome back, explorer."}</h2>
      <p>Save experiments and pick up where curiosity left off.</p>
      <form onSubmit={submit}>
        {signup && (
          <label>
            Your name
            <input
              name="name"
              required
              maxLength={60}
              autoComplete="name"
              placeholder="Ada Lovelace"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              type={show ? "text" : "password"}
              required
              minLength={10}
              maxLength={128}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="At least 10 characters"
            />
            <button type="button" onClick={() => setShow(!show)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary wide" disabled={busy}>
          {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="auth-switch">
        {signup ? "Already have an account?" : "New to TRACE?"}{" "}
        <button
          onClick={() => {
            setSignup(!signup);
            setError("");
          }}
        >
          {signup ? "Sign in" : "Create an account"}
        </button>
      </p>
      <div className="security-note">
        <ShieldCheck size={16} /> Passwords are salted and hashed with scrypt.
      </div>
      <button className="guest-button" onClick={close}>
        Continue exploring without an account <ArrowRight size={14} />
      </button>
    </Modal>
  );
}
function SaveDialog({
  config,
  defaultName,
  close,
  saved,
}: {
  config: Config;
  defaultName: string;
  close: () => void;
  saved: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal label="Save experiment" close={close}>
      <div className="modal-top">
        <h2>Keep this discovery.</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close save dialog"
        >
          <X size={18} />
        </button>
      </div>
      <p>
        Your inputs and the complete computed trace will be stored in your
        notebook.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/experiments", "POST", {
              name: new FormData(e.currentTarget).get("name"),
              config,
            });
            saved();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <label>
          Experiment name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={defaultName}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button primary wide" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save to notebook"}
        </button>
      </form>
    </Modal>
  );
}

const lessons = [
  {
    title: "Write it. Recall it.",
    subtitle: "Start with a clean memory.",
    body: "A cue is an address; a value is what you want to remember. Write Atlas → Amber. Query Atlas and inspect the readout. With distinct cues and full retention, each association can be recovered.",
    question: "What changes when you write a new association?",
    options: [
      "The temporary memory matrix",
      "The trained decoder parameters",
      "The number of memory cells",
    ],
    answer: 0,
    why: "Only M changes. The decoder stays fixed, and M always contains 72 cells.",
    preset: 0,
  },
  {
    title: "Make memories collide.",
    subtitle: "More memory is not always better memory.",
    body: "Load the collision preset: Atlas → Amber twice, then Atlas → Violet. The target is now Violet. Hebbian writes accumulate both answers, so the older association can dominate. Switch the write rule to Delta to correct the stored answer.",
    question: "Why can Hebbian recall miss the latest answer?",
    options: [
      "Old and new associations accumulate",
      "The API chooses an answer at random",
      "The decoder retrains on the newest pair",
    ],
    answer: 0,
    why: "Additive writes preserve competing associations. The delta rule instead writes the residual after reading the current state.",
    preset: 1,
  },
  {
    title: "The cost of similar cues.",
    subtitle: "Fixed shape does not mean unlimited recall.",
    body: "Load Interference and inspect Atlas. Different cues now share a large common component. Their writes overlap, so Violet can overwhelm Amber. Lower cue overlap toward zero: the addresses become distinct again.",
    question: "If cue overlap increases, what should you expect?",
    options: [
      "Memory grows a new row",
      "Different associations interfere more",
      "Decoder training restarts",
    ],
    answer: 1,
    why: "Shared key directions write to shared parts of M. Storage shape stays fixed even when recall degrades.",
    preset: 2,
  },
  {
    title: "Know what you have learned.",
    subtitle: "Connect the lab to frontier research.",
    body: "In BDH, transient synaptic state supports working memory. Our tiny matrix makes an associative write/read mechanism visible; it does not reproduce the full BDH architecture. A stored experiment in SQLite is also different from a model retaining a memory across sessions.",
    question: "Which conclusion does this lab support?",
    options: [
      "BDH solves all long-context tasks",
      "Fixed-size memory can suffer interference",
      "Our decoder score measures BDH reasoning ability",
    ],
    answer: 1,
    why: "The lab demonstrates a mechanism and its limits. Full-model claims need evaluations of the actual model.",
    preset: 3,
  },
];
function Journey({
  complete,
  mark,
  load,
  user,
  signIn,
}: {
  complete: number[];
  mark: (i: number) => void;
  load: (p: (typeof presets)[number]) => void;
  user: User | null;
  signIn: () => void;
}) {
  const [lesson, setLesson] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const l = lessons[lesson];
  return (
    <div className="content-page">
      <div className="eyebrow">A GUIDED JOURNEY</div>
      <h1>From a cue to a click.</h1>
      <p className="page-lead">
        Four short experiments. One idea you can explain back.
      </p>
      <div className="learning-meta">
        <Tag>FOR CURIOUS DEVELOPERS & DATA SCIENTISTS</Tag>
        <span>
          Prerequisites: vectors, dot products, basic machine learning
        </span>
      </div>
      <div className="journey-layout">
        <div className="lesson-nav">
          {lessons.map((l, i) => (
            <button
              key={i}
              className={lesson === i ? "selected" : ""}
              onClick={() => {
                setLesson(i);
                setAnswer(null);
              }}
            >
              <span>
                {complete.includes(i) ? (
                  <Check size={17} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <div>
                {l.title}
                <small>
                  {i === 3 ? "Connect & reflect" : "Predict → try → explain"}
                </small>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        <section className="panel lesson-card">
          <Tag>CHAPTER 0{lesson + 1} / 04</Tag>
          <h2>{l.title}</h2>
          <h3>{l.subtitle}</h3>
          <p>{l.body}</p>
          <button
            className="button primary"
            onClick={() => load(presets[l.preset])}
          >
            Try this in the lab <ArrowRight size={16} />
          </button>
          <div className="divider" />
          <div className="eyebrow">CHECK YOUR UNDERSTANDING</div>
          <h3>{l.question}</h3>
          <div className="quiz-options">
            {l.options.map((o, i) => (
              <button
                className={
                  answer === i ? (i === l.answer ? "correct" : "incorrect") : ""
                }
                onClick={() => {
                  setAnswer(i);
                  if (i === l.answer) mark(lesson);
                }}
                key={o}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {o}
                {answer === i &&
                  (i === l.answer ? <Check size={17} /> : <X size={17} />)}
              </button>
            ))}
          </div>
          {answer !== null && (
            <div
              className={
                "quiz-feedback " + (answer === l.answer ? "success" : "")
              }
            >
              {answer === l.answer ? "Exactly. " : "Try another answer. "}
              {l.why}
            </div>
          )}
          <div className="lesson-bottom">
            <span>{complete.length} of 4 understood</span>
            <button
              className="text-button"
              disabled={lesson === 3}
              onClick={() => {
                setLesson(lesson + 1);
                setAnswer(null);
              }}
            >
              Next chapter <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
      <div className="panel reading-card">
        <h3>The sixty-second test</h3>
        <p>
          Load Memory collision. Predict the output. Switch Hebbian to Delta.
          Explain why the answer changes while the state stays at 72 cells. Then
          open Inside BDH and name one feature our model omits.
        </p>
        {!user && !PUBLIC_DEMO && (
          <button className="text-button" onClick={signIn}>
            Sign in to save your learning progress <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function BDH({ onLab }: { onLab: () => void }) {
  return (
    <div className="content-page">
      <div className="eyebrow">THE RESEARCH CONNECTION</div>
      <h1>
        From attention
        <br />
        to a changing connection.
      </h1>
      <p className="page-lead">
        Understand what carries memory — and what stays fixed — in Dragon
        Hatchling.
      </p>
      <div className="bdh-hero panel">
        <div>
          <Tag tone="gold">LEARNING OBJECTIVE</Tag>
          <h2>
            Separate the learned wiring
            <br />
            from the memory of this moment.
          </h2>
          <p>
            In the conceptual BDH model, working memory lives in transient
            synaptic changes. The paper connects this to Hebbian learning.{" "}
            <a
              href="https://arxiv.org/html/2509.26507v1#S2"
              target="_blank"
              rel="noreferrer"
            >
              BDH §2 ↗
            </a>
          </p>
        </div>
        <div className="mechanism-diagram">
          <div>
            <Layers3 />
            <strong>Slow parameters</strong>
            <span>Learned during training</span>
          </div>
          <ArrowRight className="gold-text" />
          <div className="highlight">
            <GitBranch />
            <strong>Fast state</strong>
            <span>Changes with context</span>
          </div>
          <ArrowRight className="gold-text" />
          <div>
            <Sparkles />
            <strong>Readout</strong>
            <span>Uses the current state</span>
          </div>
        </div>
      </div>
      <div className="research-grid">
        <article className="panel reading-card">
          <span className="section-number">01</span>
          <h2>The connection we make visible</h2>
          <p>
            TRACE writes an outer product into a 9 × 8 matrix, then reads it
            with a query vector. With retention λ = 1, the Hebbian rule is an
            additive associative memory. Similar keys can write overlapping
            associations.
          </p>
          <div className="inline-equation">
            M ← λM + ηkvᵀ
            <br />
            readout = qᵀM
          </div>
          <p>
            This isolates a write/read motif relevant to the paper’s
            synaptic-memory interpretation. It is a teaching model: our keys are
            constructed, our values are synthetic, and our decoder is trained
            separately.
          </p>
          <button className="text-button" onClick={onLab}>
            Inspect interference in the lab <ArrowRight size={16} />
          </button>
        </article>
        <article className="panel reading-card">
          <span className="section-number">02</span>
          <h2>What full BDH adds</h2>
          <p>
            BDH-GPU combines ReLU-low-rank transformations, sparse nonnegative
            activations, and linear attention in neuron-aligned coordinates. Its
            trainable transformations and recurrent interactions are richer than
            our single memory matrix.{" "}
            <a
              href="https://arxiv.org/html/2509.26507v1#S3"
              target="_blank"
              rel="noreferrer"
            >
              Architecture, §3–4 ↗
            </a>
          </p>
          <p>
            The authors report concept-selective synapses and compare
            language-model scaling with GPT2-style baselines. These are
            paper-reported findings; TRACE does not independently reproduce
            them.{" "}
            <a
              href="https://arxiv.org/html/2509.26507v1#S6"
              target="_blank"
              rel="noreferrer"
            >
              Analysis, §6 ↗
            </a>
          </p>
          <Tag>OUR LAB IS NOT A BDH IMPLEMENTATION</Tag>
        </article>
      </div>
      <article className="panel reading-card">
        <div className="eyebrow">BDH-CQ · A DISTINCT SYSTEM IN THE FAMILY</div>
        <h2>Adapting in state, reasoning in latent space.</h2>
        <p>
          The 2026 BDH-CQ report describes learning from demonstrations through
          context and recurrent latent reasoning without changing trained
          parameters at inference. The useful connection here is where
          adaptation happens: in recurrent state. The report’s ARC-AGI
          evaluation concerns the complete BDH-CQ system, not this toy memory.{" "}
          <a
            href="https://arxiv.org/abs/2608.09888"
            target="_blank"
            rel="noreferrer"
          >
            BDH-CQ technical report ↗
          </a>
        </p>
        <p>
          TRACE does not implement its demonstration encoder, reasoning loop, or
          ARC solver. Saving a trace to SQLite is application persistence; it is
          not evidence of durable learning in either BDH system.
        </p>
      </article>
      <div className="section-line">
        <h2>Place the mechanism in context</h2>
        <Tag>EVIDENCE, WITH BOUNDARIES</Tag>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>System</th>
              <th>Memory mechanism</th>
              <th>What the evidence supports</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TRACE lab</td>
              <td>Inspectable matrix; Hebbian or delta writes</td>
              <td>Reproducible synthetic mechanism demonstrations</td>
            </tr>
            <tr>
              <td>BDH / BDH-GPU</td>
              <td>Synaptic state; sparse activations and linear attention</td>
              <td>Author-reported language experiments; no replication here</td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://arxiv.org/abs/2412.06464"
                  target="_blank"
                  rel="noreferrer"
                >
                  Gated DeltaNet ↗
                </a>
              </td>
              <td>Gating plus targeted delta updates</td>
              <td>
                Author-reported retrieval and language benchmarks; our delta
                rule is simplified
              </td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://arxiv.org/abs/2501.00663"
                  target="_blank"
                  rel="noreferrer"
                >
                  Titans ↗
                </a>
              </td>
              <td>A neural memory module that learns at test time</td>
              <td>
                Author-reported long-context evaluations; not implemented here
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="limit-callout">
        <CircleHelp size={22} />
        <div>
          <h3>The important limit</h3>
          <p>
            A fixed-size state can process more inputs without adding slots. It
            cannot promise lossless recall of arbitrary histories. Capacity,
            representation, update rules, and interference still matter.
          </p>
        </div>
      </div>
    </div>
  );
}

function Evidence() {
  const [m, setM] = useState<Metrics | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<Metrics>("/model")
      .then(setM)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="content-page">
      <div className="eyebrow">OPEN THE BLACK BOX</div>
      <h1>Small model. Visible evidence.</h1>
      <p className="page-lead">
        Real training, reproducible data, and a clear line between demonstration
        and research claim.
      </p>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="evidence-stats">
        {[
          ["Training samples", m?.train_samples.toLocaleString()],
          ["Held-out samples", m?.test_samples.toLocaleString()],
          [
            "Decoder accuracy",
            m ? `${(m.test_accuracy * 100).toFixed(2)}%` : "…",
          ],
          ["Trainable parameters", m?.parameters],
        ].map(([k, v]) => (
          <div className="metric-card" key={k}>
            <span>{k}</span>
            <strong>{v || "…"}</strong>
          </div>
        ))}
      </div>
      <div className="research-grid">
        <article className="panel reading-card">
          <Tag tone="gold">COMPUTED TRAINING ARTIFACT</Tag>
          <h2>A decoder that actually learns.</h2>
          <p>
            Eight symbols are represented by orthogonal 8-dimensional codes. We
            generate noisy examples and train a softmax linear decoder with
            cross-entropy gradient descent for 200 epochs. Seed 42 reproduces
            the data and initialization.
          </p>
          <p>
            The held-out accuracy measures noisy-symbol classification. Memory
            retrieval is measured separately in each live experiment. The small
            synthetic dataset does not establish performance on natural
            language.
          </p>
          <button
            className="text-button"
            disabled={!m}
            onClick={() => download(m, "trace-training-metrics.json")}
          >
            Download training metrics <Download size={16} />
          </button>
        </article>
        <article className="panel reading-card">
          <div className="chart-heading">
            <h2>Training loss</h2>
            <Tag>CROSS-ENTROPY</Tag>
          </div>
          {m && (
            <svg
              className="loss-chart"
              viewBox="0 0 480 220"
              role="img"
              aria-label={`Training loss decreases from ${m.history[0].loss} to ${m.history.at(-1)?.loss}`}
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#eaba6b" stopOpacity=".24" />
                  <stop offset="1" stopColor="#eaba6b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((v) => (
                <g key={v}>
                  <line
                    x1="35"
                    x2="465"
                    y1={180 - v * 70}
                    y2={180 - v * 70}
                    stroke="#30363c"
                    strokeDasharray="3 5"
                  />
                  <text x="10" y={185 - v * 70} fill="#8e969f" fontSize="12">
                    {v}
                  </text>
                </g>
              ))}
              <path
                d={`M35,180 ${m.history.map((h) => `L${35 + h.epoch * 2.1},${180 - h.loss * 70}`).join(" ")} L455,180Z`}
                fill="url(#chartFill)"
              />
              <polyline
                points={m.history
                  .map((h) => `${35 + h.epoch * 2.1},${180 - h.loss * 70}`)
                  .join(" ")}
                fill="none"
                stroke="#eaba6b"
                strokeWidth="3"
              />
              <text x="35" y="211" fill="#8e969f" fontSize="12">
                Epoch 0
              </text>
              <text x="390" y="211" fill="#8e969f" fontSize="12">
                Epoch 200
              </text>
            </svg>
          )}
          <p className="micro">
            Loaded from the model’s saved metrics, not an illustrative curve.
          </p>
        </article>
      </div>
      <div className="panel reading-card">
        <h2>What is real, and what is simplified?</h2>
        <div className="provenance-grid">
          <div>
            <Tag tone="green">LIVE</Tag>
            <h3>Python computation</h3>
            <p>
              Matrix writes, every timestep, noisy queries, decoder outputs,
              recall checks, and the explicit-token reference use the same Python model{PUBLIC_DEMO ? " running in this browser through Pyodide." : " served by FastAPI."}
            </p>
          </div>
          <div>
            <Tag tone="gold">TRAINED AT BUILD</Tag>
            <h3>72 learned parameters</h3>
            <p>
              The decoder and dataset are generated during Docker build. The
              weights remain fixed throughout each experiment.
            </p>
          </div>
          <div>
            <Tag>SYNTHETIC</Tag>
            <h3>Controlled symbol data</h3>
            <p>
              Names and colors label artificial vectors. The experiment has
              eight possible cues and values, capped at 32 writes.
            </p>
          </div>
          <div>
            <Tag>ANIMATED</Tag>
            <h3>Playback of real states</h3>
            <p>
              Animation steps through the model’s computed matrices. It does not
              simulate a training process or fabricate outputs.
            </p>
          </div>
        </div>
      </div>
      <div className="panel reading-card">
        <h2>Reproduce it from the source</h2>
        <pre>
          docker compose run --rm backend python -m pytest -q{`\n`}docker
          compose run --rm backend python -m app.model
        </pre>
        <p>
          The second command retrains in an ephemeral container. The running
          backend continues using its build-time artifact. Model files and the
          synthetic dataset are included in the backend image under
          /app/artifacts.
        </p>
        <label className="field-label">
          MODEL SHA-256<code className="hash">{m?.sha256 || "Loading…"}</code>
        </label>
      </div>
    </div>
  );
}
function Notebook({
  user,
  signIn,
  open,
  notify,
}: {
  user: User | null;
  signIn: () => void;
  open: (s: Saved) => void;
  notify: (s: string) => void;
}) {
  const [items, setItems] = useState<Saved[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [deleting, setDeleting] = useState<number | null>(null);
  useEffect(() => {
    if (user || PUBLIC_DEMO)
      api<Saved[]>("/experiments")
        .then(setItems)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [user]);
  return (
    <div className="content-page">
      <div className="eyebrow">YOUR EXPERIMENT NOTEBOOK</div>
      <h1>Keep the interesting moments.</h1>
      <p className="page-lead">
        Revisit a result, change one variable, and follow the next question.
      </p>
      {PUBLIC_DEMO && <p className="public-demo-notice">This notebook belongs to this browser, with no account or cloud sync. Clearing site data removes it. Export important experiments as JSON.</p>}
      {!user && !PUBLIC_DEMO ? (
        <div className="panel empty-state">
          <Bookmark size={38} />
          <h2>A home for your discoveries.</h2>
          <p>Sign in to save experiments and access them on your next visit.</p>
          <button className="button primary" onClick={signIn}>
            Sign in to your notebook <ArrowRight size={16} />
          </button>
        </div>
      ) : error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : loading ? (
        <div className="panel empty-state">Loading your notebook…</div>
      ) : items.length === 0 ? (
        <div className="panel empty-state">
          <FlaskConical size={38} />
          <h2>Your first discovery is waiting.</h2>
          <p>
            Run an experiment in the memory lab, then choose Save experiment.
          </p>
          <a className="button" href="#lab">
            Open memory lab <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <div className="notebook-grid">
          {items.map((s) => (
            <article className="panel notebook-card" key={s.id}>
              <div className="panel-heading">
                <Tag>{s.config.rule.toUpperCase()}</Tag>
                <span>{new Date(s.created_at + "Z").toLocaleDateString()}</span>
              </div>
              <h2>{s.name}</h2>
              <p>
                {s.config.pairs.length} associations · query{" "}
                {keys[s.config.query]}
              </p>
              <div className="notebook-dots">
                {s.config.pairs.map((p, i) => (
                  <span key={i} style={{ background: colors[p.value] }} />
                ))}
              </div>
              <div className="notebook-params">
                <span>
                  Overlap <b>{s.config.overlap.toFixed(2)}</b>
                </span>
                <span>
                  Retention <b>{s.config.retention.toFixed(2)}</b>
                </span>
              </div>
              <div className="notebook-actions">
                <button className="text-button" onClick={() => open(s)}>
                  Reopen in lab <ArrowRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Export ${s.name}`}
                  onClick={async () => {
                    try {
                      download(
                        await api(`/experiments/${s.id}`),
                        `trace-${s.id}.json`,
                      );
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  <Download size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => setDeleting(s.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {deleting === s.id && (
                <div className="delete-confirm">
                  <span>Delete this saved experiment?</span>
                  <button
                    onClick={async () => {
                      try {
                        await api(`/experiments/${s.id}`, "DELETE");
                        setItems(items.filter((x) => x.id !== s.id));
                        setDeleting(null);
                        notify("Experiment deleted");
                      } catch (e) {
                        notify((e as Error).message);
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setDeleting(null)}>Keep</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state">
        <h1>The lab hit an unexpected error.</h1>
        <p>Reload the page to recover your workspace.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
