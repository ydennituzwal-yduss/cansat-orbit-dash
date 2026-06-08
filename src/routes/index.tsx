import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Panel } from "@/components/gcs/Panel";
import { TelemetryCard } from "@/components/gcs/TelemetryCard";
import { MiniChart } from "@/components/gcs/MiniChart";
import { MapPanel } from "@/components/gcs/MapPanel";
import { ErrorPanel } from "@/components/gcs/ErrorPanel";
import { AttitudeIndicator } from "@/components/gcs/AttitudeIndicator";
import { CameraPanel } from "@/components/gcs/CameraPanel";
import { MissionLog } from "@/components/gcs/MissionLog";
import { MissionControls } from "@/components/gcs/MissionControls";
import { MissionTimeline } from "@/components/gcs/MissionTimeline";
import { useMissionSimulation } from "@/lib/missionSimulation";

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

function HeaderButton({
  children,
  variant = "default",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    default: "border-border bg-panel/70 text-foreground hover:bg-panel hover:border-cyan-glow/50",
    primary: "border-cyan-glow/50 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20",
    danger: "border-critical/50 bg-critical/10 text-critical hover:bg-critical/20",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded border px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
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

function downloadCSV(rows: string[][], name: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function GCS() {
  const sim = useMissionSimulation();
  const [mounted, setMounted] = useState(false);
  const [utcStr, setUtcStr] = useState("");

  useEffect(() => {
    setMounted(true);
    const tick = () => setUtcStr(new Date().toISOString().slice(11, 19) + "Z");
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const { last, phase, history, logs, errorCode, path, satellites, gpsState, servoActivated } = sim;
  const altitude = last?.altitude ?? 0;
  const temperature = last?.temperature ?? 0;
  const pressure = last?.pressure ?? 0;
  const battery = last?.battery ?? 0;
  const descentRate = last?.descentRate ?? 0;
  const velocity = last?.velocity ?? 0;
  const lat = last?.lat ?? 28.5728;
  const lon = last?.lon ?? 77.3255;

  const status: MissionStatus =
    errorCode !== "0000"
      ? "CRITICAL"
      : phase === "APOGEE" || phase === "SEPARATION" || phase === "DESCENT"
        ? "WARNING"
        : "NOMINAL";

  const altSeries = history.map((h) => h.altitude);
  const tempSeries = history.map((h) => h.temperature);
  const pressSeries = history.map((h) => h.pressure);
  const battSeries = history.map((h) => h.battery);
  const descSeries = history.map((h) => h.descentRate);
  const velSeries = history.map((h) => h.velocity);

  const exportCSV = () => {
    const header = ["t", "phase", "altitude_m", "temp_c", "pressure_hpa", "battery_v", "velocity_mps", "descent_mps", "lat", "lon", "roll", "pitch", "yaw"];
    const rows = history.map((h) => [
      h.t, h.phase, h.altitude.toFixed(2), h.temperature.toFixed(2), h.pressure.toFixed(2),
      h.battery.toFixed(2), h.velocity.toFixed(2), h.descentRate.toFixed(2),
      h.lat.toFixed(6), h.lon.toFixed(6), h.roll.toFixed(2), h.pitch.toFixed(2), h.yaw.toFixed(2),
    ].map(String));
    downloadCSV([header, ...rows], `cansat-telemetry-${Date.now()}.csv`);
  };

  const exportGraph = () => {
    const canvases = Array.from(document.querySelectorAll("canvas")) as HTMLCanvasElement[];
    if (!canvases.length) return;
    canvases.forEach((c, i) => {
      c.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cansat-graph-${i + 1}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  };

  const onExec = (cmd: string) => {
    if (cmd === "Manual Separation") sim.manualSeparation();
    else if (cmd === "Deploy Emergency Parachute") sim.deployEmergencyChute();
    else if (cmd === "Redundant Activation") sim.redundantActivation();
    else if (cmd === "Reset Mission") sim.reset();
  };

  return (
    <div className="min-h-screen text-foreground">
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
            <div className="hidden rounded border border-cyan-glow/30 bg-cyan-glow/5 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-cyan-glow lg:block">
              Phase · {phase}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right font-mono md:block">
              <div className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">MET / UTC</div>
              <div className="text-sm tabular-nums text-cyan-glow" suppressHydrationWarning>
                T+{fmtTime(sim.t)} · {mounted ? utcStr : "--:--:--Z"}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <HeaderButton variant="primary" onClick={sim.start} disabled={sim.running}>
                ▶ Start Telemetry
              </HeaderButton>
              <HeaderButton variant="danger" onClick={sim.stop} disabled={!sim.running}>
                ■ Stop Telemetry
              </HeaderButton>
              <HeaderButton onClick={exportCSV}>Export CSV</HeaderButton>
              <HeaderButton onClick={exportGraph}>Export Graph</HeaderButton>
              <HeaderButton onClick={sim.clearErrors}>Clear Errors</HeaderButton>
              <HeaderButton onClick={sim.reset}>Reset Packets</HeaderButton>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-3 p-3">
        <Panel
          title="Telemetry · Live Packet"
          status={sim.running ? "STREAMING" : "STANDBY"}
          statusColor={sim.running ? "nominal" : "muted"}
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">PKT {String(sim.t).padStart(4, "0")}</span>}
          className="col-span-12 xl:col-span-8"
        >
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
            <TelemetryCard label="Altitude" value={altitude.toFixed(1)} unit="m" trend={velocity > 0.1 ? (phase === "DESCENT" || phase === "LANDED" ? "down" : "up") : "flat"} />
            <TelemetryCard label="Temperature" value={temperature.toFixed(1)} unit="°C" />
            <TelemetryCard label="Pressure" value={pressure.toFixed(1)} unit="hPa" trend={phase === "ASCENT" ? "down" : phase === "DESCENT" ? "up" : "flat"} />
            <TelemetryCard label="Battery" value={battery.toFixed(2)} unit="V" status={battery < 7.0 ? "warning" : "nominal"} />
            <TelemetryCard label="Packet Count" value={String(sim.t).padStart(4, "0")} />
            <TelemetryCard label="Latitude" value={`${lat.toFixed(5)}° N`} />
            <TelemetryCard label="Longitude" value={`${lon.toFixed(5)}° E`} />
            <TelemetryCard label="Mission State" value={phase} />
            <TelemetryCard label="Team ID" value="2024-CSP-014" />
            <TelemetryCard label="Descent Rate" value={descentRate.toFixed(1)} unit="m/s" />
          </div>
        </Panel>

        <Panel
          title="Error Monitor"
          status={errorCode === "0000" ? "NOMINAL" : "FAULT"}
          statusColor={errorCode === "0000" ? "nominal" : "critical"}
          className="col-span-12 xl:col-span-4"
        >
          <ErrorPanel code={errorCode} />
        </Panel>

        <Panel
          title="GPS · Live Tracking"
          status={gpsState}
          statusColor={gpsState === "3D FIX" ? "nominal" : gpsState === "2D FIX" ? "warning" : "muted"}
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">OSM · CARTO DARK</span>}
          className="col-span-12 xl:col-span-8 h-[460px]"
          contentClassName="relative"
        >
          <MapPanel path={path} current={[lat, lon]} />
        </Panel>

        <Panel
          title="Orientation · IMU"
          status="STABLE"
          statusColor="nominal"
          className="col-span-12 md:col-span-6 xl:col-span-4"
        >
          <AttitudeIndicator roll={last?.roll ?? 0} pitch={last?.pitch ?? 0} yaw={last?.yaw ?? 0} />
        </Panel>

        <Panel
          title="Real-Time Graphs"
          status={sim.running ? "LIVE" : "STANDBY"}
          statusColor={sim.running ? "nominal" : "muted"}
          className="col-span-12 xl:col-span-8"
        >
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniChart label="Altitude vs Time" unit="m" color="#22d3ee" data={altSeries} />
            <MiniChart label="Temperature vs Time" unit="°C" color="#fbbf24" data={tempSeries} />
            <MiniChart label="Pressure vs Time" unit="hPa" color="#60a5fa" data={pressSeries} />
            <MiniChart label="Battery vs Time" unit="V" color="#a78bfa" data={battSeries} />
            <MiniChart label="Descent Rate vs Time" unit="m/s" color="#34d399" data={descSeries} />
            <MiniChart label="Velocity vs Time" unit="m/s" color="#f472b6" data={velSeries} />
          </div>
        </Panel>

        <Panel
          title="Payload Camera"
          status="STANDBY"
          statusColor="muted"
          className="col-span-12 md:col-span-6 xl:col-span-4"
        >
          <CameraPanel />
        </Panel>

        <Panel
          title="Mission Event Log"
          status="RECORDING"
          statusColor="nominal"
          right={<span className="font-mono text-[0.6rem] text-muted-foreground">{logs.length} EVENTS</span>}
          className="col-span-12 md:col-span-7 xl:col-span-5 h-[320px]"
        >
          <MissionLog entries={logs} />
        </Panel>

        <Panel
          title="Mission Control · Commands"
          status="ARMED"
          statusColor="warning"
          className="col-span-12 md:col-span-5 xl:col-span-3 h-[320px]"
        >
          <MissionControls onExecute={onExec} />
        </Panel>

        <Panel
          title="Mission Timeline"
          status={phase}
          statusColor="nominal"
          className="col-span-12 xl:col-span-4 h-[320px]"
        >
          <MissionTimeline current={phase} />
        </Panel>

        <Panel
          title="Subsystem Status"
          status="NOMINAL"
          statusColor="nominal"
          className="col-span-12"
        >
          <ul className="grid grid-cols-2 gap-1.5 p-3 font-mono text-[0.7rem] md:grid-cols-4">
            {[
              { name: "Power Distribution", v: battery > 7.0 ? "OK" : "LOW", level: battery > 7.0 ? "ok" : "warn" },
              { name: "Radio Link (LoRa 433)", v: sim.running ? "-78 dBm" : "STANDBY", level: "ok" },
              { name: "IMU (MPU-9250)", v: "CALIBRATED", level: "ok" },
              { name: "Barometer (BMP280)", v: "OK", level: "ok" },
              { name: "GPS Module (NEO-6M)", v: `${gpsState} · ${satellites} SAT`, level: gpsState === "3D FIX" ? "ok" : gpsState === "2D FIX" ? "warn" : "crit" },
              { name: "Servo (Separation)", v: servoActivated ? "ACTIVATED" : "ARMED", level: servoActivated ? "ok" : "warn" },
              { name: "SD Logger", v: sim.running ? "WRITING" : "IDLE", level: "ok" },
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

      <footer className="border-t border-border bg-background/85 px-4 py-2 font-mono text-[0.65rem] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Ground Control Software · v1.0.0</span>
            <span className="hidden sm:inline">© 2026 Mission Ops</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`status-dot animate-pulse-glow ${sim.running ? "text-nominal" : "text-critical"}`} />
              <span className={sim.running ? "text-nominal" : "text-critical"}>
                {sim.running ? "TELEMETRY LIVE" : "DISCONNECTED"}
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
