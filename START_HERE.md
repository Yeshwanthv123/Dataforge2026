# Cyber Leek — TRACE submission

**DataForge 2026 · PS1: Explain the Frontier · Associative memory and fast weights**

- **Public artifact, no sign-in:** https://yeshwanthv123.github.io/Dataforge2026/
- **Public source:** https://github.com/Yeshwanthv123/Dataforge2026
- **All public submission files:** https://yeshwanthv123.github.io/Dataforge2026/submission/
- **Release downloads:** https://github.com/Yeshwanthv123/Dataforge2026/releases/latest

## What to submit

| Requirement | Included item |
|---|---|
| One-page concept summary PDF | docs/CONCEPT_SUMMARY.pdf |
| Technical blog PDF | docs/TECHNICAL_BLOG.pdf |
| Seven-slide pitch, Cyber Leek | output/Cyber_Leek_TRACE.pptx |
| Entire project and Docker setup | backend/, frontend/, compose.yaml, README.md |
| Recent primary papers and adjacent citations | docs/RESEARCH.md, both PDFs, Inside BDH in the app |
| Code/data/weights/assets/fonts/licenses | docs/THIRD_PARTY.md, docs/DEPENDENCIES.json, docs/ASSET_REGISTER.json, licenses/ |
| AI assistance disclosure | docs/AI_DISCLOSURE.md |
| Model and dataset details | docs/MODEL_CARD.md, backend/artifacts/ |
| Reproduction and test evidence | scripts/reproduce_claim.py, docs/VALIDATION.md |
| Setup for local components | README.md, docs/PUBLIC_DEPLOYMENT.md |

Start the full stack from the project directory with **docker compose up --build**, then open http://localhost:8080. No API key, GPU or pre-existing account is required. Register locally to use account-based notebooks. The public artifact runs the same Python model on the visitor's device and offers a device-local notebook. There is no Jupyter notebook component: “My notebook” is the app's experiment collection.

## Judge demonstration: under a minute after runtime loads

1. Open **Memory collision** and query Atlas: Amber is recalled despite the latest target being Violet.
2. Change **Write rule** to **Delta**: Violet is recalled, still using 72 cells.
3. Edit an association suggested by a judge. The worker recomputes the state and scores.
4. Explain why overlapping addresses can still interfere and why TRACE is not the complete BDH model.

The ZIP includes original source and a ready-built public artifact. Dependencies are installed by Docker; node_modules, private databases, credentials, temporary files and unlicensed organizer PDFs are deliberately excluded. This package is ready for submission; publishing it does not submit a hackathon registration form on the team's behalf.
