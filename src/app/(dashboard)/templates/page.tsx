import Link from "next/link";
import { ShellHeader, ShellSection } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/lib/constants";
import { Plus } from "lucide-react";

// Visual thumbnail showing text zone (dark) vs image zone (lighter)
function TemplatePreview({ type }: { type: string }) {
  const base = "w-full h-full rounded overflow-hidden bg-secondary flex";

  switch (type) {
    case "editorial-left":
      return (
        <div className={base}>
          <div className="w-[40%] h-full bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium rotate-0">TEXT</span>
          </div>
          <div className="flex-1 h-full bg-primary/10" />
        </div>
      );
    case "editorial-right":
      return (
        <div className={base}>
          <div className="flex-1 h-full bg-primary/10" />
          <div className="w-[40%] h-full bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
        </div>
      );
    case "top-title":
      return (
        <div className={`${base} flex-col`}>
          <div className="w-full h-[32%] bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
          <div className="flex-1 w-full bg-primary/10" />
        </div>
      );
    case "bottom-caption":
      return (
        <div className={`${base} flex-col`}>
          <div className="flex-1 w-full bg-primary/10" />
          <div className="w-full h-[32%] bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
        </div>
      );
    case "center-statement":
      return (
        <div className={`${base} flex-col`}>
          <div className="h-[32%] w-full bg-primary/10" />
          <div className="h-[36%] w-full bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
          <div className="h-[32%] w-full bg-primary/10" />
        </div>
      );
    case "story-top":
      return (
        <div className={`${base} flex-col`} style={{ aspectRatio: "9/16" }}>
          <div className="w-full h-[35%] bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
          <div className="flex-1 w-full bg-primary/10" />
        </div>
      );
    case "story-bottom":
      return (
        <div className={`${base} flex-col`} style={{ aspectRatio: "9/16" }}>
          <div className="flex-1 w-full bg-primary/10" />
          <div className="w-full h-[35%] bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
        </div>
      );
    case "full-bleed-gradient":
      return (
        <div className={`${base} flex-col relative`}>
          <div className="flex-1 w-full bg-primary/10" />
          <div className="w-full h-[38%] bg-gradient-to-t from-foreground/20 to-transparent flex items-end justify-center pb-1">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
        </div>
      );
    case "poster-classic":
      return (
        <div className={`${base} flex-col`}>
          <div className="h-[28%] w-full bg-primary/10" />
          <div className="h-[44%] w-full bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium">TEXT</span>
          </div>
          <div className="h-[28%] w-full bg-primary/10" />
        </div>
      );
    case "sidebar-bold":
      return (
        <div className={base}>
          <div className="w-[35%] h-full bg-foreground/15 flex items-center justify-center">
            <span className="text-[8px] text-muted-foreground font-medium rotate-0">TEXT</span>
          </div>
          <div className="flex-1 h-full bg-primary/10" />
        </div>
      );
    default:
      return <div className="w-full h-full bg-primary/5 flex items-center justify-center text-[8px] text-muted-foreground">Preview</div>;
  }
}

export default function TemplatesPage() {
  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Templates"
        description="Professionally designed layouts. Dark zones show where text will render on top of the generated image."
      />

      {categories.map((category) => (
        <ShellSection key={category} title={category}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.filter((t) => t.category === category).map((t) => (
              <Card
                key={t.id}
                className="group border-border bg-card transition-all duration-150 hover:border-border/80"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Preview thumbnail */}
                  <div className="flex items-center justify-center h-32 rounded-lg bg-card border border-border overflow-hidden p-2">
                    <TemplatePreview type={t.preview} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {t.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Dimensions */}
                  <div className="flex flex-wrap gap-1">
                    {t.bestFor.map((d) => (
                      <Badge key={d} variant="outline" className="text-[10px] bg-secondary text-muted-foreground">
                        {d}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {[...t.platforms].join(" · ")}
                    </span>
                    <Link href="/projects/new">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Use
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ShellSection>
      ))}
    </div>
  );
}
