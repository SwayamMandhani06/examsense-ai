"use client";

import { useEffect, useState } from "react";
import type { ChatMessage } from "@/types/material";
import { SourceReferences } from "./SourceReferences";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const isTyping = message.content === "__typing__";
  const [showSources, setShowSources] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("ai_show_sources");
    if (stored !== null) {
      setShowSources(stored === "true");
    }
  }, []);

  return (
    <div className={`flex gap-2.5 max-w-[80%] ${isUser ? "self-end flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        isUser
          ? "bg-surface border border-border text-text"
          : "bg-primary-gradient text-white"
      }`}>
        {isUser ? "U" : "ES"}
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
          isUser
            ? "bg-primary-gradient text-white rounded-tr-sm"
            : "bg-surface border border-border rounded-tl-sm text-text"
        }`}>
          {isTyping ? (
            <div className="flex items-center gap-1 py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-muted typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : (
            <span dangerouslySetInnerHTML={{
              __html: message.content
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br />")
            }} />
          )}
        </div>

        {/* Sources */}
        {!isUser && showSources && message.sources && message.sources.length > 0 && (
          <SourceReferences sources={message.sources} />
        )}
      </div>
    </div>
  );
}
