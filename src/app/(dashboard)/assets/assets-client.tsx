"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ShellHeader, ShellSection } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, FileText, Image as ImageIcon, Calendar, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  projects?: {
    name: string;
    platform: string;
  } | null;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) {
    return ImageIcon;
  }
  return FileText;
}

const FILE_TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "Images", value: "image" },
];

export function AssetsClient({ assets }: { assets: Asset[] }) {
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filtered = useMemo(() => {
    let result = assets;

    // Filter by file type
    if (fileTypeFilter !== "all") {
      result = result.filter((asset) => {
        if (fileTypeFilter === "image") {
          return asset.file_type.startsWith("image/");
        }
        const ext = asset.file_name.split(".").pop()?.toLowerCase();
        return ext === fileTypeFilter;
      });
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.file_name.toLowerCase().includes(q) ||
          asset.projects?.name.toLowerCase().includes(q) ||
          asset.file_type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [assets, search, fileTypeFilter]);

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Asset Library"
        description="Browse all files uploaded across your campaigns."
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
            placeholder="Search assets..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILE_TYPE_FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              role="button"
              tabIndex={0}
              className={cn(
                "cursor-pointer transition-colors",
                fileTypeFilter === f.value
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFileTypeFilter(f.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setFileTypeFilter(f.value);
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              {assets.length === 0 ? "No assets yet" : "No assets match your filters"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground text-center max-w-xs">
              {assets.length === 0
                ? "Upload files when creating a campaign to see them here."
                : "Try adjusting your search or filters."}
            </p>
            {assets.length === 0 && (
              <Link href="/projects/new" className="mt-4">
                <Button size="sm" className="h-8 text-xs">
                  Create Campaign
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((asset) => {
              const Icon = getFileIcon(asset.file_type);
              return (
                <Card
                  key={asset.id}
                  className="group cursor-pointer transition-all duration-150 hover:border-border/80 hover:bg-card/80"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-center h-24 rounded-lg bg-secondary/50">
                      <Icon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {asset.file_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-secondary text-[10px] text-muted-foreground px-1.5 py-0">
                          {getFileExtension(asset.file_name)}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {asset.projects?.name || "Unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(asset.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ShellSection>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Asset Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex items-center justify-center h-48 rounded-lg bg-secondary/50 border border-border">
                {(() => {
                  const Icon = getFileIcon(selectedAsset.file_type);
                  return <Icon className="h-16 w-16 text-muted-foreground/30" />;
                })()}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">File Name</Label>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {selectedAsset.file_name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">File Type</Label>
                    <p className="text-sm text-foreground mt-1">
                      {selectedAsset.file_type}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Extension</Label>
                    <p className="text-sm text-foreground mt-1">
                      {getFileExtension(selectedAsset.file_name)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Project</Label>
                  <p className="text-sm text-foreground mt-1">
                    {selectedAsset.projects?.name || "Unknown"}
                  </p>
                  {selectedAsset.projects?.platform && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {selectedAsset.projects.platform}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Uploaded</Label>
                  <p className="text-sm text-foreground mt-1">
                    {formatDate(selectedAsset.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Link href={`/projects/${selectedAsset.projects ? "" : ""}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Project
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => setSelectedAsset(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </label>
  );
}
