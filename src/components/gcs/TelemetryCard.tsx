interface TelemetryCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  status?: "nominal" | "warning" | "critical";
}

const statusBorder = {
  nominal: "border-l-nominal",
  warning: "border-l-warning",
  critical: "border-l-critical",
} as const;

export function TelemetryCard({
  label,
  value,
  unit,
  trend = "flat",
  status = "nominal",
}: TelemetryCardProps) {
  const trendSym = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-border bg-panel/60 border-l-2 ${statusBorder[status]} px-3 py-2.5 transition-colors hover:bg-panel`}
    >
      <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className={status === "nominal" ? "text-nominal" : status === "warning" ? "text-warning" : "text-critical"}>
          {trendSym}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 font-mono">
        <span className="text-xl font-semibold text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-[0.7rem] text-cyan-glow">{unit}</span>}
      </div>
    </div>
  );
}
