import Link from "next/link";
import { getProjects, getTotalSlideCount } from "../actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShellHeader, ShellSection } from "@/components/shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Layers,
  Plus,
} from "lucide-react";
import type { Project } from "@/types/database";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) return "Just now";
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const variants: Record<
    Project["status"],
    { label: string; className: string }
  > = {
    draft: {
      label: "Draft",
      className: "bg-secondary text-muted-foreground border-border",
    },
    processing: {
      label: "Processing",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    failed: {
      label: "Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };

  const config = variants[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function PlatformLabel({ platform }: { platform: string }) {
  const labels: Record<string, string> = {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    x: "X",
  };
  return (
    <span className="text-sm text-muted-foreground">
      {labels[platform] ?? platform}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof Megaphone;
  label: string;
  value: string | number;
  trend?: string;
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
        </div>
      </div>
      {trend && (
        <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
      )}
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  label,
  projectName,
  time,
}: {
  icon: typeof Clock;
  label: string;
  projectName: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {label}{" "}
          <span className="font-medium">{projectName}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { data: projects, error } = await getProjects();
  const { data: totalSlides } = await getTotalSlideCount();
  const projectList = (projects as Project[]) ?? [];

  // Compute KPI metrics
  const totalCampaigns = projectList.length;
  const completedCount = projectList.filter(
    (p) => p.status === "completed"
  ).length;
  const draftCount = projectList.filter((p) => p.status === "draft").length;
  const processingCount = projectList.filter(
    (p) => p.status === "processing"
  ).length;
  const successRate =
    totalCampaigns > 0
      ? Math.round((completedCount / totalCampaigns) * 100)
      : 0;

  // Sort by most recent for the table
  const recentProjects = [...projectList].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Build activity feed from projects
  const activityItems = [
    ...projectList
      .filter((p) => p.status === "completed")
      .slice(0, 2)
      .map((p) => ({
        icon: CheckCircle2,
        label: "Campaign completed:",
        projectName: p.name,
        time: formatRelativeDate(p.updated_at),
      })),
    ...projectList
      .filter((p) => p.status === "processing")
      .slice(0, 2)
      .map((p) => ({
        icon: Clock,
        label: "Processing:",
        projectName: p.name,
        time: formatRelativeDate(p.updated_at),
      })),
    ...projectList
      .filter((p) => p.status !== "completed" && p.status !== "processing")
      .slice(0, 2)
      .map((p) => ({
        icon: FileText,
        label: "Draft created:",
        projectName: p.name,
        time: formatRelativeDate(p.created_at),
      })),
  ].slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <ShellHeader
        title="Dashboard"
        description="Overview of your generated content and campaigns."
        action={
          <Link href="/projects/new">
            <Button className="h-9 gap-1.5 text-sm">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Megaphone}
          label="Campaigns"
          value={totalCampaigns}
        />
        <KpiCard
          icon={Layers}
          label="Generated Slides"
          value={totalSlides ?? 0}
        />
        <KpiCard
          icon={Clock}
          label="Pending Review"
          value={draftCount}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Success Rate"
          value={totalCampaigns > 0 ? `${successRate}%` : "—"}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">
            Failed to load projects: {error}
          </p>
        </div>
      )}

      {/* Main content: Table + Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Campaigns table */}
        <div className="xl:col-span-2">
          <ShellSection title="Recent Campaigns" description="Your latest campaigns and their status.">
            {!error && projectList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Megaphone className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  No campaigns yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground text-center max-w-xs">
                  Upload your first document to generate branded content.
                </p>
                <Link href="/projects/new" className="mt-4">
                  <Button size="sm" className="h-8 gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                        Campaign Name
                      </TableHead>
                      <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground md:table-cell">
                        Platform
                      </TableHead>
                      <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="h-10 w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProjects.slice(0, 8).map((project) => (
                      <TableRow
                        key={project.id}
                        className="group cursor-pointer transition-colors hover:bg-secondary/30"
                      >
                        <TableCell className="py-3.5">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <StatusBadge status={project.status} />
                        </TableCell>
                        <TableCell className="hidden py-3.5 md:table-cell">
                          <PlatformLabel platform={project.platform} />
                        </TableCell>
                        <TableCell className="hidden py-3.5 text-sm text-muted-foreground md:table-cell">
                          {formatDate(project.created_at)}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Link
                            href={`/projects/${project.id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground transition-all"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ShellSection>
        </div>

        {/* Activity Feed */}
        <div>
          <ShellSection title="Activity" description="Recent actions and updates.">
            <div className="rounded-xl border border-border p-4">
              {activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                <div className="divide-y divide-border/50">
                  {activityItems.map((item, i) => (
                    <ActivityItem key={i} {...item} />
                  ))}
                </div>
              )}
            </div>
          </ShellSection>
        </div>
      </div>
    </div>
  );
}
