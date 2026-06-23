import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Project not found
      </h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        The project you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="outline" size="sm" className="h-9">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
