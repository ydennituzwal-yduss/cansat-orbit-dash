export interface LogEntry {
  t: string;
  level: "INFO" | "WARN" | "CRIT" | "OK";
  msg: string;
}

const levelClass = {
  INFO: "text-cyan-glow",
  OK: "text-nominal",
  WARN: "text-warning",
  CRIT: "text-critical",
} as const;

export function MissionLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="h-full overflow-y-auto p-2 font-mono text-[0.7rem]">
      {entries.map((e, i) => (
        <div key={i} className="flex gap-2 border-b border-border/40 py-1 last:border-b-0">
          <span className="text-muted-foreground">{e.t}</span>
          <span className={`w-10 shrink-0 ${levelClass[e.level]}`}>[{e.level}]</span>
          <span className="text-foreground/90">{e.msg}</span>
        </div>
      ))}
    </div>
  );
}
