# Audit log format

`src/audit.js` appends one JSON object per line to `audit/run.jsonl`. This is our
transparent evidence trail for the hackathon's 3-stage verification. Every entry has a
`ts` (ISO-8601). Three event types:

### `model_load`
```json
{ "ts":"…", "event":"model_load", "modelId":"…", "modelType":"llm", "modelSrc":"…", "load_ms": 1234 }
```

### `inference`
Captures the required fields — prompt, tokens, TTFT, tokens/sec:
```json
{ "ts":"…", "event":"inference", "label":"reasoning", "modelId":"…",
  "prompt":"…", "prompt_messages": 3, "tokens": 142,
  "ttft_ms": 210, "total_ms": 3050, "tokens_per_sec": 49.8 }
```

### `model_unload`
```json
{ "ts":"…", "event":"model_unload", "modelId":"…", "unload_ms": 12 }
```

**Notes**
- `ttft_ms` = wall time from `completion()` call to first streamed token.
- `tokens_per_sec` = tokens / (total − ttft) seconds (generation throughput, excludes TTFT).
- Confirm whether the hackathon mandates a *specific* preset schema; if so, add a small
  adapter that maps these fields to it (keep this internal log as the source of truth).
- Override the path with `AEGIS_AUDIT=path/to.jsonl`.
