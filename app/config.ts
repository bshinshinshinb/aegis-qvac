// config.ts — single source of truth for model + app constants.
//
// MedPsy-1.7B GGUF (confirmed from qvac/MedPsy-1.7B-GGUF "Files" tab — lowercase + "-imat").
const HF = "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main";
export const MEDPSY_1_7B_Q4 = `${HF}/medpsy-1.7b-q4_k_m-imat.gguf`; // 1.28 GB — default for 8 GB device
export const MEDPSY_1_7B_Q5 = `${HF}/medpsy-1.7b-q5_k_m-imat.gguf`; // 1.47 GB — higher quality
// Smaller options if RAM/disk is tight: medpsy-1.7b-iq4_xs-imat.gguf (1.18 GB), iq3_m (1.03 GB).

// Built-in fallback constant for dev before the URL is confirmed (import from @qvac/sdk).
export const USE_FALLBACK = false; // set true to use QWEN3_1_7B_INST_Q4 instead

export const SYSTEM_PROMPT =
  "You are a careful on-device health-EDUCATION assistant (research/education use only). " +
  "You are NOT a clinician: you never give diagnoses, prescriptions, or treatment decisions. " +
  "Explain clearly and recommend consulting a professional for anything clinical.";

export const CTX_SIZE = 2048;
