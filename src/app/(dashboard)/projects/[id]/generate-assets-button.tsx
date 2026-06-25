"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
  hasAnalysis: boolean;
  isRegenerate?: boolean;
  compact?: boolean;
}

export function GenerateAssetsButton({ projectId, hasAnalysis, isRegenerate = false, compact = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setDone(false);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${projectId}/generate-assets`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start generation.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleClick}
          disabled={loading || !hasAnalysis}
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          {loading ? "Starting…" : isRegenerate ? "Regenerate" : "Generate Images"}
        </Button>
        {done && <p className="text-xs text-muted-foreground">Started — refresh in a few minutes.</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleClick}
        disabled={loading || !hasAnalysis}
        variant={isRegenerate ? "outline" : "default"}
        size="sm"
        className="gap-1.5"
      >
        {loading ? "Starting…" : isRegenerate ? "Regenerate Images" : "Generate Images"}
      </Button>
      {done && <p className="text-xs text-muted-foreground text-center max-w-[220px]">Started — refresh in a few minutes.</p>}
      {error && <p className="text-xs text-red-400 text-center max-w-[220px]">{error}</p>}
    </div>
  );
}
