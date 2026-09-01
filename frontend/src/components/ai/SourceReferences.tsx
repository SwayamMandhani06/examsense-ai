"use client";

import { useState } from "react";
import { ChevronDown, FileText, CheckCircle2, ExternalLink } from "lucide-react";
import type { Source } from "@/types/material";

interface Props {
  sources: Source[];
}

export function SourceReferences({ sources }: Props) {
  const [expanded, setExpanded] = useState(false);

  const getDisplayName = (s: Source, i: number): string => {
    const name = s.fileName ?? s.relevantChunk?.slice(0, 30) ?? `Source ${i + 1}`;
    return name.length > 28 ? name.slice(0, 28) + "…" : name;
  };

  if (!sources || sources.length === 0) return null;

  return (
    <div className="text-xs mt-2 pt-2 border-t border-border/60">
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        <span className="text-[11px] font-bold text-text-muted flex items-center gap-1 mr-1">
          <CheckCircle2 size={12} className="text-emerald-400" /> Evidence:
        </span>

        {sources.slice(0, 3).map((s, i) => (
          <span
            key={i}
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 border border-primary/25 rounded-md text-primary-light text-[11px] font-mono cursor-pointer hover:bg-primary/20 transition-colors"
            title={s.fileName ?? `Source ${i + 1}`}
          >
            <FileText size={10} />
            {getDisplayName(s, i)}
          </span>
        ))}

        {sources.length > 3 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-text-muted hover:text-text text-[11px] transition-colors"
          >
            +{sources.length - 3} more <ChevronDown size={11} className={expanded ? "rotate-180" : ""} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-2 mt-2 p-3 bg-surface/80 rounded-xl border border-border animate-fade-up">
          <div className="flex items-center justify-between pb-1 border-b border-border/60 text-[11px] font-bold text-text-muted uppercase">
            <span>Retrieved PDF Chunks</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-text-subtle hover:text-text"
            >
              Hide
            </button>
          </div>

          {sources.map((s, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-card border border-border/80 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary-light flex items-center gap-1.5">
                  <FileText size={12} /> {s.fileName ?? `Source ${i + 1}`}
                </span>
                {s.similarityScore != null && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {(s.similarityScore * 100).toFixed(0)}% Relevance
                  </span>
                )}
              </div>
              {s.relevantChunk && (
                <p className="text-text-muted text-[11px] italic line-clamp-3 bg-surface/50 p-1.5 rounded border border-border/40 font-mono mt-1">
                  "{s.relevantChunk}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
