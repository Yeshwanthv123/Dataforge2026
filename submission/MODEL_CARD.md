# TRACE model card

## Scope

Educational associative memory and fast weights. This model does not understand words or colors, solve ARC puzzles, reproduce BDH, or model biological neurons. The UI names are labels for artificial vectors. No external inference service is called.

## Exact computation

Let each key and value be a column vector. Generate an orthogonal 8×8 codebook using QR decomposition of a seeded Gaussian matrix. Each row gives the 8-dimensional value code for a label.

For cue i, the nine-dimensional key is `k_i = sqrt(1-rho) e_i + sqrt(rho) e_8`. Its norm is one. Distinct keys have dot product `rho`. At rho=0 cues are orthogonal; at rho=1 they are identical. Query noise is a seeded nine-dimensional Gaussian with standard deviation sigma, added before normalizing the query.

Initialize `M = zeros(9,8)`. For each key/value pair:

```text
Hebbian:
    M = lambda * M + eta * outer(k, v)

Delta:
    M_bar = lambda * M
    residual = v - M_bar.T @ k
    M = M_bar + eta * outer(k, residual)

Read:
    r = M.T @ q
    p = softmax(W.T @ r + b)
```

NumPy uses one-dimensional arrays and equivalent row-vector products. The decoder has W of shape 8×8 and b of shape 8. Predictions use argmax, except a readout norm at or below 1e-8 produces `null` (No signal). Scores are uncalibrated; zero readout can still produce nonuniform softmax values because of learned biases, but no answer is returned.

The latest written value for each cue is the target. That target is independent of whether the model successfully retains it. The clean-key aggregate recall excludes never-written cues and uses noise-free keys, while the selected query can include noise. A query for an unseen cue can still generate a prediction through interference; its correctness is undefined, and ground truth says Not written yet.

## Training protocol

Seed: 42. Generate the codebook, 6,000 train labels and 6,000 noisy code vectors (Gaussian noise, std 0.18), then separately draw 1,500 test labels/noisy vectors. Initialize W with Gaussian std 0.01 and zero bias. Optimize cross-entropy with full-batch gradient descent, learning rate 0.7, L2 weight penalty 0.0001, for 200 updates. Record loss at epoch 0 and every ten updates. The test set is never used in gradient updates or for hyperparameter selection in the implementation.

Local artifact: test accuracy 0.9993333333333333 (1,499 / 1,500), training loss 2.07635 → 0.11258. This easy synthetic classification problem is intentionally small enough to rebuild on a CPU. It is not evidence of robust generalization beyond its data distribution. Multi-write memory mixtures can differ substantially from training inputs.

Outputs in `backend/artifacts`: `decoder.npz` (codes, W, b); `synthetic_dataset.npz` (train/test arrays); `metrics.json` (counts, history, hash and evaluation). The same outputs are generated inside the Docker image at build time. Existing weights are reused on server start.

## Reference

The explicit-token comparison retains each key and value separately. It computes `softmax(8 * q dot k_t)` over all written tokens and decodes the weighted sum of value codes. It uses no retention or delta correction and includes duplicates. It is an interpretable attention reference, not an oracle, a full Transformer, or a fair architecture benchmark. Scores/storage refer to the final sequence, independent of the playback cursor.

## Limits and measurement definitions

- 8 labels, 8 cues, 1–32 writes per API request; all model features are constructed rather than learned end-to-end.
- The 72-cell, 576-byte claim concerns M alone, stored in float64. Input storage, trace logging, decoder parameters, SQLite records and HTTP serialization are additional memory costs. The app stores every frame to enable playback; the teaching recurrence itself does not need all frames.
- The mathematical recurrence accepts further writes without changing M’s shape. The UI cap limits demonstration size; it does not prove unbounded useful memory or numerical stability under unlimited writes.
- Constant scalar retention and write strength simplify learned gating. Our delta mode is not Gated DeltaNet, and our Hebbian mode is not BDH-GPU.
- Color is saturated at ±2. Exact rounded values are available per cell; exported states use five decimals, while computation uses float64 precision.
- `elapsed_ms` measures only Python experiment computation. It excludes network, browser rendering, startup and training. No user-perceived latency claim is based on it.
- Retention runs per write; nothing fades merely because the page remains open.
- At overlap=1 all clean cues are identical. No memory algorithm can infer an arbitrary cue identity from identical vectors alone.
- Both persistence and recall are distinct from continual cross-session learning. Saved JSON lets the application revisit a trace; it does not update trained parameters.

## Relationship to research

BDH’s conceptual synaptic memory and its GPU formulation motivate showing state alongside parameters [Kosowski et al., 2025](https://arxiv.org/abs/2509.26507). Our rectangular matrix isolates an outer-product write/read motif. It omits full BDH’s sparse positive activations, trained low-rank transformations, layer structure and positional dynamics. Value vectors here can be negative, unlike the nonnegative activity motif discussed in BDH.

BDH-CQ uses recurrent memory and latent reasoning to learn from demonstrations [Engdahl et al., 2026](https://arxiv.org/abs/2608.09888). Its ARC evaluations are author-reported full-system evidence, not validation of TRACE. Gated DeltaNet combines gates with delta updates [Yang et al., 2024](https://arxiv.org/abs/2412.06464); Titans explores a trainable neural memory at test time [Behrouz et al., 2025](https://arxiv.org/abs/2501.00663). Neither is reproduced by this prototype.
