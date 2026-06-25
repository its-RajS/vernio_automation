import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProject,
  getProjectAssets,
  getCreativeSets,
  getSlides,
  getProjectAnalysis,
  getCreativesWithAssets,
} from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PLATFORMS, DIMENSIONS, TEMPLATES } from "@/lib/constants";
import type { Project, Asset, CreativeSet, Slide, CampaignAnalysis, AssetStatus, CreativeWithAssets } from "@/types/database";
import { DeleteProjectButton } from "./delete-button";
import { GenerateButton } from "./generate-button";
import { GenerateAssetsButton } from "./generate-assets-button";
import { AnalyzeButton } from "./analyze-button";
import { ArrowLeft, FileText, Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const map: Record<Project["status"], { label: string; className: string }> = {
    draft:      { label: "Draft",      className: "bg-secondary text-muted-foreground border-border" },
    processing: { label: "Processing", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    completed:  { label: "Completed",  className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    failed:     { label: "Failed",     className: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const c = map[status];
  return <Badge variant="outline" className={cn("gap-1", c.className)}>{c.label}</Badge>;
}

function AssetStatusDot({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, string> = {
    pending:    "bg-muted-foreground/40",
    processing: "bg-amber-400",
    completed:  "bg-emerald-400",
    failed:     "bg-red-400",
  };
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", map[status])} />;
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-foreground">{label}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string }>;
}

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { c: selectedCreativeId } = await searchParams;

  const [projectResult, assetsResult, creativeSetsResult, analysisResult, creativesResult] =
    await Promise.all([
      getProject(id),
      getProjectAssets(id),
      getCreativeSets(id),
      getProjectAnalysis(id),
      getCreativesWithAssets(id),
    ]);

  if (projectResult.error || !projectResult.data) notFound();

  const project = projectResult.data as Project;
  const assets = (assetsResult.data as Asset[]) ?? [];
  const creativeSets = (creativeSetsResult.data as CreativeSet[]) ?? [];
  const analysis = (analysisResult.data as CampaignAnalysis | null) ?? null;
  const creatives = (creativesResult.data as CreativeWithAssets[]) ?? [];

  // Phase 1 slides
  const latestSet = creativeSets[0] ?? null;
  let latestSlides: Slide[] = [];
  if (latestSet) {
    const slidesResult = await getSlides(latestSet.id);
    latestSlides = (slidesResult.data as Slide[]) ?? [];
  }

  const hasContent = !!(project.content_text?.trim() || assets.length > 0);

  const selected: CreativeWithAssets | null =
    creatives.find((c) => c.id === selectedCreativeId) ?? creatives[0] ?? null;

  const platformLabel = PLATFORMS.find((p) => p.value === project.platform)?.label ?? project.platform;
  const dimensionConfig = DIMENSIONS.find((d) => d.value === project.dimension);
  const templateConfig = TEMPLATES.find((t) => t.id === project.template_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Created {formatDate(project.created_at)}
            </p>
          </div>
        </div>
        <DeleteProjectButton projectId={project.id} />
      </div>

      {/* Metadata strip */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <span>{platformLabel}</span>
        <span className="text-border">·</span>
        <span>{dimensionConfig?.label ?? project.dimension}</span>
        <span className="text-border">·</span>
        <span>{templateConfig?.name ?? project.template_id}</span>
        {project.brand_name && (
          <>
            <span className="text-border">·</span>
            <span>{project.brand_name}</span>
          </>
        )}
      </div>

      <Separator />

      {/* Two-panel: list left (narrower), preview right (wider) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        {/* Left panel */}
        <div className="xl:col-span-2 space-y-8">

          {/* Content text */}
          {project.content_text && (
            <Section label="Content">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6">
                {project.content_text}
              </p>
            </Section>
          )}

          {/* Uploaded files */}
          {assets.length > 0 && (
            <Section label="Files">
              <div className="space-y-1.5">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-2.5 text-sm">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground">{asset.file_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{asset.file_type}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Content Analysis */}
          <Section
            label="Analysis"
            action={
              <AnalyzeButton
                projectId={project.id}
                hasContent={hasContent}
                isRetry={!!analysis}
                compact
              />
            }
          >
            {analysis ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{analysis.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Prop label="Type" value={analysis.content_type.replace(/_/g, " ")} />
                  <Prop label="Tone" value={analysis.tone ?? "—"} />
                  <Prop
                    label="Creatives"
                    value={`${analysis.recommended_creative_count} · ${analysis.creative_type.replace(/_/g, " ")}`}
                  />
                </div>

                <Prop label="Audience" value={analysis.target_audience} />

                {analysis.key_topics.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.key_topics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="bg-secondary text-muted-foreground text-xs"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {hasContent ? "Run analysis to see content insights." : "Add content or upload a file first."}
              </p>
            )}
          </Section>

          {/* Generated images list */}
          <Section
            label="Generated Images"
            action={
              analysis ? (
                <GenerateAssetsButton
                  projectId={project.id}
                  hasAnalysis
                  isRegenerate={creatives.length > 0}
                  compact
                />
              ) : null
            }
          >
            {creatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {analysis ? "Click Generate Images to begin." : "Run analysis first."}
              </p>
            ) : (
              <div className="space-y-0.5">
                {creatives.map((creative) => {
                  const asset = (creative.creative_assets as any[])?.[0];
                  const isSelected = creative.id === selected?.id;
                  return (
                    <Link
                      key={creative.id}
                      href={`/projects/${project.id}?c=${creative.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                        isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden border border-border bg-secondary">
                        {creative.signedImageUrl ? (
                          <img
                            src={creative.signedImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">
                          <span className="text-muted-foreground mr-1.5 tabular-nums">
                            {creative.creative_number}.
                          </span>
                          {creative.title || `Creative ${creative.creative_number}`}
                        </p>
                        {creative.subtitle && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {creative.subtitle}
                          </p>
                        )}
                      </div>

                      {asset && <AssetStatusDot status={asset.status as AssetStatus} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Phase 1: slides (minimal, de-emphasised) */}
          {latestSet && latestSlides.length > 0 && (
            <Section label="Content Slides">
              <div className="space-y-0.5">
                {latestSlides.map((slide) => (
                  <div key={slide.id} className="flex items-start gap-2.5 px-1 py-1.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-medium bg-secondary text-muted-foreground">
                      {slide.slide_number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {slide.title || `Slide ${slide.slide_number}`}
                      </p>
                      {slide.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Phase 1 generate CTA (draft, no slides yet) */}
          {project.status === "draft" && !latestSet && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <GenerateButton projectId={project.id} />
            </div>
          )}

          {project.status === "processing" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating content structure…
            </div>
          )}

          {project.status === "failed" && !latestSet && (
            <div className="rounded-xl border border-dashed border-red-200/20 p-8 text-center space-y-3">
              <p className="text-sm text-red-400">Generation failed.</p>
              <GenerateButton projectId={project.id} />
            </div>
          )}
        </div>

        {/* Right panel — image preview */}
        <div className="xl:col-span-3">
          <div className="sticky top-20">
            {selected ? (
              <ImagePreviewPanel creative={selected} projectId={project.id} analysis={analysis} />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Select a creative to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewPanel({
  creative,
  projectId,
  analysis,
}: {
  creative: CreativeWithAssets;
  projectId: string;
  analysis: CampaignAnalysis | null;
}) {
  const asset = (creative.creative_assets as any[])?.[0];
  const prompt = (creative.creative_prompts as any[])?.[0];
  const isCompleted = asset?.status === "completed";
  const isProcessing = asset?.status === "processing" || asset?.status === "pending";
  const isFailed = asset?.status === "failed";

  return (
    <div className="space-y-4">
      {/* Image */}
      <div className="overflow-hidden rounded-xl border border-border bg-secondary aspect-square w-full">
        {isCompleted && creative.signedImageUrl ? (
          <img
            src={creative.signedImageUrl}
            alt={creative.title}
            className="w-full h-full object-cover"
          />
        ) : isProcessing ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Generating…</p>
          </div>
        ) : isFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-red-400">Generation failed</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No image yet</p>
          </div>
        )}
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            <span className="text-muted-foreground mr-1.5 tabular-nums">
              {creative.creative_number}.
            </span>
            {creative.title || `Creative ${creative.creative_number}`}
          </p>
          {creative.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{creative.subtitle}</p>
          )}
        </div>
        {asset?.generation_time && (
          <p className="text-xs text-muted-foreground shrink-0 tabular-nums">
            {(asset.generation_time / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      {/* Details: scene description + prompt */}
      <div className="space-y-2">
        {prompt?.slide_context && (
          <details className="group rounded-lg border border-border">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground select-none hover:text-foreground transition-colors list-none">
              Scene Description
              <span className="text-[10px] text-muted-foreground group-open:hidden">Show</span>
              <span className="text-[10px] text-muted-foreground hidden group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{prompt.slide_context}</p>
            </div>
          </details>
        )}

        {asset?.final_prompt && (
          <details className="group rounded-lg border border-border">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground select-none hover:text-foreground transition-colors list-none">
              Generation Prompt
              <span className="text-[10px] text-muted-foreground group-open:hidden">Show</span>
              <span className="text-[10px] text-muted-foreground hidden group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-border px-4 py-3">
              <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                {asset.final_prompt}
              </pre>
            </div>
          </details>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <GenerateAssetsButton
          projectId={projectId}
          hasAnalysis={!!analysis}
          isRegenerate={isCompleted || isFailed}
        />
        <Button variant="outline" size="sm" disabled className="gap-1.5 text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground capitalize">{value}</p>
    </div>
  );
}
