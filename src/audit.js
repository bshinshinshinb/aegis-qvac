// audit.js — transparent audit-logging wrapper around the QVAC SDK core lifecycle.
//
// The hackathon's 3-stage verification rewards HONEST, consistent artifacts. Every
// model load/unload and every inference call is logged in a structured JSONL line
// capturing the required fields: model loads/unloads, prompt, tokens, TTFT, tokens/sec.
//
// Built ONLY against the confirmed QVAC core API:
//   loadModel({ modelSrc, modelType, onProgress }) -> modelId
//   completion({ modelId, history, stream }) -> { tokenStream }   // async iterable of tokens
//   unloadModel({ modelId })
// Addon capabilities (OCR/STT/TTS/embeddings/RAG/P2P) are wrapped in src/tools.js
// once their exact signatures are confirmed (do not guess — see README "Open API questions").

import { loadModel, completion, unloadModel } from "@qvac/sdk";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const AUDIT_PATH = process.env.AEGIS_AUDIT || "audit/run.jsonl";
mkdirSync(dirname(AUDIT_PATH), { recursive: true });

function record(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  appendFileSync(AUDIT_PATH, line + "\n");
  return entry;
}

// hrtime-based millisecond clock (monotonic; safe for TTFT/throughput)
const now = () => Number(process.hrtime.bigint() / 1000000n);

export async function auditedLoadModel(opts) {
  const t0 = now();
  const modelId = await loadModel(opts);
  record({
    event: "model_load",
    modelId,
    modelType: opts.modelType,
    modelSrc: String(opts.modelSrc),
    load_ms: now() - t0,
  });
  return modelId;
}

export async function auditedUnloadModel({ modelId }) {
  const t0 = now();
  await unloadModel({ modelId });
  record({ event: "model_unload", modelId, unload_ms: now() - t0 });
}

// Wraps a streaming completion: re-yields every token unchanged while measuring
// TTFT (time-to-first-token), total tokens, wall time, and tokens/sec. Returns an
// async generator so callers iterate exactly as they would the raw tokenStream.
export async function* auditedCompletion({ modelId, history, label = "completion" }) {
  const t0 = now();
  let ttft = null;
  let tokens = 0;
  const result = completion({ modelId, history, stream: true });
  try {
    for await (const token of result.tokenStream) {
      if (ttft === null) ttft = now() - t0;
      tokens++;
      yield token;
    }
  } finally {
    const wall = now() - t0;
    const gen_ms = ttft === null ? wall : wall - ttft;
    record({
      event: "inference",
      label,
      modelId,
      prompt: history?.[history.length - 1]?.content ?? null,
      prompt_messages: history?.length ?? null,
      tokens,
      ttft_ms: ttft,
      total_ms: wall,
      tokens_per_sec: tokens > 0 && gen_ms > 0 ? +(tokens / (gen_ms / 1000)).toFixed(2) : 0,
    });
  }
}

// Convenience: run a completion to completion and return the full string + audit row.
export async function complete({ modelId, history, label }) {
  let text = "";
  for await (const tok of auditedCompletion({ modelId, history, label })) text += tok;
  return text;
}

export { AUDIT_PATH };
