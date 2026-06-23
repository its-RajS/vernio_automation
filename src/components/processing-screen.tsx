"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface PipelineStep {
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
}

interface ProcessingScreenProps {
  steps: PipelineStep[];
  className?: string;
}

export function ProcessingScreen({ steps, className }: ProcessingScreenProps) {
  return (
    <div className={cn("mx-auto max-w-sm space-y-3", className)}>
      {steps.map((step, idx) => (
        <div
          key={idx}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300",
            step.status === "processing" &&
              "border-primary/20 bg-primary/5",
            step.status === "completed" && "border-border bg-card",
            step.status === "pending" && "border-border/50 bg-card/50",
            step.status === "failed" && "border-red-500/20 bg-red-500/5"
          )}
        >
          {/* Status indicator */}
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
              step.status === "completed" &&
                "bg-emerald-500/10 text-emerald-400",
              step.status === "processing" && "bg-primary/10 text-primary",
              step.status === "pending" && "bg-secondary text-muted-foreground",
              step.status === "failed" && "bg-red-500/10 text-red-400"
            )}
          >
            {step.status === "completed" ? (
              <Check className="h-3.5 w-3.5" />
            ) : step.status === "processing" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
              />
            ) : (
              idx + 1
            )}
          </div>

          {/* Label */}
          <span
            className={cn(
              "text-sm transition-colors duration-300",
              step.status === "processing" && "text-primary font-medium",
              step.status === "completed" && "text-muted-foreground",
              step.status === "pending" && "text-muted-foreground/50",
              step.status === "failed" && "text-red-400"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
