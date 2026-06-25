"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createProject, getDefaultBrandProfile, uploadProjectAsset } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORMS, DIMENSIONS, TEMPLATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { detectStructure } from "@/modules/content-processing/content-structure-detector.service";
import {
  Upload,
  FileText,
  Globe,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileUp,
  Image,
  Layout,
  Eye,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Content Source", icon: FileUp },
  { id: 2, label: "Platform", icon: Image },
  { id: 3, label: "Brand", icon: Sparkles },
  { id: 4, label: "Output", icon: Layout },
  { id: 5, label: "Review", icon: Eye },
  { id: 6, label: "Generation", icon: Sparkles },
];

type ContentSource = "upload" | "paste" | "url";

interface PipelineStep {
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
}

interface ToastState {
  title: string;
  description: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // Step 1 — Content Source
  const [contentSource, setContentSource] = useState<ContentSource>("paste");
  const [files, setFiles] = useState<File[]>([]);
  const [contentText, setContentText] = useState("");

  // Step 2 — Platform
  const [platform, setPlatform] = useState("");

  // Step 3 — Brand
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#2563EB");
  const [brandPrompt, setBrandPrompt] = useState("");
  const [loadingBrandDefaults, setLoadingBrandDefaults] = useState(true);

  // Step 4 — Output
  const [templateId, setTemplateId] = useState("");
  const [dimension, setDimension] = useState("");
  const [resolution, setResolution] = useState("1080p");
  const [creativeCount, setCreativeCount] = useState(1);

