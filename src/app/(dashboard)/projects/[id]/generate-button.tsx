"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

export function GenerateButton({ projectId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);

    try {
      const { generateCreatives } = await import("../../actions");
      const result = await generateCreatives(projectId);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Generation started. Refresh to see results.");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={handleGenerate} disabled={loading} size="lg">
        {loading ? "Generating..." : "Generate Creatives"}
      </Button>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
