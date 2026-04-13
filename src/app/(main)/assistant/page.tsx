"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Loader2,
  Sparkles,
  Shirt,
  Calendar,
  Sun,
  PartyPopper,
  Briefcase,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPromptsAva = [
  { icon: Sun, label: "Ce să port azi?", prompt: "Ce să port azi la birou?" },
  {
    icon: PartyPopper,
    label: "Ținută de petrecere",
    prompt: "Am o petrecere diseară. Ce ținută îmi recomanzi din garderoba mea?",
  },
  {
    icon: Calendar,
    label: "Ținută casual weekend",
    prompt: "Vreau o ținută casual și confortabilă pentru weekend. Ce sugerezi?",
  },
  {
    icon: Shirt,
    label: "Întâlnire",
    prompt: "Am o întâlnire la cină. Cum să mă îmbrac elegant dar nu prea formal?",
  },
];

const quickPromptsAdam = [
  {
    icon: Briefcase,
    label: "Business meeting",
    prompt: "Cum mă îmbrac la o întâlnire de business?",
  },
  {
    icon: Gem,
    label: "Cină elegantă",
    prompt: "Recomandă o ținută pentru cina elegantă",
  },
  {
    icon: Calendar,
    label: "Smart-casual weekend",
    prompt: "Outfit pentru weekend smart-casual",
  },
  {
    icon: Shirt,
    label: "Cum combin sacoul?",
    prompt: "Cum combin un sacou navy cu ce am în garderobă?",
  },
];

export default function AssistantPage() {
  const { data: session } = useSession();
  const isAdam =
    process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED === "true" &&
    session?.user?.sex === "male";
  const quickPrompts = isAdam ? quickPromptsAdam : quickPromptsAva;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load today's conversation on mount
  useEffect(() => {
    fetch("/api/assistant/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
          setConversationId(data.conversationId);
        }
      })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, conversationId }),
      });

      if (!res.ok) throw new Error("fetch_error");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("no_reader");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantContent += parsed.text;
              setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
            }
            if (parsed.conversationId) setConversationId(parsed.conversationId);
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Scuze, am întâmpinat o eroare. Încearcă din nou." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    // Fixed layout: breaks out of main padding, sticks to sidebar + header + bottom nav
    <div className="fixed inset-0 top-14 left-0 md:left-64 bottom-16 md:bottom-0 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b border-border/50 bg-card px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full gradient-teal flex items-center justify-center shadow-ava-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-heading italic text-lg text-foreground leading-tight">
            {isAdam ? "Adam" : "Ava"}
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            AI Stylist · Online
          </p>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {sessionLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {isAdam ? "Bună ziua! Sunt Adam" : "Salut! Sunt Ava"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              {isAdam
                ? "Consultantul tău de stil — spune-mi cu ce ocazie ai nevoie de o ținută și îți ofer recomandări precise."
                : "Stilistul tău personal AI — întreabă-mă orice despre ținute, culori sau ce să porți azi."}
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {quickPrompts.map((qp) => (
                <Card
                  key={qp.label}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => sendMessage(qp.prompt)}
                >
                  <div className="flex items-center gap-2">
                    <qp.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{qp.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "whitespace-pre-wrap",
                    msg.role === "user"
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm gradient-primary text-white shadow-ava-sm"
                      : "mr-auto max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground shadow-ava-sm"
                  )}
                >
                  {msg.content}
                  {msg.role === "assistant" && !msg.content && loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input — always at bottom */}
      <div className="border-t border-border/50 bg-card p-3 flex gap-2 shrink-0">
        <Textarea
          ref={textareaRef}
          placeholder="Scrie un mesaj..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="rounded-full border-border/60 bg-background flex-1 min-h-[44px] max-h-32 resize-none"
        />
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="shrink-0 rounded-full gradient-teal text-white border-0 shadow-ava-sm px-4"
          aria-label="Trimite mesaj"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
