import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShellHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ShellHeader({
  title,
  description,
  action,
  className,
}: ShellHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface ShellSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ShellSection({
  title,
  description,
  children,
  className,
}: ShellSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
