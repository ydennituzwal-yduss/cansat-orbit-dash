import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/gcs/Panel";
import { TelemetryCard } from "@/components/gcs/TelemetryCard";
import { MiniChart } from "@/components/gcs/MiniChart";
import { MapPanel } from "@/components/gcs/MapPanel";
import { ErrorPanel } from "@/components/gcs/ErrorPanel";
import { AttitudeIndicator } from "@/components/gcs/AttitudeIndicator";
import { CameraPanel } from "@/components/gcs/CameraPanel";
import { MissionLog, type LogEntry } from "@/components/gcs/MissionLog";
import { MissionControls } from "@/components/gcs/MissionControls";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CanSat Ground Control Software" },
      { name: "description", content: "Aerospace-grade Ground Control Software dashboard for CanSat mission telemetry, GPS tracking, error monitoring and command operations." },
      { property: "og:title", content: "CanSat Ground Control Software" },
      { property: "og:description", content: "NASA Mission Control inspired GCS for CanSat telemetry, mapping and command." },
    ],
  }),
  component: GCS,
});

type MissionStatus = "NOMINAL" | "WARNING" | "CRITICAL";

const statusStyles: Record<MissionStatus, string> = {
  NOMINAL: "text-nominal border-nominal/40 bg-nominal/10",
  WARNING: "text-warning border-warning/40 bg-warning/10",
  CRITICAL: "text-critical border-critical/40 bg-critical/10",
};

const seed = (base: number, amp: number, n = 40) =>
  Array.from({ length: n }, (_, i) => base + Math.sin(i / 3) * amp + Math.cos(i / 5) * amp * 0.4);

