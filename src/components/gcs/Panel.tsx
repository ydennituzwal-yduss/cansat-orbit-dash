import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  status?: string;
  statusColor?: "nominal" | "warning" | "critical" | "muted";
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const dotClass = {
  nominal: "text-nominal",
  warning: "text-warning",
  critical: "text-critical",
  muted: "text-muted-foreground",
} as const;

export function Panel({
  title,
  status,
  statusColor = "nominal",
  right,
  children,
  className = "",
  contentClassName = "",
}: PanelProps) {
  return (
    <section className={`panel flex flex-col overflow-hidden ${className}`}>
      <header className="panel-header">
        <div className="flex items-center gap-2">
          <span className="text-cyan-glow">▮</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-3 normal-case tracking-normal">
          {status && (
            <span className={`flex items-center gap-1.5 text-[0.65rem] ${dotClass[statusColor]}`}>
              <span className="status-dot animate-pulse-glow" />
              <span className="font-mono uppercase tracking-widest">{status}</span>
            </span>
          )}
          {right}
        </div>
      </header>
      <div className={`flex-1 ${contentClassName}`}>{children}</div>
    </section>
  );
}
