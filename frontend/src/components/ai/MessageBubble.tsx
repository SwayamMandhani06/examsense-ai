"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/types/material";
import { SourceReferences } from "./SourceReferences";
import toast from "react-hot-toast";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const isTyping = message.content === "__typing__";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Answer copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 max-w-[88%] ${
        isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
          isUser
            ? "bg-surface border border-border text-text"
            : "bg-primary-gradient text-white shadow-glow-sm"
        }`}
      >
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        {/* Header label for AI */}
        {!isUser && !isTyping && (
          <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-text-muted">
            <span className="text-text font-bold">ExamSense AI</span>
            <span className="text-primary-light font-mono text-[10px] uppercase bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              Groq Llama 3.3
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isUser
              ? "bg-primary-gradient text-white rounded-tr-sm shadow-glow-sm"
              : "glass-card border border-border rounded-tl-sm text-text"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary-light typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 whitespace-pre-line break-words">
              {message.content}
            </div>
          )}

          {/* Copy Button for Assistant */}
          {!isUser && !isTyping && (
            <div className="flex justify-end mt-2 pt-2 border-t border-border/40">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text transition-colors p-1 rounded hover:bg-surface"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy Answer
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sources References */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceReferences sources={message.sources} />
        )}
      </div>
    </div>
  );
}
