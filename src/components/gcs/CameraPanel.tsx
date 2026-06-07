import { useState } from "react";

export function CameraPanel() {
  const [streaming, setStreaming] = useState(false);
  const [camera, setCamera] = useState("PAYLOAD-1");
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="relative aspect-video w-full overflow-hidden rounded border border-border bg-black">
        {streaming ? (
          <>
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(34,211,238,0.07) 0 2px, transparent 2px 4px), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.25), transparent 70%)",
              }}
            />
            <div
              className="absolute inset-x-0 h-12 bg-gradient-to-b from-cyan-glow/20 to-transparent"
              style={{ animation: "scanline 3s linear infinite" }}
            />
            <div className="absolute left-2 top-2 rounded bg-critical/80 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-white">
              ● REC
            </div>
            <div className="absolute right-2 top-2 font-mono text-[0.65rem] text-cyan-glow">{camera}</div>
            <div className="absolute bottom-2 left-2 font-mono text-[0.6rem] text-muted-foreground">
              1280×720 · 30FPS · H.264
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
            NO SIGNAL · STANDBY
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={camera}
          onChange={(e) => setCamera(e.target.value)}
          className="flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
        >
          <option>PAYLOAD-1</option>
          <option>PAYLOAD-2</option>
          <option>GROUND-TRACKER</option>
        </select>
        <button
          onClick={() => setStreaming(true)}
          disabled={streaming}
          className="rounded border border-nominal/40 bg-nominal/10 px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-nominal hover:bg-nominal/20 disabled:opacity-40"
        >
          Start
        </button>
        <button
          onClick={() => setStreaming(false)}
          disabled={!streaming}
          className="rounded border border-critical/40 bg-critical/10 px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-critical hover:bg-critical/20 disabled:opacity-40"
        >
          Stop
        </button>
      </div>
      <div className="flex items-center justify-between rounded border border-border bg-panel/50 px-2 py-1 font-mono text-[0.65rem]">
        <span className="text-muted-foreground">STATUS</span>
        <span className={`flex items-center gap-1.5 ${streaming ? "text-nominal" : "text-muted-foreground"}`}>
          <span className="status-dot animate-pulse-glow" /> {streaming ? "LIVE" : "OFFLINE"}
        </span>
      </div>
    </div>
  );
}
