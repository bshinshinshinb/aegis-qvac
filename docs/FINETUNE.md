# Fabric LoRA fine-tune — MedPsy-1.7B (the differentiator)

Goal: a small, domain-sharpened LoRA adapter on top of MedPsy-1.7B that measurably
improves our target task (medication-interaction / lab-value patient *education*), shown
as a **before/after eval** in the demo. Most teams won't fine-tune — this scores
"Technical execution" + "QVAC usage (full stack)."

> Runs on a **single** consumer GPU (your RTX 4090) — single-GPU is allowed; the no-cluster
> rule is about *inference*. Demo inference still runs on the iPhone.

## Data (allowed by the rules)
- **`qvac/GenesisI` / `qvac/GenesisII`** datasets (HF) — explicitly permitted; use as base instruction data.
- Optional public medical-QA (disclose sources): MedQA / MedMCQA-style instruction pairs,
  filtered to medication/lab education.
- Format: JSONL chat pairs, e.g. `{"messages":[{"role":"user","content":"…"},{"role":"assistant","content":"…"}]}`
  (confirm the exact schema `finetune()` / `llama-finetune-lora` expects from the example dataset).
- **Compliance:** keep all data education/research-oriented; no real patient data.

## Train — two options
### (A) SDK `finetune()` (preferred — same stack as the app)
```js
import { finetune, loadModel, /* MedPsy base or */ QWEN3_1_7B_INST_Q4 } from "@qvac/sdk";
const modelId = await loadModel({ modelSrc: "<medpsy-1.7b base gguf>", modelType:"llm",
  modelConfig:{ device:"gpu", ctx_size:1024 } });
const h = finetune({ modelId, options:{
  trainDatasetDir: "./data/train.jsonl",
  validation: { type:"dataset", path:"./data/eval.jsonl" },
  numberOfEpochs: 4, learningRate: 1e-5, lrMin: 1e-8,
  loraModules: "attn_q,attn_k,attn_v,attn_o,ffn_gate,ffn_up,ffn_down",
  assistantLossOnly: true,
  checkpointSaveDir: "./results/checkpoints", outputParametersDir: "./results",
}});
for await (const t of h.progressStream) console.log(t.global_steps, t.loss);
await h.result;
```
### (B) CLI `llama-finetune-lora` (`qvac-rnd-fabric-llm-finetune`, prebuilt binaries incl. iOS)
```bash
./bin/llama-finetune-lora -m medpsy-1.7b-q8_0.gguf -f data/train.jsonl \
  --assistant-loss-only -c 128 -b 128 -ub 128 -ngl 999 -fa off \
  --learning-rate 1e-5 --lr-min 1e-8 --lr-scheduler cosine --warmup-ratio 0.1 \
  --num-epochs 8 --lora-modules "attn_q,attn_k,attn_v,attn_o,ffn_gate,ffn_up,ffn_down"
```

## Use the adapter for inference (on device)
```js
loadModel({ modelSrc: "<medpsy gguf>", modelType:"llm",
  modelConfig:{ device:"gpu", ctx_size:2048, lora:"/abs/path/adapter.gguf" } }); // confirm `lora` spelling in .d.ts
```

## Eval (for the demo)
Hold out N medication/lab Q&A; score base MedPsy-1.7B vs LoRA on exact-match / rubric;
report the delta on-screen. Keep the eval set + script in `finetune/` (gitignored runs).

## ⚠️ Environment note
HF + the datasets are **unreachable from shinsvr** (firewalled). Either download GenesisI/II
on the Mac (or a HF-reachable host) and copy to the 4090 box, or run the whole fine-tune on
a host that can reach HF. The 4090 box only needs the GGUF base + the JSONL data locally.
