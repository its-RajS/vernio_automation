import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProject,
  getProjectAssets,
  getCreativeSets,
  getSlides,
} from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PLATFORMS, DIMENSIONS, TEMPLATES } from "@/lib/constants";
import type { Project, Asset, CreativeSet, Slide } from "@/types/database";
import { DeleteProjectButton } from "./delete-button";
import { GenerateButton } from "./generate-button";
import { ShellHeader } from "@/components/shell";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Image,
  Monitor,
  Layout as LayoutIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
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

function StatusBadge({
  status,
  size = "default",
}: {
  status: Project["status"];
  size?: "default" | "sm";
}) {
  const variants: Record<
    Project["status"],
    { label: string; className: string; icon: typeof Clock }
  > = {
    draft: {
      label: "Draft",
      className: "bg-secondary text-muted-foreground border-border",
      icon: Clock,
    },
    processing: {
      label: "Processing",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: Sparkles,
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: CheckCircle2,
    },
    failed: {
      label: "Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: AlertCircle,
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(config.className, size === "sm" ? "gap-1 px-2 py-0" : "gap-1.5 px-3 py-1")}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </Badge>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slide?: string }>;
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { slide: selectedSlide } = await searchParams;

  const [projectResult, assetsResult, creativeSetsResult] = await Promise.all([
    getProject(id),
    getProjectAssets(id),
    getCreativeSets(id),
  ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  const project = projectResult.data as Project;
  const assets = (assetsResult.data as Asset[]) ?? [];
  const creativeSets = (creativeSetsResult.data as CreativeSet[]) ?? [];

  let latestSlides: Slide[] = [];
  if (creativeSets.length > 0) {
    const slidesResult = await getSlides(creativeSets[0].id);
    if (slidesResult.data) {
      latestSlides = slidesResult.data as Slide[];
    }
  }

  const latestSet = creativeSets[0] ?? null;

  // Determine selected slide
  const selectedSlideNum = selectedSlide
    ? parseInt(selectedSlide, 10)
    : latestSlides.length > 0
      ? latestSlides[0].slide_number
      : null;
  const currentSlide = latestSlides.find(
    (s) => s.slide_number === selectedSlideNum
  ) ?? null;

  const platformLabel =
    PLATFORMS.find((p) => p.value === project.platform)?.label ??
    project.platform;
  const dimensionConfig = DIMENSIONS.find(
    (d) => d.value === project.dimension
  );
  const templateConfig = TEMPLATES.find((t) => t.id === project.template_id);

  const dimensionLabel = dimensionConfig
    ? `${dimensionConfig.label} — ${dimensionConfig.description}`
    : project.dimension;

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
        <div className="flex items-center gap-2 shrink-0">
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>

      <Separator />

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Panel — List */}
        <div className="xl:col-span-3 space-y-6">
          {/* Metadata cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetaCard icon={Monitor} label="Platform" value={platformLabel} />
            <MetaCard icon={Image} label="Dimension" value={dimensionLabel} />
            <MetaCard
              icon={LayoutIcon}
              label="Template"
              value={templateConfig?.name ?? project.template_id}
            />
          </div>

          {/* Content */}
          {project.content_text && (
            <div>
              <h2 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Content
              </h2>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.content_text}
                </p>
              </div>
            </div>
          )}

          {/* Uploaded files */}
          {assets.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-foreground mb-2">
                Uploaded files
              </h2>
              <div className="space-y-1.5">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate">
                        {asset.file_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {asset.file_type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(asset.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creative set info + Slides list */}
          {latestSet && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Generated Slides
                </h2>
                <Badge
                  variant="outline"
                  className="capitalize bg-secondary text-muted-foreground"
                >
                  {latestSet.creative_type.replace(/_/g, " ")} &middot;{" "}
                  {latestSet.creative_count} slides
                </Badge>
              </div>

              {latestSet.summary && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {latestSet.summary}
                </p>
              )}

              <div className="space-y-1.5">
                {latestSlides.map((slide) => {
                  const isSelected = slide.slide_number === selectedSlideNum;
                  return (
                    <Link
                      key={slide.id}
                      href={`/projects/${project.id}?slide=${slide.slide_number}`}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border px-4 py-3 transition-all duration-150",
                        isSelected
                          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-border/80"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {slide.slide_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {slide.title || `Slide ${slide.slide_number}`}
                        </p>
                        {slide.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons for draft/processing/failed */}
          {project.status === "draft" && !latestSet && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <GenerateButton projectId={project.id} />
            </div>
          )}

          {project.status === "processing" && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generating creative structure...
                </p>
              </div>
            </div>
          )}

          {project.status === "failed" && !latestSet && (
            <div className="rounded-xl border border-dashed border-red-200/20 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-red-400">Generation failed.</p>
                <GenerateButton projectId={project.id} />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Preview */}
        <div className="xl:col-span-2">
          {currentSlide ? (
            <div className="sticky top-20 space-y-4">
              <h2 className="text-sm font-medium text-foreground">
                Slide Preview
              </h2>

              {/* Preview card — mimics the creative output */}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Color accent bar */}
                <div className="h-1.5 bg-primary" />

                <div className="p-5 space-y-4">
                  {/* Slide header */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="bg-secondary text-xs text-muted-foreground"
                    >
                      Slide {currentSlide.slide_number} /{" "}
                      {latestSlides.length}
                    </Badge>
                  </div>

                  {/* Title */}
                  {currentSlide.title && (
                    <h3 className="text-lg font-semibold text-foreground">
                      {currentSlide.title}
                    </h3>
                  )}

                  {/* Subtitle */}
                  {currentSlide.subtitle && (
                    <p className="text-sm text-muted-foreground">
                      {currentSlide.subtitle}
                    </p>
                  )}

                  <Separator />

                  {/* Body */}
                  {currentSlide.body && (
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {currentSlide.body}
                    </p>
                  )}

                  {/* Key takeaway */}
                  {currentSlide.key_takeaway && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                      <p className="text-xs font-medium text-primary mb-1">
                        Key Takeaway
                      </p>
                      <p className="text-sm text-foreground/80 italic">
                        {currentSlide.key_takeaway}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {latestSet && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Creative Metadata
                  </h3>
                  <div className="space-y-2">
                    {latestSet.title && (
                      <MetaRow
                        label="Title"
                        value={latestSet.title}
                      />
                    )}
                    <MetaRow
                      label="Type"
                      value={latestSet.creative_type.replace(/_/g, " ")}
                    />
                    <MetaRow
                      label="Total Slides"
                      value={String(latestSet.creative_count)}
                    />
                    <MetaRow
                      label="Created"
                      value={formatDate(latestSet.created_at)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a slide to preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Monitor;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground capitalize">{value}</span>
    </div>
  );
}
