import Link from "next/link";
import { ShellHeader, ShellSection } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATES } from "@/lib/constants";
import { LayoutTemplate, Plus } from "lucide-react";

function TemplatePreview({ type }: { type: string }) {
  switch (type) {
    case "left-hero":
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-[200px] space-y-2">
            <div className="h-3 bg-primary/20 rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-5/6" />
          </div>
        </div>
      );
    case "centered":
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="h-3 bg-primary/20 rounded w-24 mx-auto" />
            <div className="h-2 bg-muted rounded w-32 mx-auto" />
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="w-full max-w-[180px] space-y-3">
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-4/5" />
            <div className="h-2 bg-primary/20 rounded w-2/3" />
          </div>
        </div>
      );
    case "structured":
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-2">
          <div className="h-2 bg-primary/20 rounded w-3/4" />
          <div className="h-1.5 bg-muted rounded w-full" />
          <div className="h-1.5 bg-muted rounded w-5/6" />
          <div className="h-1.5 bg-muted rounded w-4/5" />
        </div>
      );
    default:
      return <LayoutTemplate className="h-10 w-10 text-primary/30" />;
  }
}

export default function TemplatesPage() {
  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Templates"
        description="Choose from professionally designed templates."
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
                  <div className="flex items-center justify-center h-32 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 overflow-hidden">
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

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      All dimensions
                    </span>
                    <Link href={`/projects/new`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Use Template
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
