// index.js — minimal runnable hello-world proving the audited QVAC core loop with MedPsy.
// Run on the MacBook for quick API validation (the iOS app reuses this logic):
//   npm install && npm run hello
//
// MedPsy-1.7B is loaded via a Hugging Face GGUF URL (it is NOT a built-in SDK constant).
// ⚠️ CONFIRM the exact repo id + filename in a browser at https://huggingface.co/qvac
//    before relying on it — the URL below is the inferred convention (see docs/QVAC_API.md).

import { QWEN3_1_7B_INST_Q4 } from "@qvac/sdk";
import { auditedLoadModel, auditedUnloadModel, complete, AUDIT_PATH } from "./audit.js";

// MedPsy-1.7B, Q4_K_M (~1.28 GB) — right size for an 8 GB device.
const MEDPSY_1_7B_Q4 =
  "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/MedPsy-1.7B-Q4_K_M.gguf"; // CONFIRM
// Fallback / base model (built-in constant) for offline dev before MedPsy URL is confirmed:
const USE_FALLBACK = process.env.AEGIS_FALLBACK === "1";

async function main() {
  const modelSrc = USE_FALLBACK ? QWEN3_1_7B_INST_Q4 : MEDPSY_1_7B_Q4;
  console.log(`[aegis] loading ${USE_FALLBACK ? "Qwen3-1.7B (fallback)" : "MedPsy-1.7B"}…`);
  const modelId = await auditedLoadModel({
    modelSrc,
    modelType: "llm",
    modelConfig: { device: "gpu", ctx_size: 2048 },
    onProgress: (p) => process.stdout.write(`\r[load] ${p?.percentage ?? JSON.stringify(p)}%   `),
  });
  console.log("\n[aegis] loaded:", modelId);

  const history = [
    { role: "system", content: "You are a careful on-device health-EDUCATION assistant (research/education use only). You are NOT a clinician and do not give diagnoses, prescriptions, or treatment decisions." },
    { role: "user", content: "In one sentence, what is a drug-drug interaction?" },
  ];

  process.stdout.write("[aegis] > ");
  const answer = await complete({ modelId, history, label: "hello" });
  console.log("\n[aegis] answer:", answer.trim());

  await auditedUnloadModel({ modelId });
  console.log(`[aegis] done. audit log -> ${AUDIT_PATH}`);
}

main().catch((e) => { console.error("[aegis] error:", e); process.exit(1); });
