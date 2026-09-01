"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles, CornerDownLeft, Bot, Layers } from "lucide-react";
import { ask } from "@/lib/api";
import type { ChatMessage } from "@/types/material";
import { MessageBubble } from "./MessageBubble";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Props {
  subjectId: string;
  subjectName: string;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  onSessionCreated?: (sessionId: string) => void;
}

const STARTER_PROMPTS = [
  "What are the top 3 most repeated 10-mark questions?",
  "Summarize key formulas and theorems in Unit 3.",
  "Explain the difference between primary concepts in this subject.",
  "Predict the difficulty and expected focus areas for end-sem.",
];

export function ChatWindow({
  subjectId,
  subjectName,
  sessionId,
  initialMessages,
  onSessionCreated,
}: Props) {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);

  const welcomeMessage: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm your ExamSense AI Tutor grounded in **${subjectName}** study materials.\n\nAsk me anything — past question explanations, multi-step problem derivations, or exam strategy questions with exact source citations.`,
    timestamp: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [welcomeMessage]
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const isRestoredSession = initialMessages && initialMessages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (data: { question: string; subject_id: string; session_id?: string }) =>
      ask.sendQuestion(data),
    onSuccess: (data) => {
      const newSessionId = data.session_id ?? (data as any).sessionId;
      if (newSessionId) {
        setCurrentSessionId(String(newSessionId));
        onSessionCreated?.(String(newSessionId));
      }
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(aiMsg));
    },
    onError: () => {
      setMessages((prev) =>
        prev.filter((m) => m.id !== "typing").concat({
          id: Date.now().toString(),
          role: "assistant",
          content: "I encountered a problem reaching the AI engine. Please ensure your Groq key is active and try again.",
          timestamp: new Date().toISOString(),
        })
      );
    },
  });

  const sendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || mutation.isPending) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const typingMsg: ChatMessage = {
      id: "typing",
      role: "assistant",
      content: "__typing__",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    mutation.mutate({
      question: text,
      subject_id: subjectId,
      session_id: currentSessionId,
    });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full glass-card rounded-3xl border border-border overflow-hidden bg-card/60">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-surface/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-gradient flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text">ExamSense AI Tutor</span>
              <Badge variant="purple" size="sm">
                Groq Llama 3.3
              </Badge>
            </div>
            <p className="text-[11px] text-text-muted">{subjectName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRestoredSession && (
            <Badge variant="neutral" size="sm">
              Session Restored
            </Badge>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Starter Prompts when conversation is fresh */}
        {messages.length <= 1 && (
          <div className="pt-6">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              Suggested Questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="text-left p-3 rounded-xl bg-surface/80 border border-border/80 hover:border-primary/40 hover:bg-surface text-xs text-text transition-all group"
                >
                  <span className="group-hover:text-primary-light transition-colors font-medium">
                    "{prompt}"
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-border bg-surface/30 shrink-0">
        <div className="flex items-end gap-2 bg-surface rounded-2xl border border-border p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              isRestoredSession
                ? "Ask follow-up question or request derivation..."
                : `Ask any question about ${subjectName}...`
            }
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none resize-none max-h-32 min-h-[40px]"
          />

          <Button
            size="sm"
            variant="primary"
            onClick={() => sendMessage()}
            disabled={!input.trim() || mutation.isPending}
            className="rounded-xl px-3 py-2 shrink-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </Button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted mt-2 px-1">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>Citation-backed RAG</span>
        </div>
      </div>
    </div>
  );
}
