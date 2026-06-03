// tools.js — capability wrappers using the HIGH-LEVEL @qvac/sdk functions.
//
// Verified against docs/QVAC_API.md. On Expo/iOS we use the SDK functions
// (loadModel/ocr/embed/ragIngest/ragSearch/transcribe) — NOT the low-level
// @qvac/*-onnx Bare addon classes. Models load lazily and are cached (8 GB device →
// load one capability model at a time; unload before loading the next heavy one).

import {
  loadModel, ocr, embed, ragIngest, ragSearch,
  OCR_LATIN_RECOGNIZER_1, GTE_LARGE_FP16,
} from "@qvac/sdk";

const RAG_WORKSPACE = process.env.AEGIS_WORKSPACE || "aegis-health-kb";

// ---- OCR (med labels / lab reports) ----------------------------------------
let _ocr = null;
export async function ocrModel() {
  if (!_ocr) {
    _ocr = await loadModel({
      modelSrc: OCR_LATIN_RECOGNIZER_1,
      modelType: "ocr",
      modelConfig: { langList: ["en"], useGPU: true, timeout: 30000 },
    });
  }
  return _ocr;
}
// agents.js calls tools.ocr(image) -> returns extracted text
export async function ocrText(image) {
  const modelId = await ocrModel();
  const { blocks } = ocr({ modelId, image });           // image: path | Buffer
  return (await blocks).map((b) => b.text).join("\n");
}
export { ocrText as ocr };

// ---- Embeddings + RAG (local records + drug/lab KB) ------------------------
let _embed = null;
export async function embedModel() {
  if (!_embed) _embed = await loadModel({ modelSrc: GTE_LARGE_FP16, modelType: "embeddings" });
  return _embed;
}
export async function embedText(text) {
  const modelId = await embedModel();
  const { embedding } = await embed({ modelId, text }); // text: string | string[]
  return embedding;
}
export async function ingest({ documents, workspace = RAG_WORKSPACE }) {
  const modelId = await embedModel();
  return ragIngest({ modelId, documents, workspace });
}
// agents.js calls tools.ragSearch({ query, k }) -> [{ text, ... }]
export async function ragSearchDocs({ query, k = 5, workspace = RAG_WORKSPACE }) {
  const modelId = await embedModel();
  const res = await ragSearch({ modelId, query, topK: k, workspace });
  const hits = Array.isArray(res) ? res : (res?.results ?? []);
  return hits.map((h) => ({ text: h.text ?? h.chunk ?? "", score: h.score, ...h }));
}
export { ragSearchDocs as ragSearch };

// ---- STT / TTS -------------------------------------------------------------
// CONFIRM in node_modules/@qvac/sdk/dist/*.d.ts before wiring (see docs/QVAC_API.md):
//   - STT: SDK `transcribe()` + the transcription model constant/modelType.
//   - TTS: SDK `tts()` if it exists on Expo, else the `@qvac/tts-onnx` addon (Chatterbox, 5 files).
const TODO = (what) => { throw new Error(`TODO: wire ${what} (confirm SDK signature first)`); };
export async function stt(_audio) { return TODO("STT (transcribe())"); }
export async function tts(_text)  { return TODO("TTS (@qvac/tts-onnx Chatterbox or SDK tts())"); }
