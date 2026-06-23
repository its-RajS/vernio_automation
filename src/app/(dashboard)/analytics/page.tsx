import { getProjects, getTotalSlideCount } from "../actions";
import { ShellHeader, ShellSection } from "@/components/shell";
import { Megaphone, Layers, Clock, DollarSign } from "lucide-react";
import type { Project } from "@/types/database";

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Megaphone;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold text-foreground">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const { data: projects } = await getProjects();
  const projectList = (projects as Project[]) ?? [];

  const totalCampaigns = projectList.length;
  const completedCount = projectList.filter(
    (p) => p.status === "completed"
  ).length;
  const processingCount = projectList.filter(
    (p) => p.status === "processing"
  ).length;

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Analytics"
        description="Track your content generation metrics."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Megaphone}
          label="Campaigns"
          value={String(totalCampaigns)}
          subtext={`${completedCount} completed`}
        />
        <MetricCard
          icon={Layers}
          label="Slides Generated"
          value="—"
          subtext="Coming with full pipeline"
        />
        <MetricCard
          icon={Clock}
          label="Processing"
          value={String(processingCount)}
          subtext="Currently generating"
        />
        <MetricCard
          icon={DollarSign}
          label="Est. Cost"
          value="—"
          subtext="Coming soon"
        />
      </div>

      {/* Charts placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-foreground mb-1">
          Generation Activity
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Campaigns created over time.
        </p>
        <div className="flex items-center justify-center h-48 rounded-lg bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            Chart coming with more data
          </p>
        </div>
      </div>
    </div>
  );
}
