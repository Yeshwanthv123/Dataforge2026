# Primary research and claim register

Selected concept: **associative memory and fast weights**. Sources checked September 2026. These four primary papers fall within 2022–2026; TRACE is a teaching substrate, not a replication of their full architectures.

| Source | Mechanism and relevant comparison | Evidence and boundary |
|---|---|---|
| [1] Kosowski et al., **The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain** (2025), [arXiv:2509.26507](https://arxiv.org/abs/2509.26507) | Synaptic working memory, sparse positive activations, neuron-space linear attention and ReLU-low-rank transforms. | Author-reported language/translation experiments. TRACE implements a small signed-vector associative motif, omitting the complete BDH architecture. |
| [2] Engdahl et al., **BDH-CQ: In-Context Learning with Recurrent Latent Reasoning** (2026), [arXiv:2608.09888](https://arxiv.org/abs/2608.09888) | Contextual recurrent state and iterative latent reasoning have distinct roles; global parameters remain fixed during inference. | Paper reports 29.5% task pass@2 on public ARC-AGI-1 at 150M parameters. Section 5 describes a black-box audit by Bielik/NYU co-authors without weights access. This is not a TRACE replication; exact internal updates are proprietary. |
| [3] Yang, Kautz and Hatamizadeh, **Gated Delta Networks: Improving Mamba2 with Delta Rule** (2024; ICLR 2025), [arXiv:2412.06464](https://arxiv.org/abs/2412.06464) | Combines forgetting with targeted delta updates, balancing retention and correction. | Author-reported retrieval/language evaluation. TRACE's scalar controls do not implement learned gates or establish full-model speed/accuracy parity. |
| [4] Behrouz, Zhong and Mirrokni, **Titans: Learning to Memorize at Test Time** (2025), [arXiv:2501.00663](https://arxiv.org/abs/2501.00663) | Learns neural memory at test time and combines memory with attention-based processing. | Author-reported long-context experiments. Different memory expressivity and update cost; no matched hardware or full-system evaluation is run here. |

Further explanation: Pathway, [From attention to synapses: deriving BDH](https://pathway.com/research/bdh-explainer/bdh-architecture-derivation). This author explainer supplements the four papers; it is not counted as a separate primary paper.

## Claim-to-evidence mapping

| Claim in the submission | Evidence |
|---|---|
| Fixed-shape state trades explicit history for interference risk | Exact equations and backend/app/model.py; demonstrated by collision and overlap experiments. Related recurrent-state mechanisms: [1], [3]. |
| Delta updates can correct this repeated-key collision | Run scripts/reproduce_claim.py; Atlas/Amber, Atlas/Amber, Atlas/Violet; default unit strength and retention, zero noise and overlap. No universal repair claim. |
| BDH is relevant to the selected concept | Synaptic working-memory interpretation [1]; the app's Inside BDH module explains missing features. |
| BDH-CQ adds latent reasoning beyond memory | Distinction between contextual state S and reasoning workspace H in [2], section 3. TRACE has no latent reasoning loop. |
| Decoder scores 1,499/1,500 | backend/artifacts/metrics.json and included held-out data. This measures an easy synthetic classification task, not memory or general intelligence. |
| Memory state is 576 bytes | 9 × 8 × 8-byte float64 cells. Excludes decoder, inputs, histories, traces, software and runtime. |

## Evidence still missing

No formal learner study, independent TRACE reproduction, full BDH/CQ training, deployment study or apples-to-apples comparison of complete architectures. Fixed state does not mean unlimited lossless storage. Published benchmark gains are specific to their datasets and protocols. Public benchmark success does not establish production reliability. TRACE's explicit-token reference retains duplicate writes and is not a complete Transformer or a latest-value oracle.
