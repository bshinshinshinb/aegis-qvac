# QVAC SDK — verified API reference (for Aegis)

Verified from the QVAC docs (in-repo at `tetherto/qvac/docs/website/content/docs`),
the SDK examples, and the MedPsy HF blog. **On Expo/iOS, use the high-level `@qvac/sdk`
functions — NOT the low-level `@qvac/*-onnx` Bare addon classes.**

> Two unverified items, **confirm in a browser / in `node_modules/@qvac/sdk/dist/*.d.ts`**:
> the exact MedPsy HF repo id + GGUF filename, and the exact spelling of `lora` in the
> SDK `modelConfig`.

## Model loading — `modelSrc` forms
`loadModel({ modelSrc, modelType, modelConfig?, onProgress? })`. `modelSrc` accepts: a
local/relative path, an **HTTP(S) URL** (e.g. a HF `…/resolve/main/…gguf`), a `pear://`
Hyperdrive key, a `registry://…` URI, or a **built-in constant** (e.g. `QWEN3_1_7B_INST_Q4`).

### MedPsy (our reasoning model)
- **Not** a built-in constant → load via HF URL. Two sizes: **1.7B** & **4B**, GGUF
  (BF16 + 7 quant tiers), llama.cpp/SDK-compatible. Base = **Qwen3-1.7B** (built-in
  `QWEN3_1_7B_INST_Q4` is a fallback/base).
- **For the 8 GB iPhone 17 Pro → MedPsy-1.7B, Q4_K_M (~1.28 GB) or Q5_K_M (~1.47 GB).**
```js
const id = await loadModel({
  // CONFIRMED filename (lowercase + "-imat"): Q4_K_M 1.28 GB, Q5_K_M 1.47 GB
  modelSrc: "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/medpsy-1.7b-q4_k_m-imat.gguf",
  modelType: "llm",
  modelConfig: { device: "gpu", ctx_size: 2048 },
  onProgress: (p) => console.log(p.percentage),
});
```
> All MedPsy-1.7B GGUF files (confirmed): `bf16` (4.07 GB), `q8_0` (2.17 GB),
> `q5_k_m-imat` (1.47 GB), `q4_k_m-imat` (1.28 GB), `iq4_nl-imat` (1.23 GB),
> `iq4_xs-imat` (1.18 GB), `iq3_m-imat` (1.03 GB), `iq3_xxs-imat` (888 MB).

## Completion (with first-class tool calling)
Load with `modelConfig:{ tools:true }`, pass `tools:[{ name, description, parameters: zodSchema, handler }]`.
Canonical surface is `run.events` (`contentDelta`, `toolCall`, `completionDone`, …) + `run.final`;
legacy `run.tokenStream` still works (deprecated — what `src/audit.js` uses for plain completions).
Tool-calling examples in repo use `QWEN3_1_7B_INST_Q4` (= MedPsy base) → works on MedPsy.

## OCR — SDK `ocr()`
```js
import { loadModel, ocr, OCR_LATIN_RECOGNIZER_1 } from "@qvac/sdk";
const m = await loadModel({ modelSrc: OCR_LATIN_RECOGNIZER_1, modelType: "ocr",
  modelConfig: { langList: ["en"], useGPU: true, timeout: 30000 } });
const { blocks } = ocr({ modelId: m, image: "/path/to/label.png" }); // image: path|Buffer
for (const b of await blocks) console.log(b.text, b.bbox, b.confidence);
```

## Embeddings — SDK `embed()`
```js
import { loadModel, embed, GTE_LARGE_FP16 } from "@qvac/sdk";
const m = await loadModel({ modelSrc: GTE_LARGE_FP16, modelType: "embeddings" }); // 1024-dim
const { embedding } = await embed({ modelId: m, text: "…" });   // text:string|string[]
```

## RAG — SDK functions (`@qvac/rag` under the hood)
`ragIngest`, `ragSearch`, `ragChunk`, `ragSaveEmbeddings`, `ragReindex`, `ragDelete*`,
`ragListWorkspaces`, `ragCloseWorkspace`. Bring-your-own vector store (SQLite-Vec/LanceDB/HyperDB).
```js
await ragIngest({ modelId: embedModelId, documents: ["…"], workspace: "health-kb" });
const hits = await ragSearch({ modelId: embedModelId, query: "…", topK: 5, workspace: "health-kb" });
```

## STT / TTS
- **STT:** SDK `transcribe()` / `transcribeStream` (also addons `@qvac/transcription-parakeet`,
  `@qvac/transcription-whispercpp`). *Confirm the SDK STT model constant + exact `transcribe()` signature in `.d.ts`.*
- **TTS:** `@qvac/tts-onnx` (Chatterbox; needs 5 model files; outputs 16-bit PCM @ 24 kHz).
  *Confirm whether an SDK-level `tts()` exists for Expo, else use the addon.*

## P2P delegation (Holepunch) — STRETCH; works but early
Provider (laptop): `startQVACProvider({ firewall })` → `publicKey`. Consumer (phone):
`loadModel({ …, delegate: { providerPublicKey, timeout: 60000, fallbackToLocal: true } })`.
Caveats: cold DHT bootstrap 15–45 s; no auto-reconnect; streams don't recover after suspend.

## Fabric fine-tuning (LoRA) → load adapter
SDK `finetune({ modelId, options:{ trainDatasetDir, validation, numberOfEpochs, learningRate,
loraModules:"attn_q,attn_k,attn_v,attn_o,ffn_gate,ffn_up,ffn_down", assistantLossOnly:true,
outputParametersDir } })` → `handle.progressStream` + `handle.result`. (Or CLI `llama-finetune-lora`
in `qvac-rnd-fabric-llm-finetune`, which has prebuilt binaries incl. iOS.) Load the adapter for
inference via `modelConfig.lora = "/abs/path/adapter.gguf"` (spelling: confirm in `.d.ts`).

## Expo / iOS — install & build
**Requirements:** iOS **17.0+, arm64, Metal, physical device only (NO simulator)**, **Expo ≥ 54**.
```bash
npm i @qvac/sdk react-native-bare-kit@^0.11.5 bare-rpc@^1.0.0
npm i -D bare-pack@^1.5.1
npx expo install expo-file-system expo-build-properties expo-device
```
`app.json` plugins: `"@qvac/sdk/expo-plugin"` (+ `expo-build-properties`). Then
`npx expo prebuild` → `npx expo run:ios --device`. Canonical mobile sample = the `App.tsx`
in `tutorials/expo.mdx`. (Tutorial pins `@qvac/sdk ^0.7.0`; API ref is `v0.11.x` — pin a current version.)
