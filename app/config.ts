// config.ts — single source of truth for model + app constants.
//
// ⚠️ CONFIRM THIS URL: HF is unreachable from the build server, so this is the inferred
// convention. Open https://huggingface.co/qvac in a browser, find the MedPsy-1.7B GGUF
// repo, and paste the exact `…/resolve/main/…Q4_K_M.gguf` link here. One-line swap.
export const MEDPSY_1_7B_Q4 =
  "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/MedPsy-1.7B-Q4_K_M.gguf";

// Built-in fallback constant for dev before the URL is confirmed (import from @qvac/sdk).
export const USE_FALLBACK = false; // set true to use QWEN3_1_7B_INST_Q4 instead

export const SYSTEM_PROMPT =
  "You are a careful on-device health-EDUCATION assistant (research/education use only). " +
  "You are NOT a clinician: you never give diagnoses, prescriptions, or treatment decisions. " +
  "Explain clearly and recommend consulting a professional for anything clinical.";

export const CTX_SIZE = 2048;