function HeaderButton({
  children,
  variant = "default",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
  onClick?: () => void;
}) {
  const styles = {
    default:
      "border-border bg-panel/70 text-foreground hover:bg-panel hover:border-cyan-glow/50",
    primary:
      "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20",
    danger:
      "border-critical/50 bg-critical/10 text-critical hover:bg-critical/20",
  }[variant];
  return (
    <button
      onClick={onClick}
      className={`rounded border px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function GCS() {
  const [missionTime, setMissionTime] = useState(0);
  const [utcNow, setUtcNow] = useState(new Date());
  const [status] = useState<MissionStatus>("NOMINAL");
  const [connected] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      setMissionTime((t) => t + 1);
      setUtcNow(new Date());
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const [logs, setLogs] = useState<LogEntry[]>([
    { t: "T+00:00:00", level: "INFO", msg: "Ground Control Software initialized" },
    { t: "T+00:00:02", level: "OK", msg: "Telemetry link established · 9600 baud" },
    { t: "T+00:00:12", level: "INFO", msg: "Mission state: PRE-LAUNCH" },
    { t: "T+00:00:34", level: "OK", msg: "GPS fix acquired · 12 satellites" },
    { t: "T+00:01:05", level: "INFO", msg: "Altitude crossed 50m" },
    { t: "T+00:01:42", level: "WARN", msg: "Apogee detected · descent rate within nominal" },
    { t: "T+00:02:18", level: "OK", msg: "Payload separation executed" },
    { t: "T+00:03:55", level: "OK", msg: "Landing detected · recovery in progress" },
  ]);

  const charts = useMemo(
    () => ({
      altitude: seed(220, 60),
      temperature: seed(24, 3),
      pressure: seed(1012, 6),
      battery: seed(7.4, 0.1),
      descent: seed(6, 2),
    }),
    []
  );

  const onExec = (cmd: string) => {
    const t = `T+${fmtTime(missionTime)}`;
    setLogs((l) => [...l, { t, level: "CRIT", msg: `Command executed: ${cmd.toUpperCase()}` }]);
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded border border-cyan-glow/40 bg-cyan-glow/10 font-display text-base font-bold text-cyan-glow">
                ◉
              </div>
              <div>
                <h1 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-foreground">
                  CanSat Ground Control Software
                </h1>
                <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Mission Operations · Telemetry Link
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest ${statusStyles[status]}`}>
              <span className="status-dot animate-pulse-glow" />
              {status}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right font-mono md:block">
              <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">MET / UTC</div>
              <div className="text-sm tabular-nums text-cyan-glow">
                T+{fmtTime(missionTime)} · {utcNow.toISOString().slice(11, 19)}Z
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <HeaderButton variant="primary">▶ Start Telemetry</HeaderButton>
              <HeaderButton variant="danger">■ Stop Telemetry</HeaderButton>
              <HeaderButton>Export CSV</HeaderButton>
              <HeaderButton>Export Graph</HeaderButton>
              <HeaderButton>Sync Time</HeaderButton>
              <HeaderButton>Reset Packets</HeaderButton>
            </div>
          </div>
        </div>
      </header>

      {/* GRID */}
      <main className="grid grid-cols-12 gap-3 p-3">
        {/* Telemetry */}
        <Panel
          title="Telemetry · Live Packet"
          status="STREAMING"
          statusColor="nominal"
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">PKT 0142</span>}
          className="col-span-12 xl:col-span-8"
        >
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
            <TelemetryCard label="Altitude" value="248.6" unit="m" trend="up" />
            <TelemetryCard label="Temperature" value="24.3" unit="°C" />
            <TelemetryCard label="Pressure" value="982.4" unit="hPa" trend="down" />
            <TelemetryCard label="Battery" value="7.42" unit="V" status="warning" />
            <TelemetryCard label="Packet Count" value="0142" />
            <TelemetryCard label="Latitude" value="28.5733° N" />
            <TelemetryCard label="Longitude" value="77.3263° E" />
            <TelemetryCard label="Mission State" value="DESCENT" />
            <TelemetryCard label="Team ID" value="2024-CSP-014" />
            <TelemetryCard label="Descent Rate" value="6.2" unit="m/s" />
          </div>
        </Panel>

        {/* Error */}
        <Panel
          title="Error Monitor"
          status="NOMINAL"
          statusColor="nominal"
          className="col-span-12 xl:col-span-4"
        >
          <ErrorPanel code="0000" />
        </Panel>

        {/* Map */}
        <Panel
          title="GPS · Live Tracking"
          status="3D FIX"
          statusColor="nominal"
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">OSM · CARTO DARK</span>}
          className="col-span-12 xl:col-span-8 h-[460px]"
          contentClassName="relative"
        >
          <MapPanel />
        </Panel>

        {/* Attitude */}
        <Panel
          title="Orientation · IMU"
          status="STABLE"
          statusColor="nominal"
          className="col-span-12 md:col-span-6 xl:col-span-4"
        >
          <AttitudeIndicator roll={-8.4} pitch={3.2} yaw={142.7} />
        </Panel>

        {/* Charts */}
        <Panel
          title="Real-Time Graphs"
          status="LIVE"
          statusColor="nominal"
          className="col-span-12 xl:col-span-8"
        >
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniChart label="Altitude vs Time" unit="m" color="#22d3ee" data={charts.altitude} />
            <MiniChart label="Temperature vs Time" unit="°C" color="#fbbf24" data={charts.temperature} />
            <MiniChart label="Pressure vs Time" unit="hPa" color="#60a5fa" data={charts.pressure} />
            <MiniChart label="Battery vs Time" unit="V" color="#a78bfa" data={charts.battery} />
            <MiniChart label="Descent Rate vs Time" unit="m/s" color="#34d399" data={charts.descent} />
            <MiniChart label="Velocity vs Time" unit="m/s" color="#f472b6" data={seed(12, 4)} />
          </div>
        </Panel>

        {/* Camera */}
        <Panel
          title="Payload Camera"
          status="STANDBY"
          statusColor="muted"
          className="col-span-12 md:col-span-6 xl:col-span-4"
        >
          <CameraPanel />
        </Panel>

        {/* Event log */}
        <Panel
          title="Mission Event Log"
          status="RECORDING"
          statusColor="nominal"
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">{logs.length} EVENTS</span>}
          className="col-span-12 md:col-span-7 xl:col-span-5 h-[320px]"
        >
          <MissionLog entries={logs} />
        </Panel>

        {/* Controls */}
        <Panel
          title="Mission Control · Commands"
          status="ARMED"
          statusColor="warning"
          className="col-span-12 md:col-span-5 xl:col-span-3 h-[320px]"
        >
          <MissionControls onExecute={onExec} />
        </Panel>

        {/* Subsystems */}
        <Panel
          title="Subsystem Status"
          status="NOMINAL"
          statusColor="nominal"
          className="col-span-12 xl:col-span-4 h-[320px]"
        >
          <ul className="space-y-1.5 p-3 font-mono text-[0.7rem]">
            {[
              { name: "Power Distribution", v: "OK", level: "ok" },
              { name: "Radio Link (LoRa 433)", v: "-78 dBm", level: "ok" },
              { name: "IMU (MPU-9250)", v: "CALIBRATED", level: "ok" },
              { name: "Barometer (BMP280)", v: "OK", level: "ok" },
              { name: "GPS Module (NEO-6M)", v: "3D FIX · 12 SAT", level: "ok" },
              { name: "Servo (Separation)", v: "ARMED", level: "warn" },
              { name: "SD Logger", v: "WRITING", level: "ok" },
              { name: "Thermal", v: "NOMINAL", level: "ok" },
            ].map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2 rounded border border-border bg-panel/40 px-2 py-1.5">
                <span className="text-muted-foreground">{s.name}</span>
                <span className={s.level === "ok" ? "text-nominal" : s.level === "warn" ? "text-warning" : "text-critical"}>
                  {s.v}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background/85 px-4 py-2 font-mono text-[0.65rem] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Ground Control Software · v1.0.0</span>
            <span className="hidden sm:inline">© 2026 Mission Ops</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`status-dot animate-pulse-glow ${connected ? "text-nominal" : "text-critical"}`} />
              <span className={connected ? "text-nominal" : "text-critical"}>
                {connected ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </span>
            <span>MQTT · STANDBY</span>
            <span>BAUD 9600</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
