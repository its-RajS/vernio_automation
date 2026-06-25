"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Props {
  projectId: string;
  hasContent: boolean;
  isRetry?: boolean;
  compact?: boolean;
}

export function AnalyzeButton({ projectId, hasContent, isRetry = false, compact = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${projectId}/analyze`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Analysis failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleAnalyze}
          disabled={loading || !hasContent}
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {loading ? (
            "Running…"
          ) : (
            <>
              <RotateCcw className="h-3 w-3" />
              {isRetry ? "Re-run" : "Run Analysis"}
            </>
          )}
        </Button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={handleAnalyze}
        disabled={loading || !hasContent}
        variant={isRetry ? "outline" : "default"}
        size="lg"
        className="gap-2"
      >
        {loading ? "Analyzing…" : isRetry ? "Re-run Analysis" : "Analyze Content"}
      </Button>
      {!hasContent && (
        <p className="text-xs text-muted-foreground">Add content or upload a file first.</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
