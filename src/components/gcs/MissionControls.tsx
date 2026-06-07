import { useState } from "react";

interface Command {
  label: string;
  danger?: "warn" | "crit";
  desc: string;
}

const commands: Command[] = [
  { label: "Manual Separation", danger: "warn", desc: "Force payload separation immediately." },
  { label: "Deploy Emergency Parachute", danger: "crit", desc: "Deploy emergency recovery parachute." },
  { label: "Redundant Activation", danger: "warn", desc: "Activate redundant subsystems." },
  { label: "Reset Mission", danger: "crit", desc: "Reset all mission counters and state." },
];

export function MissionControls({ onExecute }: { onExecute: (cmd: string) => void }) {
  const [pending, setPending] = useState<Command | null>(null);
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      {commands.map((c) => {
        const isCrit = c.danger === "crit";
        return (
          <button
            key={c.label}
            onClick={() => setPending(c)}
            className={`group relative flex items-center justify-between rounded border px-3 py-2.5 text-left font-mono text-[0.75rem] uppercase tracking-wider transition-all ${
              isCrit
                ? "border-critical/50 bg-critical/10 text-critical hover:bg-critical/20"
                : "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">⚠</span>
              {c.label}
            </span>
            <span className="text-[0.6rem] opacity-60">EXEC →</span>
          </button>
        );
      })}

      {pending && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="panel max-w-md p-5">
            <div className="font-display text-base font-bold text-critical">⚠ CONFIRM COMMAND</div>
            <div className="mt-3 font-mono text-sm text-foreground">{pending.label}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{pending.desc}</div>
            <div className="mt-2 rounded border border-warning/40 bg-warning/10 p-2 font-mono text-[0.65rem] text-warning">
              This action is safety-critical and cannot be undone.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPending(null)}
                className="rounded border border-border bg-panel px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onExecute(pending.label);
                  setPending(null);
                }}
                className="rounded border border-critical bg-critical/20 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-critical hover:bg-critical/30"
              >
                Confirm Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
