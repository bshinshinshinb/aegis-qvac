# Aegis — iOS app (Expo)

Fully on-device MedPsy health-education companion. **iOS 17+, arm64, Metal, physical
device only (no simulator), Expo ≥ 54.** Build on a Mac with Xcode + an Apple ID.

## Files here
- `App.tsx` — model download/load (progress) + on-device chat with MedPsy.
- `config.ts` — model URL + prompts. **⚠️ confirm `MEDPSY_1_7B_Q4` from https://huggingface.co/qvac.**
- `lib/pipeline.ts` — OCR intake → RAG → MedPsy reasoning → safety guardrail (verified `@qvac/sdk` API).
- `app.json` — Expo config (includes `@qvac/sdk/expo-plugin`).

## Setup (on the Mac)
This folder holds the source; generate the Expo project shell, then run:
```bash
# 1) create the Expo shell (SDK >= 54), then copy App.tsx / config.ts / lib/ + app.json over
npx create-expo-app@latest aegis-app --template blank-typescript
cd aegis-app
# 2) QVAC + native deps (verified)
npm i @qvac/sdk react-native-bare-kit@^0.11.5 bare-rpc@^1.0.0
npm i -D bare-pack@^1.5.1
npx expo install expo-file-system expo-build-properties expo-device expo-image-picker
# 3) copy this folder's App.tsx, config.ts, lib/, app.json into the project (merge app.json plugins)
# 4) build to the iPhone 17 Pro (real device, plugged in / same network)
npx expo prebuild
npx expo run:ios --device
```
> First launch downloads MedPsy-1.7B (~1.3 GB) once, then runs fully offline. Pin a current
> `@qvac/sdk` version (the API ref is v0.11.x; the tutorial pins ^0.7.0).

## Before you build
1. **Confirm the MedPsy URL** in `config.ts` (one line) from a browser.
2. Verify STT/TTS signatures in `node_modules/@qvac/sdk/dist/*.d.ts` before wiring voice in `lib/pipeline.ts`.

See `../docs/QVAC_API.md` for the full verified API.
