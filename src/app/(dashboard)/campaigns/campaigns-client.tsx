"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ShellHeader, ShellSection } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
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
  return (
    <Badge variant="outline" className={variants[status].className}>
      {variants[status].label}
    </Badge>
  );
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const platformLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
};

export function CampaignsClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = projects;

    if (filter !== "all") {
      result = result.filter((p) => p.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.platform.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projects, search, filter]);

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Campaigns"
        description="Manage all your creative campaigns."
        action={
          <Link href="/projects/new">
            <Button className="h-9 gap-1.5 text-sm">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        }
      />

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              role="button"
              tabIndex={0}
              className={cn(
                "cursor-pointer transition-colors",
                filter === f.value
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter(f.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setFilter(f.value);
              }}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      <ShellSection>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <p className="text-sm text-muted-foreground">
              {projects.length === 0
                ? "No campaigns yet"
                : "No campaigns match your filters"}
            </p>
            {projects.length === 0 && (
              <Link href="/projects/new" className="mt-4">
                <Button size="sm" className="h-8 text-xs">
                  Create your first campaign
                </Button>
              </Link>
            )}
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
                    Platform
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden h-10 text-xs font-medium text-muted-foreground md:table-cell">
                    Updated
                  </TableHead>
                  <TableHead className="h-10 w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((project) => (
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
                      <span className="text-sm text-muted-foreground">
                        {platformLabels[project.platform] ?? project.platform}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="hidden py-3.5 text-sm text-muted-foreground sm:table-cell">
                      {formatDate(project.created_at)}
                    </TableCell>
                    <TableCell className="hidden py-3.5 text-sm text-muted-foreground md:table-cell">
                      {formatDate(project.updated_at)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View
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
  );
}