  // Step 6 — Generation
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { label: "Saving project", status: "pending" },
    { label: "Uploading files", status: "pending" },
    { label: "Analyzing content", status: "pending" },
    { label: "Generating structure", status: "pending" },
    { label: "Creating slides", status: "pending" },
  ]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Project name — auto-generated from brand or content
  const projectName =
    brandName.trim() ||
    (contentText.trim()
      ? contentText.trim().split("\n")[0].slice(0, 50)
      : "") ||
    "Untitled Campaign";

  const detectedStructure = useMemo(() => {
    if (contentSource !== "paste" || !contentText.trim()) {
      return null;
    }

    return detectStructure(contentText);
  }, [contentSource, contentText]);

  const hasPinnedCreativeCount = !!detectedStructure?.hasStructure;
  const effectiveCreativeCount = hasPinnedCreativeCount
    ? detectedStructure.count
    : creativeCount;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function validateStep(s: number): boolean {
    if (s === 1) {
      if (contentSource === "paste" && !contentText.trim()) {
        setError("Please paste your content or upload a file.");
        return false;
      }
      if (contentSource === "upload" && files.length === 0) {
        setError("Please upload at least one file.");
        return false;
      }
    }
    if (s === 2 && !platform) {
      setError("Please select a platform.");
      return false;
    }
    if (s === 4 && (!templateId || !dimension)) {
      setError("Please select a template and dimension.");
      return false;
    }
    return true;
  }

  function handleNext() {
    setError(null);
    if (validateStep(step)) {
      goToStep(step + 1);
    }
  }

  function showErrorToast(title: string, description: string) {
    setToast({ title, description });
  }

  useEffect(() => {
    async function loadBrandDefaults() {
      const { data } = await getDefaultBrandProfile();
      if (data) {
        setBrandName(data.name || "");
        setPrimaryColor(data.primary_color || "#8B5CF6");
        setSecondaryColor(data.secondary_color || "#2563EB");
        setBrandPrompt(data.brand_prompt || "");
      }
      setLoadingBrandDefaults(false);
    }

    loadBrandDefaults();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleGenerate() {
    setError(null);
    setToast(null);
    setGenerating(true);
    goToStep(6);

    // Slow-play the pipeline steps for visual effect
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const updateStep = (idx: number, status: PipelineStep["status"]) => {
      setPipelineSteps((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], status };
        return next;
      });
    };

    try {
      // Step 1: Save project
      updateStep(0, "processing");
      await delay(500);
      const result = await createProject({
        name: projectName,
        platform,
        dimension,
        template_id: templateId,
        content_text: contentSource === "paste" ? contentText.trim() || null : null,
        brand_name: brandName.trim() || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        brand_prompt: brandPrompt.trim() || null,
        resolution,
        creative_count: effectiveCreativeCount,
      });

      if (result.error) {
        throw new Error(result.error);
      }
      updateStep(0, "completed");

      const projectId = result.data?.id;
      if (!projectId) {
        throw new Error("Failed to create project.");
      }

      // Step 2: Upload files
      if (files.length > 0) {
        updateStep(1, "processing");
        await delay(400);
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadResult = await uploadProjectAsset(projectId, formData);
          if (uploadResult.error) {
            console.error("File upload error:", uploadResult.error);
          }
        }
        updateStep(1, "completed");
      } else {
        updateStep(1, "completed");
      }

      // Step 3: Analyze content
      updateStep(2, "processing");
      try {
        const analyzeRes = await fetch(`/api/campaigns/${projectId}/analyze`, {
          method: "POST",
        });
        if (!analyzeRes.ok) {
          const analysisErrorText = await analyzeRes.text();
          console.error("Content analysis failed:", analysisErrorText);

          let analysisErrorMessage = "Content analysis failed.";
          try {
            const parsed = JSON.parse(analysisErrorText) as { error?: string };
            if (parsed.error) {
              analysisErrorMessage = parsed.error;
            }
          } catch {
            if (analysisErrorText.trim()) {
              analysisErrorMessage = analysisErrorText.trim();
            }
          }

          updateStep(2, "failed");
          setGenerating(false);
          setError(analysisErrorMessage);
          showErrorToast("Content analysis failed", analysisErrorMessage);
          return;
        }
      } catch (analyzeErr) {
        console.error("Content analysis error:", analyzeErr);
        const analysisErrorMessage =
          analyzeErr instanceof Error
            ? analyzeErr.message
            : "Unexpected error during content analysis.";

        updateStep(2, "failed");
        setGenerating(false);
        setError(analysisErrorMessage);
        showErrorToast("Content analysis failed", analysisErrorMessage);
        return;
      }
      updateStep(2, "completed");

      updateStep(3, "processing");
      await delay(400);
      updateStep(3, "completed");

      updateStep(4, "processing");
      await delay(300);
      updateStep(4, "completed");

      // Redirect to project detail
      await delay(400);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      showErrorToast(
        "Campaign creation failed",
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      updateStep(0, "failed");
      setGenerating(false);
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-0">
        {STEPS.slice(0, 5).map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-200",
                  step > s.id
                    ? "bg-primary text-primary-foreground"
                    : step === s.id
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {step > s.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  s.id
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap transition-colors duration-200",
                  step >= s.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < 4 && (
              <div
                className={cn(
                  "mx-3 h-px w-12 transition-colors duration-200 sm:w-20",
                  step > s.id
                    ? "bg-primary/50"
                    : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {toast && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm rounded-xl border border-red-500/20 bg-background/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {toast.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          Create Campaign
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up your content and generate branded creatives.
        </p>
      </div>

      {/* Step Indicator */}
      {step <= 5 && <StepIndicator />}

      {/* Spacer */}
      <div className="mt-10" />

      {/* Error */}
      {error && step < 6 && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {/* Step 1 — Content Source */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "upload", label: "Upload File", icon: Upload, desc: "PDF, DOC, DOCX, or TXT" },
                  { value: "paste", label: "Paste Content", icon: FileText, desc: "Write or paste text" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setContentSource(opt.value as ContentSource)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all duration-150",
                      contentSource === opt.value
                        ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-border/80 bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        contentSource === opt.value
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <opt.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>

              {contentSource === "paste" && (
                <div className="space-y-2">
                  <Label htmlFor="content-text">Content</Label>
                  <Textarea
                    id="content-text"
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Paste your content here..."
                    rows={8}
                    className="resize-none"
                  />
                </div>
              )}

              {contentSource === "upload" && (
                <div className="space-y-3">
                  <Label>Upload documents</Label>
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 transition-colors hover:border-border/80 hover:bg-secondary/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, or TXT files
                    </p>
                    <Input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".doc,.docx,.pdf,.txt"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {files.length > 0 && (
                    <div className="space-y-1.5">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-lg bg-secondary px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm text-foreground truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {contentSource === "url" && (
                <div className="space-y-2">
                  <Label htmlFor="doc-url">Google Doc URL</Label>
                  <Input
                    id="doc-url"
                    placeholder="https://docs.google.com/document/d/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a publicly shared Google Doc link.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Platform */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the target platform for your creatives.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlatform(p.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150",
                      platform === p.value
                        ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-border/80 bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium",
                        platform === p.value
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {p.label.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.label === "LinkedIn"
                          ? "Professional network"
                          : p.label === "Instagram"
                            ? "Visual content"
                            : p.label === "Facebook"
                              ? "Social media"
                              : "Short-form content"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Brand */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Configure your brand identity for the creatives. Defaults come from Settings and can be adjusted for this campaign.
              </p>
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder={loadingBrandDefaults ? "Loading brand defaults..." : "Acme Inc."}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#8B5CF6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#2563EB"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-prompt">Brand voice prompt</Label>
                <Textarea
                  id="brand-prompt"
                  value={brandPrompt}
                  onChange={(e) => setBrandPrompt(e.target.value)}
                  placeholder="Describe your brand voice, tone, and style guidelines..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 4 — Output Config */}
          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Choose your output format and template.
              </p>

              {/* Template */}
              <div className="space-y-3">
                <Label>Template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((t) => (
                    <Card
                      key={t.id}
                      className={cn(
                        "cursor-pointer border transition-all duration-150",
                        templateId === t.id
                          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-border/80"
                      )}
                      onClick={() => setTemplateId(t.id)}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-foreground">
                          {t.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {t.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Dimension */}
              <div className="space-y-2">
                <Label>Dimension</Label>
                <Select value={dimension} onValueChange={(v) => v && setDimension(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select dimension" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        <span>{d.label}</span>
                        <span className="ml-2 text-muted-foreground">
                          — {d.description}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="space-y-2">
                <Label>Resolution</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["720p", "1080p", "4k"].map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={cn(
                        "rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-150",
                        resolution === res
                          ? "border-primary/30 bg-primary/5 text-primary ring-1 ring-primary/20"
                          : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                      )}
                    >
                      {res === "720p" ? "HD (720p)" : res === "1080p" ? "Full HD (1080p)" : "4K (2160p)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creative Count */}
              <div className="space-y-2">
                <Label>Creative count</Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreativeCount(Math.max(1, creativeCount - 1))}
                    disabled={hasPinnedCreativeCount || creativeCount <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <div className="flex h-9 min-w-[3rem] items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground">
                    {effectiveCreativeCount}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreativeCount(Math.min(20, creativeCount + 1))}
                    disabled={hasPinnedCreativeCount || creativeCount >= 20}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {hasPinnedCreativeCount ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                    Creative count is pinned from detected {detectedStructure?.pattern} headings in the content: {effectiveCreativeCount} {effectiveCreativeCount === 1 ? "unit" : "units"}.
                  </div>
                ) : contentSource === "upload" ? (
                  <p className="text-xs text-muted-foreground">
                    If the uploaded document contains headings like Slide 1:, Page 1:, Creative 1:, Section 1:, or Post 1:, that structure will pin the final creative count during analysis.
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Manual count is used only when no structured headings are detected.
                  </span>
                )}
                {hasPinnedCreativeCount && detectedStructure && (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-medium text-foreground">Detected content structure</p>
                    <div className="mt-2 space-y-1.5">
                      {detectedStructure.slides.map((slide) => (
                        <div
                          key={slide.slide_number}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-muted-foreground">
                            {detectedStructure.pattern} {slide.slide_number}
                          </span>
                          <span className="truncate text-foreground">
                            {slide.title || "Untitled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Review your selections before generating.
              </p>
              <div className="space-y-3">
                <ReviewItem
                  label="Project Name"
                  value={projectName || "Untitled Campaign"}
                />
                <ReviewItem label="Platform" value={PLATFORMS.find((p) => p.value === platform)?.label ?? platform} />
                <ReviewItem
                  label="Dimension"
                  value={DIMENSIONS.find((d) => d.value === dimension)?.label ?? dimension}
                />
                <ReviewItem
                  label="Resolution"
                  value={resolution === "720p" ? "HD (720p)" : resolution === "1080p" ? "Full HD (1080p)" : "4K (2160p)"}
                />
                <ReviewItem
                  label="Creatives"
                  value={
                    hasPinnedCreativeCount
                      ? `${effectiveCreativeCount} ${effectiveCreativeCount === 1 ? "creative" : "creatives"} from content headings`
                      : `${effectiveCreativeCount} ${effectiveCreativeCount === 1 ? "creative" : "creatives"}`
                  }
                />
                <ReviewItem label="Template" value={TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId} />
                {brandName && <ReviewItem label="Brand" value={brandName} />}
                <ReviewItem
                  label="Content"
                  value={
                    contentSource === "paste"
                      ? contentText.slice(0, 100) + (contentText.length > 100 ? "..." : "")
                      : contentSource === "upload"
                        ? `${files.length} file(s) uploaded`
                        : "Google Doc URL"
                  }
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Generation step (full page style) */}
      {step === 6 && (
        <div className="text-center space-y-8 py-8">
          {/* Pipeline progress */}
          <div className="mx-auto max-w-sm space-y-4">
            {pipelineSteps.map((ps, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300",
                  ps.status === "processing" && "bg-primary/5 ring-1 ring-primary/20",
                  ps.status === "completed" && "text-muted-foreground",
                  ps.status === "failed" && "bg-red-500/5"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                    ps.status === "completed" && "bg-emerald-500/10 text-emerald-400",
                    ps.status === "processing" && "bg-primary/10 text-primary",
                    ps.status === "pending" && "bg-secondary text-muted-foreground",
                    ps.status === "failed" && "bg-red-500/10 text-red-400"
                  )}
                >
                  {ps.status === "completed" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : ps.status === "processing" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
                    />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    ps.status === "processing" && "text-primary font-medium",
                    ps.status === "completed" && "text-muted-foreground",
                    ps.status === "pending" && "text-muted-foreground/50"
                  )}
                >
                  {ps.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGenerating(false);
                    setStep(5);
                    setError(null);
                  }}
                >
                  Back to review
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {step < 6 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => goToStep(step - 1)}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 5 && (
              <Button onClick={handleNext} className="gap-1.5">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 5 && (
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Generating..." : "Generate Campaign"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-foreground text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}
