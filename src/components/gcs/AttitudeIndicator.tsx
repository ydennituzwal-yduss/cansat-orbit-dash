interface AttitudeProps {
  roll: number;
  pitch: number;
  yaw: number;
}

export function AttitudeIndicator({ roll, pitch, yaw }: AttitudeProps) {
  // Simple artificial horizon SVG
  const pitchOffset = Math.max(-45, Math.min(45, pitch)) * 1.5;
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-full border-2 border-border bg-background">
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full" style={{ transform: `rotate(${-roll}deg)` }}>
          <defs>
            <clipPath id="circ"><circle cx="0" cy="0" r="98" /></clipPath>
          </defs>
          <g clipPath="url(#circ)">
            <rect x="-200" y={-200 + pitchOffset} width="400" height="200" fill="#3b82f6" />
            <rect x="-200" y={pitchOffset} width="400" height="400" fill="#92400e" />
            {[-30, -20, -10, 10, 20, 30].map((p) => (
              <g key={p} transform={`translate(0 ${pitchOffset - p * 1.5})`}>
                <line x1={-20} x2={20} y1={0} y2={0} stroke="#fff" strokeWidth="1" />
                <text x={-28} y={3} fontSize="8" fill="#fff" textAnchor="end" fontFamily="monospace">{Math.abs(p)}</text>
              </g>
            ))}
            <line x1={-100} x2={100} y1={pitchOffset} y2={pitchOffset} stroke="#fff" strokeWidth="0.6" opacity="0.6" />
          </g>
          {/* Static aircraft symbol */}
          <line x1={-40} x2={-15} y1={0} y2={0} stroke="#fbbf24" strokeWidth="3" />
          <line x1={15} x2={40} y1={0} y2={0} stroke="#fbbf24" strokeWidth="3" />
          <circle cx={0} cy={0} r={3} fill="#fbbf24" />
          {/* Roll ticks */}
          {[-60, -30, 0, 30, 60].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <line x1={0} x2={0} y1={-98} y2={-90} stroke="#22d3ee" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[0.6rem] text-cyan-glow">▼</div>
      </div>
      <div className="grid grid-cols-3 gap-2 font-mono text-[0.7rem]">
        {[
          { l: "ROLL", v: roll, c: "text-cyan-glow" },
          { l: "PITCH", v: pitch, c: "text-cyan-glow" },
          { l: "YAW", v: yaw, c: "text-cyan-glow" },
        ].map((x) => (
          <div key={x.l} className="rounded border border-border bg-panel/50 px-2 py-1.5 text-center">
            <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">{x.l}</div>
            <div className={`mt-0.5 text-base tabular-nums ${x.c}`}>{x.v.toFixed(1)}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
