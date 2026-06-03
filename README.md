# Aegis — On-Device Health Companion

A fully **on-device, private** health companion built entirely on the **QVAC SDK + MedPsy**.
Photograph your meds and lab reports, ask questions by voice, and get private health
**education** + safety flags — **zero data ever leaves your devices**.

Built for **QVAC Hackathon I — Unleash Edge AI** (Tether) · **Psy Models track**.

> ⚠️ **Research / education use only. Not a medical device. Not medical advice.**
> Aegis provides patient *education* and decision *support* only. It does not diagnose,
> prescribe, or replace a licensed clinician. Any medical/licensing compliance for
> downstream use is the responsibility of the user.

---

## Why on-device?
Health data is the strongest possible case for local-first AI: with QVAC, inference runs
on your own phone/laptop — **no cloud, no per-request cost, works offline**, and your
records never leave your hardware.

## What it does
- **Multimodal intake** — OCR a medication label or lab report; transcribe a spoken question.
- **RAG** over your *local* health records + a *local* drug-interaction / lab-reference KB.
- **MedPsy reasoning** (LoRA-fine-tuned via QVAC Fabric) for clinical-adjacent education.
- **Multi-agent orchestration** with tool-calling (intake → retrieval → reasoning → **safety** → output).
- **Safety/guardrail agent** — prompt-injection resistance + escalation flagging.
- **P2P delegation** — the phone offloads heavy reasoning to your laptop over QVAC's
  Holepunch P2P, with a fully-offline fallback model on the phone.
- **TTS** read-back of the (safety-approved) answer.

Full build guide & rubric mapping: `docs/ARCHITECTURE.md`.

## Architecture
```
            ┌── Orchestrator (router; local vs P2P-delegated) ──┐
 Phone ─────┤  Intake   → OCR(label/lab) , STT(voice)           │
 (intake)   │  Retrieval→ RAG over local records + drug/lab KB   │
            │  Reasoning→ MedPsy (LoRA)   ◄── delegated ─────────┼──► Laptop
            │  Safety   → guardrail / prompt-injection           │   (heavy MedPsy
            │  Output   → TTS read-back + structured report      │    over QVAC P2P)
            └────────────────────────────────────────────────────┘
   Offline fallback: a tiny model runs fully on the phone if no mesh is present.
```

## Repo layout
| path | purpose |
|---|---|
| `src/audit.js` | **Audit-logging wrapper** over the QVAC core lifecycle (model loads/unloads, prompt, TTFT, tokens/sec) → `audit/run.jsonl` |
| `src/index.js` | Minimal runnable hello-world proving the audited core loop |
| `src/agents.js` | Multi-agent skeleton (orchestrator + intake/retrieval/reasoning/safety/output) |
| `src/tools.js` | Addon wrappers (OCR/STT/TTS/embeddings/RAG) — **stubbed pending confirmed addon APIs** |
| `docs/ARCHITECTURE.md` | Full spec, rubric mapping, demo & audit plan |
| `AUDIT_FORMAT.md` | Audit-log schema |
| `LICENSE` | Apache-2.0 (required by the hackathon) |

## Run (on the laptop = the declared demo device)
```bash
node --version   # requires Node >= 20
npm install
npm run hello    # loads a model, runs one audited completion, writes audit/run.jsonl
```
> `src/index.js` currently uses a placeholder small LLM. Swap in the **MedPsy** model
> constant once its exact `@qvac/sdk` export + `modelType` are confirmed.

## Hardware (declared for verification)
- **Main device (General/Psy):** laptop, ≤ 32 GB RAM — *fill in CPU/GPU/RAM/storage + system-profiler screenshot before submission.*
- **P2P client:** phone (Android/iOS) — *fill in model.*
- **Fine-tuning only:** single consumer GPU (RTX 4090) — produces the LoRA; **not** used for demo inference (no-cluster rule).

## ⚠️ Open API questions (confirm before filling stubs — do NOT guess)
The README upstream documents only the **core LLM lifecycle** (`loadModel`/`completion`/
`unloadModel`). These must be confirmed on the Tether Discord / `docs.qvac.tether.io`
before `src/tools.js` and the P2P/Fabric paths are implemented:
1. **MedPsy + LoRA** — load MedPsy via `loadModel`? apply a Fabric LoRA adapter on a single device? exact `modelSrc`/`modelType`?
2. **P2P delegation (Holepunch)** — usable from an Expo/mobile client to a Node/laptop peer today? API to delegate a `completion`?
3. **Addons** — `ocr-onnx`, Parakeet/Whisper STT, `onnx-tts`, `llamacpp-embed`, `rag` signatures; native tool-/function-calling helper?
4. **Early-bird** bonus cutoff — June 14 or 17?

## License
Apache-2.0. Not affiliated with or endorsed by Tether.
