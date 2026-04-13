"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickReplies } from "./quick-replies";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES_PREFIX = "[QUICK_REPLIES]:";

function splitQuickReplies(content: string): { text: string; options: string[] } {
  const lines = content.split("\n");
  const qrLine = lines.find((l) => l.trim().startsWith(QUICK_REPLIES_PREFIX));
  if (!qrLine) return { text: content, options: [] };
  const options = qrLine
    .slice(qrLine.indexOf(":") + 1)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const text = lines.filter((l) => !l.trim().startsWith(QUICK_REPLIES_PREFIX)).join("\n").trim();
  return { text, options };
}

const CLOSING_MARKER = "Hai să-ți construim împreună garderoba digitală";

export function OnboardingChat() {
  const router = useRouter();
  const { update: refreshSession } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const pendingHistoryRef = useRef<Msg[] | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  async function sendNext(history: Msg[]) {
    if (streamingRef.current) return;
    streamingRef.current = true;
    setStreaming(true);
    setError(null);
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          buffered += decoder.decode(); // flush remaining bytes (handles multi-byte UTF-8 split at boundary)
          break;
        }
        buffered += decoder.decode(value, { stream: true });
        const events = buffered.split("\n\n");
        buffered = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          const data = ev.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed.text === "string") {
              assistantText += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
          } catch {
            /* ignore malformed chunk */
          }
        }
      }

      if (assistantText.includes(CLOSING_MARKER)) {
        const finalHistory = [...history, { role: "assistant" as const, content: assistantText }];
        pendingHistoryRef.current = finalHistory;
        await complete(finalHistory);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error(e);
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      streamingRef.current = false;
      setStreaming(false);
    }
  }

  async function complete(finalHistory: Msg[]) {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalHistory }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      // Refresh the NextAuth JWT so `onboardingCompleted` becomes true on the
      // client before the dashboard nav — otherwise middleware's stale-claim
      // check could bounce the user back to /onboarding on the first request.
      await refreshSession();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Eroare la finalizare.");
    } finally {
      setCompleting(false);
    }
  }

  function pushUserMessage(content: string) {
    const history = [...messages, { role: "user" as const, content }];
    setMessages(history);
    void sendNext(history);
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming || completing) return;
    setInput("");
    pushUserMessage(trimmed);
  }

  function handleSkip() {
    if (streaming || completing) return;
    pushUserMessage("[SKIP]");
  }

  // Kick off conversation on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void sendNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastQuickReplies = lastAssistant && !streaming ? splitQuickReplies(lastAssistant.content).options : [];

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 gap-4">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => {
          const { text } = m.role === "assistant" ? splitQuickReplies(m.content) : { text: m.content };
          return (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2"
                  : "self-start max-w-[85%] rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap"
              }
            >
              {text || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          );
        })}
        {lastQuickReplies.length > 0 && (
          <QuickReplies options={lastQuickReplies} onPick={pushUserMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {error && pendingHistoryRef.current && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (pendingHistoryRef.current) void complete(pendingHistoryRef.current);
          }}
          disabled={completing}
        >
          Încearcă din nou să salvezi
        </Button>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Scrie răspunsul tău…"
          disabled={streaming || completing}
        />
        <Button onClick={handleSend} disabled={streaming || completing || !input.trim()}>
          Trimite
        </Button>
        <Button variant="ghost" onClick={handleSkip} disabled={streaming || completing}>
          Sări peste
        </Button>
      </div>
    </div>
  );
}
