# TRACE — The memory lab

**DataForge 2026 · Problem Statement 1 · Explain the Frontier (Pathway track)**

**Team: Cyber Leek** · [Public demo — no sign-in](https://yeshwanthv123.github.io/Dataforge2026/) · [Public source](https://github.com/Yeshwanthv123/Dataforge2026) · [Submission documents](https://yeshwanthv123.github.io/Dataforge2026/submission/) · [Download package](https://github.com/Yeshwanthv123/Dataforge2026/releases/latest)

Read [START_HERE.md](START_HERE.md) for the complete judge checklist, PDFs and seven-slide pitch.

### Public demo and Docker edition

The public demo executes the **same Python model** in a Pyodide Web Worker. No sign-in is required; its notebook and lesson progress stay in the visitor's browser. First load downloads a pinned Python runtime. The full Docker edition below supplies **FastAPI, SQLite and secure accounts**. The public host does not run a remote FastAPI/SQL service. Both compute new experiments from editable inputs. See [public build, offline artifact and deployment instructions](docs/PUBLIC_DEPLOYMENT.md).

An interactive, full-stack learning app about **associative memory and fast weights**. Write an association, inspect its actual memory matrix, introduce a collision, and watch a delta update repair the recall. React + TypeScript, Python FastAPI, SQLite, and a locally trained model. No paid APIs, API keys, GPU, or external model downloads.

**Central claim:** A fixed-shape associative state can accept new writes without allocating a slot per input, but overlapping cues and competing values can corrupt recall.

## Run with Docker

Install/start Docker Desktop with its Linux engine (or Docker Engine + Compose on Linux), then run from this directory:

```sh
docker compose up --build
```

Open **http://localhost:8080**. API documentation: **http://localhost:8000/docs**.

The correct command includes `up`: `docker compose --build` by itself is not valid Docker syntax. `compose.yaml` is the standard auto-detected Compose file; no `-f` argument is needed. The two Dockerfiles install dependencies, train the decoder, build the frontend, and start both services. The backend health check gates frontend startup. First build requires Internet to pull images/packages; subsequent operation is local.

```sh
docker compose up --build -d    # start in background
docker compose ps              # inspect health
docker compose logs -f         # see logs
docker compose down            # stop; preserve the database
```

SQLite lives in the `trace-data` named volume. Accounts, sessions, saved experiments, and lesson progress survive normal container restarts and rebuilds. Removing the volume deletes them. There is deliberately no shared default password: select **Sign in → Create an account**. All learning tools also work as a guest. The development-only browser test account, if present in `backend/data`, is not copied into Docker.

### Host troubleshooting

- Docker Desktop must successfully start before Compose can build. This machine initially had a Docker Desktop startup error involving its optional `dockerInference` socket. That is a host prerequisite, separate from the app.
- If 8080 or 8000 is occupied, stop that process or change the host port in Compose. When changing the frontend port, also update `ALLOWED_ORIGINS` in Compose to match.
- A Linux engine is required for the supplied Linux images. No Windows containers are used.
- The localhost demo uses HTTP and `COOKIE_SECURE=false`. For a hosted HTTPS instance, set `COOKIE_SECURE=true`, configure the exact public origin, put TLS in front of Nginx, and restrict registration/rate limits as appropriate. This prototype does not implement email verification, password reset, shared rate limiting, or account recovery.

## What works

- **Memory lab:** editable sequences (1–32 writes), eight cues/values, live API results, Hebbian and delta updates, cue overlap, retention, write strength, seeded query noise, per-cell inspection, step controls and playback.
- **Four presets:** clean recall, repeated-key collision, cross-key interference, and fading memory.
- **Truth beside prediction:** latest written value, decoded output, uncalibrated softmax scores, clean-cue recall across known keys, and an explicit-token attention reference.
- **Guided journey:** four lessons with predict/try/explain prompts, checks, and persistent progress for signed-in users.
- **Inside BDH:** substantive research explanation, architecture distinctions, linked primary sources, and limits of the teaching analogy.
- **Model & evidence:** real training-loss curve, held-out decoder evaluation, model hash, dataset provenance and metrics export.
- **Notebook:** secure registration/login/logout, per-user save/list/reopen/export/delete, durable SQLite storage.
- Responsive layout, keyboard controls, focus indicators, modal focus management, reduced-motion support, loading/error states, request cancellation, and toast feedback.

## A 60-second demo

1. Open **Memory collision**: Atlas → Amber, Atlas → Amber, Atlas → Violet. The latest value is Violet, but additive memory recalls Amber.
2. Replay the three writes. Hover/focus cells to inspect exact state values and updates.
3. Switch **Write rule** to **Delta**. Recall becomes Violet, and storage remains 72 cells.
4. Open **Interference**. Different cues overlap; Violet dominates the Atlas readout. Lower overlap to zero and recover Amber.
5. Explain the boundary: the matrix is temporary state, the trained decoder is fixed, and this is a mechanism demonstration rather than a reproduction of BDH.

See [the full demo walkthrough](docs/DEMO.md) for a longer presentation and likely judge questions.

## Intended learner and learning goals

Audience: undergraduate ML learners, developers and data scientists who know vectors, dot products and basic supervised learning. A learner should be able to:

1. Explain an outer-product write and query-based read.
2. Predict how overlap, retention and competing values change recall.
3. Distinguish temporary fast state from parameters learned through training.
4. Locate the relationship to BDH and identify at least one missing full-model feature.

## Architecture

```text
Browser / React + TypeScript
          │ same-origin /api requests, HttpOnly cookie
          ▼
Nginx ─── /api proxy ─── FastAPI
                          ├── NumPy decoder + fast-weight memory
                          └── SQLite /data/trace.db (named volume)
```

| Component | Role |
|---|---|
| `frontend/src/App.tsx` | UI, lesson navigation, lab controls, authentication dialogs, notebook |
| `frontend/src/main.tsx` | React entry point and error-boundary setup |
| `frontend/src/style.css` | Responsive dark research-workspace theme and motion |
| `frontend/src/api.ts` | Typed fetch wrapper; same-origin cookie authentication |
| `backend/app/model.py` | Synthetic dataset generation, decoder training, memory equations and reference computation |
| `backend/app/main.py` | Validated API, auth, rate limits, ownership checks, SQLite schema |
| `backend/artifacts/` | Local trained weights, full synthetic dataset, metrics |
| `backend/tests/` | Model behavior, auth, data isolation, validation and persistence tests |
| `compose.yaml` | Network, persistent volume, health checks and startup dependencies |

## Model, data and evidence

The decoder is a small **trained softmax linear classifier**, with an 8×8 weight matrix and eight biases. Its inputs are noisy eight-dimensional value codes. It is trained from scratch on 6,000 generated samples, with a separate 1,500-sample test set, seed 42. Training uses cross-entropy, 200 full-batch gradient updates, learning rate 0.7, and small L2 regularization. The local run obtained **1,499/1,500 correct (99.933%)**. This is a controlled symbol-decoding test, not a language/reasoning benchmark or a measure of memory retrieval.

At inference, the trained weights remain fixed. A separate **9×8 float64 memory** evolves through actual Hebbian or delta writes. The learned decoder converts its readout into one of eight labels. The constructed key vectors have pairwise similarity equal to the overlap control. See [MODEL_CARD.md](docs/MODEL_CARD.md) for exact definitions and limitations.

| What you see | Provenance |
|---|---|
| State cells, query output, recall metrics | Live Python computation |
| Memory playback | Animation of actual API-returned states |
| Training graph | Stored real training metrics |
| Names, colors, dataset | Synthetic labels and vectors |
| BDH/CQ text | Sourced explanation of published research |
| BDH performance claims | Published evidence, not reproduced by TRACE; BDH-CQ paper describes a co-author black-box audit |
| Token reference | Simplified dot-product softmax memory; not a full Transformer |

The heatmap uses a fixed color scale saturated at ±2, with exact values on hover/focus. The 576-byte count covers **only M**, excluding model parameters, input/history arrays, API traces, and application overhead. Known-cue recall uses clean keys; query noise affects the selected query and attention reference only. Retention happens per write, not with wall-clock time. The reference uses the complete final sequence even while playback shows an earlier memory step.

## Verify and reproduce

```sh
docker compose run --rm backend python -m pytest -q
docker compose run --rm backend python -m app.model
```

The second command trains in an ephemeral container; it does not replace the running service’s model. To extract its build-time weights and dataset:

```sh
docker compose cp backend:/app/artifacts ./exported-artifacts
```

The stack was built and started successfully on Docker Desktop, with both containers healthy. All 11 backend tests passed inside the Linux image, the TypeScript production build passed, and the frontend package audit returned zero vulnerabilities. The real Nginx/API/SQLite flow was checked before and after a backend restart. See [VALIDATION.md](docs/VALIDATION.md).

Model hashes identify the exact artifact. Seeded runs reproduce on the same numerical stack; floating point and QR signs can vary between numerical libraries/architectures. Repeated inference using one artifact and seed is deterministic, apart from the informational `elapsed_ms` field.

### Run without Docker (development)

Python 3.12 and Node 22.19+ are recommended. In a terminal at the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd backend
..\.venv\Scripts\python.exe -m app.model
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The dev proxy forwards `/api` to FastAPI. Local SQLite is `backend/data/trace.db`; Docker uses its own volume.

## Security design

Passwords are **hashed, not reversibly encrypted**, using scrypt (`N=16384, r=8, p=1`) and a random 16-byte salt. Random 256-bit session tokens are stored as SHA-256 digests in SQLite, expire after seven days and are revoked on logout. The browser receives an HttpOnly, SameSite=Strict cookie. No auth tokens are stored in localStorage. Origin validation protects mutation endpoints, ownership is checked on every notebook operation, queries are parameterized, request bodies and experiment sizes are bounded, and auth/computation endpoints are rate limited in the single-process demo. The backend container runs as a non-root user.

## Research and design sources

1. Kosowski et al. (2025), [The Dragon Hatchling](https://arxiv.org/abs/2509.26507). Synaptic working-memory interpretation; BDH-GPU architecture and author-reported language evaluations.
2. Engdahl et al. (2026), [BDH-CQ: In-Context Learning with Recurrent Latent Reasoning](https://arxiv.org/abs/2608.09888). Contextual adaptation and latent reasoning; author-reported ARC-AGI evaluation.
3. Yang, Kautz & Hatamizadeh (2024/ICLR 2025), [Gated Delta Networks](https://arxiv.org/abs/2412.06464). Gating and targeted memory updates. Our scalar controls omit learned gates and the complete architecture.
4. Behrouz, Zhong & Mirrokni (2025), [Titans](https://arxiv.org/abs/2501.00663). Neural memory at test time; contextual comparison, not an implementation here.
5. Pathway (2026), [From attention to synapses](https://pathway.com/research/bdh-explainer/bdh-architecture-derivation). Primary author explanation of the outer-product connection.

Visual research: [Linear’s interface hierarchy](https://linear.app/now/behind-the-latest-design-refresh), [Atlassian spacing](https://atlassian.design/foundations/spacing), and [Atlassian motion](https://atlassian.design/foundations/motion). TRACE applies a restrained navigation hierarchy, consistent spacing, warm highlights for active state, and short transitions. It does not copy their source or visual assets.

## Submission materials and ownership

The submission includes [one-page concept summary](docs/CONCEPT_SUMMARY.pdf), [technical blog PDF](docs/TECHNICAL_BLOG.pdf), [seven-slide pitch](output/Cyber_Leek_TRACE.pptx), [research claim register](docs/RESEARCH.md), [source/license record](docs/THIRD_PARTY.md), [AI disclosure](docs/AI_DISCLOSURE.md), exact dependency and asset inventories, trained weights and synthetic dataset. Source is published to the linked public repository; the runnable public artifact is linked above. The ZIP release includes source plus a ready-built public artifact. No Jupyter notebook is required: My notebook is the app's saved experiment collection.

AI assistance is substantial and disclosed in [AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md). Original project material is MIT-licensed to the extent applicable rights; third-party software retains its licenses. The team should be ready to explain the mechanism and limitations during judging. Publishing the materials does not submit an organizer's registration form.

### Rebuild supporting documents

Install Python 3.12+, then `python -m pip install reportlab==4.4.9`. Run `python scripts/create_submission_pdfs.py` to regenerate both PDFs in docs/. Standard PDF Helvetica fonts are used. The existing PPTX is editable in PowerPoint or compatible software; layout can vary with locally available fonts.

### Reproduce without the UI

After installing backend/requirements.txt in a virtual environment, run `python scripts/reproduce_claim.py` at the repository root. It asserts the collision and delta outputs and reports model hash and state size. For all numerical details, use the exported JSON from the app. Public source and weight hashes are retained in the release manifest. No API keys or cloud notebook are needed.
