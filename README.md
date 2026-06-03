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
| `src/tools.js` | Capability wrappers via high-level `@qvac/sdk` functions: **OCR / embeddings / RAG implemented**; STT/TTS pending signature confirmation |
| `docs/QVAC_API.md` | **Verified** QVAC SDK API reference (model loading, OCR/embed/RAG, tools, P2P, Fabric, Expo/iOS) |
| `docs/ARCHITECTURE.md` | Full spec, rubric mapping, demo & audit plan |
| `AUDIT_FORMAT.md` | Audit-log schema |
| `LICENSE` | Apache-2.0 (required by the hackathon) |

## Targets
- **Primary (demo):** iPhone 17 Pro — fully-offline Expo app. **`app/` scaffolded** (`App.tsx` chat + `lib/pipeline.ts` OCR→RAG→MedPsy→safety + `app.json`); generate the Expo shell on the Mac per `app/README.md`.
- **Quick API testing:** Node hello-world on the MacBook (below) — fastest way to validate the audited core loop before wiring the RN UI.
- **P2P delegation:** optional stretch (both devices are ~8 GB, so not the centerpiece).

### Node quick-test (MacBook)
```bash
node --version   # requires Node >= 20
npm install
npm run hello    # loads a model, runs one audited completion, writes audit/run.jsonl
```
> `src/index.js` uses a placeholder small LLM. Swap in the **MedPsy** constant once its
> exact `@qvac/sdk` export + `modelType` are confirmed (Discord Q1).

### iOS app (Expo) — scaffold on the Mac
**Requirements (verified):** iOS **17+, arm64, Metal, physical device only (NO simulator)**,
**Expo ≥ 54**, Xcode + an Apple ID (free provisioning works for on-device testing).
```bash
npx create-expo-app app && cd app
npm i @qvac/sdk react-native-bare-kit@^0.11.5 bare-rpc@^1.0.0
npm i -D bare-pack@^1.5.1
npx expo install expo-file-system expo-build-properties expo-device
# app.json -> expo.plugins: ["@qvac/sdk/expo-plugin", ["expo-build-properties", {...}]]
npx expo prebuild
npx expo run:ios --device     # deploy to the iPhone 17 Pro (real device)
```
On Expo we call the **high-level SDK functions** (`loadModel`/`completion`/`ocr`/`embed`/
`ragSearch`/`transcribe`) and reuse the `src/` logic — NOT the Bare addon classes.
See `docs/QVAC_API.md` for verified signatures.

## Hardware (declared for verification)
- **Phone (primary demo device):** iPhone 17 Pro (A19 Pro), iOS — Expo client.
- **Laptop:** MacBook, **8 GB RAM** (Apple Silicon — *confirm chip + macOS + free disk*). Dev machine + optional P2P peer.
- **Fine-tuning only:** single RTX 4090 — produces the LoRA; **not** used for demo inference (no-cluster rule).
- *Memory note:* 8 GB is tight → use the smallest MedPsy + Q4, and load/unload models sequentially (one resident at a time).

## API status — mostly RESOLVED (see `docs/QVAC_API.md`)
Verified from the QVAC docs/examples + MedPsy blog:
- ✅ **MedPsy** — load `MedPsy-1.7B` (Q4_K_M ≈1.28 GB) via a HF GGUF **URL** (not a built-in constant). Base = Qwen3-1.7B.
- ✅ **OCR / embeddings / RAG** — SDK functions `ocr()`, `embed()`, `ragIngest/ragSearch` (implemented in `src/tools.js`).
- ✅ **Tool calling** — first-class in `completion({ tools:[…] })` with `modelConfig:{tools:true}`.
- ✅ **Fabric LoRA** — SDK `finetune()` or the `qvac-rnd-fabric-llm-finetune` CLI; load adapter via `modelConfig.lora`.
- ✅ **P2P delegation** — `startQVACProvider()` + `loadModel({ delegate:{…} })` (works, early; stretch goal).

**Still to confirm (2 items):**
1. Exact **MedPsy HF repo id + filename** (open https://huggingface.co/qvac in a browser, copy the `resolve/main/…gguf` URL).
2. **STT/TTS** SDK signatures + model constants (`transcribe()` model; SDK `tts()` vs `@qvac/tts-onnx`) — confirm in `node_modules/@qvac/sdk/dist/*.d.ts`.
3. **Early-bird** bonus cutoff — June 14 or 17 (organizers only).

## License
Apache-2.0. Not affiliated with or endorsed by Tether.
