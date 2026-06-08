import { PHASES, type MissionPhase } from "@/lib/missionSimulation";

export function MissionTimeline({ current }: { current: MissionPhase }) {
  const idx = PHASES.indexOf(current);
  return (
    <ul className="flex h-full flex-col gap-1.5 p-3 font-mono text-[0.7rem]">
      {PHASES.map((p, i) => {
        const done = i < idx;
        const active = i === idx;
        const color = active
          ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow"
          : done
            ? "border-nominal/40 bg-nominal/5 text-nominal"
            : "border-border bg-panel/40 text-muted-foreground";
        const mark = done ? "✓" : active ? "▶" : "○";
        return (
          <li
            key={p}
            className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 transition-colors ${color}`}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 text-center">{mark}</span>
              <span className="uppercase tracking-wider">{p}</span>
            </span>
            <span className="text-[0.6rem] opacity-70">
              {done ? "COMPLETE" : active ? "ACTIVE" : "PENDING"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
