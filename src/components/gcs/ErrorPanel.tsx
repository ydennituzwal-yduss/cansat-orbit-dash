interface ErrorPanelProps {
  code: string; // 4 digits
}

const meanings = [
  { label: "Descent Rate Fault", short: "DSC" },
  { label: "GPS Availability Fault", short: "GPS" },
  { label: "Payload Separation Failure", short: "SEP" },
  { label: "Emergency Parachute Active", short: "EPC" },
];

export function ErrorPanel({ code }: ErrorPanelProps) {
  const digits = code.padStart(4, "0").slice(0, 4).split("");
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-background/60 px-4 py-3">
        {digits.map((d, i) => {
          const active = d !== "0";
          return (
            <div
              key={i}
              className={`flex h-16 w-12 items-center justify-center rounded border font-display text-4xl font-bold tabular-nums ${
                active
                  ? "border-critical bg-critical/10 text-critical shadow-[0_0_18px_oklch(0.65_0.26_25/0.4)]"
                  : "border-border bg-panel/50 text-cyan-glow"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-1.5 font-mono text-[0.7rem]">
        {meanings.map((m, i) => {
          const active = digits[i] !== "0";
          return (
            <li key={i} className="flex items-center justify-between gap-2 rounded border border-border bg-panel/40 px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-background/80 px-1.5 py-0.5 text-cyan-glow">D{i + 1}</span>
                <span className="text-muted-foreground">{m.label}</span>
              </div>
              <span className={`uppercase ${active ? "text-critical" : "text-nominal"}`}>
                {active ? "FAULT" : "OK"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
