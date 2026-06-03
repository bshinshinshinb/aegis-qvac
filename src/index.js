// index.js — minimal runnable "hello-world" proving the audited QVAC core loop works.
// Uses ONLY the confirmed core API. Once MedPsy's exact modelSrc export is confirmed,
// swap the model constant below. Run on the laptop (the declared demo device):
//   npm install && npm run hello
//
// NOTE: MODEL is a placeholder small LLM. Replace with the MedPsy constant once the
// exact `@qvac/sdk` export name + modelType for MedPsy are confirmed (Discord Q1).

import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { auditedLoadModel, auditedUnloadModel, complete, AUDIT_PATH } from "./audit.js";

const MODEL = LLAMA_3_2_1B_INST_Q4_0; // TODO: replace with MedPsy model constant

async function main() {
  console.log("[aegis] loading model…");
  const modelId = await auditedLoadModel({
    modelSrc: MODEL,
    modelType: "llm",
    onProgress: (p) => process.stdout.write(`\r[load] ${JSON.stringify(p)}   `),
  });
  console.log("\n[aegis] model loaded:", modelId);

  const history = [
    { role: "system", content: "You are a careful, on-device health-education assistant. You are NOT a doctor and do not give medical advice." },
    { role: "user", content: "In one sentence, what is a drug-drug interaction?" },
  ];

  process.stdout.write("[aegis] > ");
  const answer = await complete({ modelId, history, label: "hello" });
  console.log("\n[aegis] answer:", answer.trim());

  await auditedUnloadModel({ modelId });
  console.log(`[aegis] done. audit log -> ${AUDIT_PATH}`);
}

main().catch((e) => { console.error("[aegis] error:", e); process.exit(1); });
