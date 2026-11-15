# IGNIS AI

A research workspace for exploring microgravity combustion experiments, comparing measurements, asking evidence-based questions, analyzing imagery, and finding studies relevant to space mission scenarios.

## Explore the project

| Location | Contents |
| --- | --- |
| [Documentation](docs/README.md) | Product presentation, voice-over script, technical handoff, and historical reviews |
| [Frontend](frontend/README.md) | Research workspace and interface documentation |
| `ai-service/` | Scientific data, document retrieval, visual analysis, and mission advisor services |
| [Review artifacts](artifacts/README.md) | Screenshots, audit tooling, and verification output |
| `IGNIS-AI-FlameInFreefall/` | Existing standalone checkout with its own Git history |

## Run locally

Use the existing Windows launchers from the project root:

1. Run `start.bat` to start the research service.
2. Run `start-frontend.bat` to start the interface.
3. Open the local address printed by the frontend launcher.

For setup and detailed commands, see the [frontend guide](frontend/README.md). Hosting instructions are in the [deployment guide](frontend/VERCEL_DEPLOYMENT.md).

## Product documents

- [Pitch report](docs/product/IGNIS_AI_Pitch_Report.md)
- [Voice-over script](docs/product/IGNIS_AI_Voice_Over.md)
- [Frontend and backend handoff](docs/technical/IGNIS_AI_Frontend_Handoff.md)
- [Historical UX review](docs/reviews/UX-REVIEW.md)

## Repository layout

Documentation lives in `docs/`, while visual review captures live in `artifacts/ux-review/screenshots/`. Source code and runtime assets remain in their application directories.

The root setup, launch, data-preparation, SQL, and classification files retain their existing locations because project tools use these paths. Environment files contain local configuration and should remain private.
