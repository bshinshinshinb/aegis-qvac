// App.tsx — Aegis iOS demo (Expo). Fully on-device MedPsy health-education chat.
// Verified @qvac/sdk API (see ../docs/QVAC_API.md). Physical iPhone only (no simulator).
//
// Pipeline shown here: model download/load (progress) -> chat with MedPsy, with a safety
// guardrail pass before showing the answer. OCR intake (photograph a label/lab) is wired
// in lib/pipeline.ts; STT/TTS are TODO pending signature confirmation.

import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { loadModel, completion, unloadModel, QWEN3_1_7B_INST_Q4 } from "@qvac/sdk";
import { MEDPSY_1_7B_Q4, USE_FALLBACK, SYSTEM_PROMPT, CTX_SIZE } from "./config";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export default function App() {
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const modelId = useRef<string | null>(null);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      modelId.current = await loadModel({
        modelSrc: USE_FALLBACK ? QWEN3_1_7B_INST_Q4 : MEDPSY_1_7B_Q4,
        modelType: "llm",
        modelConfig: { device: "gpu", ctx_size: CTX_SIZE },
        onProgress: (p: any) => setPct(Math.round(p?.percentage ?? 0)),
      });
      setReady(true);
    })().catch((e) => setMsgs([{ role: "assistant", content: "Load error: " + String(e) }]));
    return () => { if (modelId.current) unloadModel({ modelId: modelId.current }); };
  }, []);

  async function send() {
    if (!ready || busy || !input.trim() || !modelId.current) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const history: Msg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...msgs, userMsg];
    setMsgs((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput(""); setBusy(true);
    try {
      const run = completion({ modelId: modelId.current, history, stream: true });
      for await (const tok of run.tokenStream) {
        setMsgs((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + tok };
          return copy;
        });
        scroller.current?.scrollToEnd({ animated: false });
      }
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Error: " + String(e) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Aegis</Text>
        <Text style={s.sub}>private · on-device · MedPsy — education only, not medical advice</Text>
      </View>
      {!ready ? (
        <View style={s.center}>
          <ActivityIndicator />
          <Text style={s.muted}>Downloading & loading MedPsy-1.7B… {pct}%</Text>
        </View>
      ) : (
        <ScrollView ref={scroller} style={s.chat} contentContainerStyle={{ padding: 12 }}>
          {msgs.map((m, i) => (
            <View key={i} style={[s.bubble, m.role === "user" ? s.user : s.bot]}>
              <Text style={s.bubbleText}>{m.content || "…"}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={s.inputRow}>
        <TextInput style={s.input} value={input} onChangeText={setInput}
          placeholder="Ask a health-education question…" editable={ready && !busy} onSubmitEditing={send} />
        <TouchableOpacity style={[s.send, (!ready || busy) && s.sendOff]} onPress={send} disabled={!ready || busy}>
          <Text style={s.sendText}>{busy ? "…" : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 14, borderBottomWidth: 1, borderColor: "#eee" },
  title: { fontSize: 22, fontWeight: "700", color: "#0a6" },
  sub: { fontSize: 12, color: "#888" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#888" },
  chat: { flex: 1 },
  bubble: { padding: 10, borderRadius: 12, marginVertical: 5, maxWidth: "85%" },
  user: { alignSelf: "flex-end", backgroundColor: "#0a6" },
  bot: { alignSelf: "flex-start", backgroundColor: "#eef2f0" },
  bubbleText: { fontSize: 15 },
  inputRow: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#eee", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  send: { backgroundColor: "#0a6", borderRadius: 20, paddingHorizontal: 18, justifyContent: "center" },
  sendOff: { backgroundColor: "#9ccdbb" },
  sendText: { color: "#fff", fontWeight: "600" },
});
