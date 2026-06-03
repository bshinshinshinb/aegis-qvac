# Aegis — architecture & build plan

The full, continuously-updated build guide (rubric mapping, fine-tuning plan, 3-week
timeline, demo plan, Discord-verify checklist) lives at:

**https://shinsvr.tail254930.ts.net/hacka/medpsy/guide** (private tailnet)

This file is the in-repo summary.

## Multi-agent pipeline
| agent | role | QVAC capability | rubric criterion |
|---|---|---|---|
| Orchestrator | routes request; local-vs-P2P decision | completion + Holepunch | Capabilities, Performance |
| Intake | photo/voice → structured text | OCR + STT | Multimodal, Innovation |
| Retrieval | RAG over local records + drug/lab KB | embeddings + rag | Capabilities |
| Reasoning | clinical-adjacent education | **MedPsy (LoRA)** | Model Usage & Coverage |
| Safety | prompt-injection resistance, escalation | completion + policy | **Originality (security)** |
| Output | TTS read-back + report | TTS | UX |

## Inference placement (Performance criterion)
1. **P2P-delegated:** phone → laptop peer over QVAC Holepunch for heavy MedPsy reasoning.
2. **Local:** run on the laptop directly.
3. **Offline fallback:** tiny model fully on the phone when no mesh is present.
Log TTFT/tokens-per-sec for each path (see `AUDIT_FORMAT.md`) to make the P2P win measurable.

## Fine-tuning (QVAC Fabric)
LoRA-fine-tune MedPsy (or a small base) on a **public** medical-QA / drug-interaction
instruction set (disclose sources) on a **single** RTX 4090. Ship a before/after eval in
the demo. The demo's *inference* runs on one consumer device (no-cluster rule); the 4090
is fine-tuning only.

## Build order
See the live guide's "3-week timeline". Critical path = confirm the four Open API
questions (README) on Discord **before** implementing `src/tools.js`, P2P, and Fabric.
