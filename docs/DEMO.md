# TRACE demo walkthrough

## The pitch

“AI memory sounds like a storage problem, but storing a trace and recalling the right thing are different. TRACE lets you predict, break and repair a tiny associative memory. Every color in the matrix comes from live Python computation.”

## Four-minute presentation

**0:00–0:30 — State the claim.** Open the app as a guest. Explain that the 9×8 matrix can accept new writes at fixed shape, but associations can compete. The learner needs only dot products and the idea of supervised learning.

**0:30–1:00 — Establish success.** Use Clean recall. Query Atlas: Amber matches the latest written target. Replay the four writes. Point out that a cell tooltip shows its exact value and update. The heatmap axes are features, not eight named colors mapped directly to columns.

**1:00–1:45 — Deliberate failure and repair.** Select Memory collision. The same key has Amber twice and Violet once. Say the prediction before revealing it: additive memory favors Amber. Ground truth is Violet. Change the write rule to Delta, so the model writes the correction instead of accumulating another copy. Recall becomes Violet while M still has 72 cells.

**1:45–2:15 — Test the capacity limit.** Select Interference. Shared cue directions make unrelated writes interfere with Atlas. Lower overlap to zero and recover Amber. Set overlap to one to show indistinguishable cues; a fixed-size matrix is not magically lossless storage.

**2:15–2:50 — Connect to BDH.** Open Inside BDH. Point to the distinction between slow trained parameters and fast changing state. Explain that the complete BDH-GPU architecture also includes sparse positive activation, learned low-rank transforms and richer recurrent structure. BDH-CQ adds demonstration-conditioned latent reasoning. TRACE illustrates a mechanism rather than reproducing those systems.

**2:50–3:20 — Show evidence.** Open Model & evidence. The decoder was trained on 6,000 generated examples; the 1,500 held-out examples measure noisy-symbol decoding only. The loss curve and hash come from the saved training artifact. Explain why this metric is different from memory recall.

**3:20–4:00 — End with a learner action.** Answer a guided question, then save an experiment to the notebook. Reopen it and change one variable. Export the trace and show that it contains input configuration, model hash and every matrix. Invite a judge to predict a new input before running it.

## Questions to be ready for

**What is actually trained?** An 8-input, 8-output softmax linear decoder: 64 weights and eight biases. It learns to decode noisy synthetic value vectors. The feature codebook and keys are constructed; the memory update rules are explicit.

**Why train such a small model?** It is sufficient to connect actual learning with an inspectable associative-memory substrate and it rebuilds without a GPU. Model size is not our educational contribution; controlled counterfactuals and visible state are.

**Why is Hebbian wrong in the collision demo?** It is not “broken”: it implements a different storage rule. With two Amber writes and one Violet write, their values accumulate. We define the target as the latest value, which rewards replacement rather than frequency.

**Why can Delta help?** For a unit-length key, strength one and retention one, writing `outer(k, v - M.T @ k)` makes the read at that key equal v. This may still affect other overlapping keys, so there is no universal guarantee for all associations.

**Is 576 bytes the whole application's memory usage?** No. It is the recurrent matrix alone. The UI intentionally stores the sequence and trace, and the model/API/database add overhead.

**Does this prove BDH is better than Transformers?** No. The comparison is an educational reference. BDH research claims must be evaluated on actual implementations and comparable tasks.

**Can it remember across sessions?** The application saves experiment data in SQLite. Trained model weights stay fixed; a fresh experiment initializes a new temporary matrix.

**What would you add next?** A larger independently evaluated associative-recall dataset, trainable cue projections, a side-by-side full BDH-GPU module, and learner-study evidence. These are future work, not current features.

## Before submission

- Replace team/author details in accompanying materials.
- Review and understand the AI-assisted code and claims.
- Record the actual working app, including the stress case.
- Publish the source repository and guest-accessible demo if submitting to the Pathway track.
- Review the one-page concept summary PDF and technical blog PDF.
- Keep secrets, local SQLite files, `.venv`, and `node_modules` out of the public repository.
