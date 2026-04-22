"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { Source } from "@/types/material";

interface Props {
  sources: Source[];
}

export function SourceReferences({ sources }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Safely get display name — backend chunks may not have fileName
  const getDisplayName = (s: Source, i: number): string => {
    const name = s.fileName ?? s.relevantChunk?.slice(0, 30) ?? `Source ${i + 1}`;
    return name.length > 24 ? name.slice(0, 24) + "…" : name;
  };

  if (!sources || sources.length === 0) return null;

  return (
    <div className="text-xs">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {sources.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[#a78bfa] cursor-pointer hover:bg-primary/15 transition-colors"
            title={s.fileName ?? `Source ${i + 1}`}
          >
            <FileText size={10} />
            {getDisplayName(s, i)}
          </span>
        ))}
        {sources.length > 3 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-text-muted hover:text-text transition-colors"
          >
            +{sources.length - 3} more <ChevronDown size={10} className={expanded ? "rotate-180" : ""} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-1.5 mt-2 p-3 bg-surface rounded-lg border border-border">
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <FileText size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-text font-medium">{s.fileName ?? `Source ${i + 1}`}</p>
                {s.pageNumber && (
                  <p className="text-text-muted">Page {s.pageNumber}</p>
                )}
                {s.similarityScore != null && (
                  <p className="text-text-muted mt-0.5">
                    Score: {(s.similarityScore * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
