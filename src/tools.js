// tools.js — thin wrappers over QVAC addon capabilities used by the agents.
//
// IMPORTANT: these depend on addon APIs whose exact signatures are NOT yet confirmed
// from the docs (the README only documents the core LLM lifecycle). Per our "know the
// API before coding" rule, each wrapper currently throws NotImplemented with the addon
// name to integrate. Fill these in ONCE the signatures are confirmed via
// docs.qvac.tether.io or the Tether Discord (see README "Open API questions").
//
// Addons to integrate:
//   ocr        -> ocr-onnx
//   stt        -> lib-infer-parakeet  (or transcription-whispercpp)
//   tts        -> lib-infer-onnx-tts
//   embed      -> lib-infer-llamacpp-embed
//   ragSearch  -> rag package (document ingestion + vector search)

const TODO = (addon) => { throw new Error(`NotImplemented: integrate '${addon}' addon (confirm API first)`); };

export async function ocr(_image)            { return TODO("ocr-onnx"); }
export async function stt(_audio)            { return TODO("lib-infer-parakeet (STT)"); }
export async function tts(_text)             { return TODO("lib-infer-onnx-tts"); }
export async function embed(_text)           { return TODO("lib-infer-llamacpp-embed"); }
export async function ragSearch({ query, k } = {}) { return TODO("rag (vector search)"); }
