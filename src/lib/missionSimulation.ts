import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LogEntry } from "@/components/gcs/MissionLog";

export type MissionPhase =
  | "PRE-LAUNCH"
  | "LAUNCH"
  | "ASCENT"
  | "APOGEE"
  | "SEPARATION"
  | "DESCENT"
  | "LANDED"
  | "RECOVERY";

export const PHASES: MissionPhase[] = [
  "PRE-LAUNCH",
  "LAUNCH",
  "ASCENT",
  "APOGEE",
  "SEPARATION",
  "DESCENT",
  "LANDED",
  "RECOVERY",
];

export interface TelemetrySample {
  t: number;
  altitude: number;
  temperature: number;
  pressure: number;
  battery: number;
  descentRate: number;
  velocity: number;
  lat: number;
  lon: number;
  roll: number;
  pitch: number;
  yaw: number;
  packet: number;
  phase: MissionPhase;
}

const BASE_LAT = 28.5728;
const BASE_LON = 77.3255;
const MAX_ALT = 300;
const ASCENT_START = 10;
const ASCENT_END = 60;
const SEPARATION_T = 65;
const DESCENT_END = 115;
const RECOVERY_T = 120;

function fmtT(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `T+${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function phaseAt(t: number): MissionPhase {
  if (t < ASCENT_START) return "PRE-LAUNCH";
  if (t === ASCENT_START) return "LAUNCH";
  if (t < ASCENT_END) return "ASCENT";
  if (t < SEPARATION_T) return "APOGEE";
  if (t === SEPARATION_T) return "SEPARATION";
  if (t < DESCENT_END) return "DESCENT";
  if (t < RECOVERY_T) return "LANDED";
  return "RECOVERY";
}

function altitudeAt(t: number): number {
  if (t <= ASCENT_START) return 0;
  if (t <= ASCENT_END) {
    const p = (t - ASCENT_START) / (ASCENT_END - ASCENT_START);
    // smooth ease-out for ascent
    return MAX_ALT * (1 - Math.pow(1 - p, 1.6));
  }
  if (t <= SEPARATION_T) return MAX_ALT - (t - ASCENT_END) * 0.5;
  if (t <= DESCENT_END) {
    const p = (t - SEPARATION_T) / (DESCENT_END - SEPARATION_T);
    return MAX_ALT * (1 - p);
  }
  return 0;
}

function sample(t: number, prevAlt: number): TelemetrySample {
  const altitude = Math.max(0, altitudeAt(t));
  const velocity = altitude - prevAlt; // m/s (1 Hz)
  const descentRate = velocity < 0 ? -velocity : 0;
  // ISA-ish pressure model (hPa)
  const pressure = 1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.255);
  const temperature = 25 - altitude * 0.0065 + (Math.random() - 0.5) * 0.3;
  const battery = Math.max(6.4, 8.4 - (t / RECOVERY_T) * 1.4 - Math.random() * 0.02);
  const phase = phaseAt(t);
  // GPS drift along trajectory (~1m / sample horizontal during flight)
  const driftScale = phase === "PRE-LAUNCH" || phase === "LANDED" || phase === "RECOVERY" ? 0 : 0.00002;
  const lat = BASE_LAT + (t - ASCENT_START) * driftScale * 0.6;
  const lon = BASE_LON + (t - ASCENT_START) * driftScale * 1.1;
  const flying = altitude > 1;
  const roll = flying ? (Math.random() * 30 - 15) : 0;
  const pitch = flying ? (Math.random() * 20 - 10) : 0;
  const yaw = (t * 3) % 360;
  return {
    t,
    altitude,
    temperature,
    pressure,
    battery,
    descentRate,
    velocity: Math.abs(velocity),
    lat,
    lon,
    roll,
    pitch,
    yaw,
    packet: t,
    phase,
  };
}

interface EngineState {
  running: boolean;
  t: number;
  history: TelemetrySample[];
  logs: LogEntry[];
  errorCode: string; // 4 digits
  servoActivated: boolean;
  gpsState: "NO FIX" | "2D FIX" | "3D FIX";
  satellites: number;
}

const INIT: EngineState = {
  running: false,
  t: 0,
  history: [sample(0, 0)],
  logs: [
    { t: "T+00:00:00", level: "INFO", msg: "Ground Control Software initialized" },
  ],
  errorCode: "0000",
  servoActivated: false,
  gpsState: "NO FIX",
  satellites: 0,
};

export function useMissionSimulation() {
  const [state, setState] = useState<EngineState>(INIT);
  const tickRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setState((s) => ({ ...s, running: false }));
  }, []);

  const reset = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setState({
      ...INIT,
      logs: [
        { t: "T+00:00:00", level: "INFO", msg: "Mission reset · All systems standing by" },
      ],
    });
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      if (!s.running) return s;
      const nextT = s.t + 1;
      const prev = s.history[s.history.length - 1];
      const samp = sample(nextT, prev?.altitude ?? 0);
      const history = [...s.history, samp].slice(-180);
      const logs = [...s.logs];
      const push = (level: LogEntry["level"], msg: string) =>
        logs.push({ t: fmtT(nextT), level, msg });

      let gpsState = s.gpsState;
      let satellites = s.satellites;
      let servoActivated = s.servoActivated;
      let errorCode = s.errorCode;

      // Phase / milestone events
      if (nextT === 2) push("OK", "Telemetry link established · 9600 baud");
      if (nextT === 4) {
        gpsState = "2D FIX";
        satellites = 6;
        push("INFO", "GPS acquiring · 2D fix");
      }
      if (nextT === 7) {
        gpsState = "3D FIX";
        satellites = 12;
        push("OK", "GPS fix acquired · 12 satellites");
      }
      if (nextT === ASCENT_START) push("OK", "Launch detected · ignition confirmed");
      if (prev && prev.altitude < 50 && samp.altitude >= 50) push("INFO", "Altitude crossed 50 m");
      if (prev && prev.altitude < 100 && samp.altitude >= 100) push("INFO", "Altitude crossed 100 m");
      if (prev && prev.altitude < 200 && samp.altitude >= 200) push("INFO", "Altitude crossed 200 m");
      if (nextT === ASCENT_END) push("WARN", "Apogee detected · 300 m");
      if (nextT === SEPARATION_T) {
        push("OK", "Payload separation executed");
        servoActivated = true;
      }
      if (nextT === SEPARATION_T + 1) push("INFO", "Descent phase started");
      if (nextT === DESCENT_END) push("OK", "Landing detected · vehicle on ground");
      if (nextT === RECOVERY_T) {
        push("OK", "Recovery phase initiated");
        push("OK", "Mission complete");
      }

      const running = nextT < RECOVERY_T + 5;
      return {
        ...s,
        running,
        t: nextT,
        history,
        logs,
        gpsState,
        satellites,
        servoActivated,
        errorCode,
      };
    });
  }, []);

  const start = useCallback(() => {
    setState((s) => (s.running ? s : { ...s, running: true }));
  }, []);

  useEffect(() => {
    if (!state.running) return;
    tickRef.current = window.setInterval(advance, 1000) as unknown as number;
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [state.running, advance]);

  const manualSeparation = useCallback(() => {
    setState((s) => ({
      ...s,
      servoActivated: true,
      logs: [
        ...s.logs,
        { t: fmtT(s.t), level: "CRIT", msg: "MANUAL SEPARATION command executed" },
      ],
    }));
  }, []);

  const deployEmergencyChute = useCallback(() => {
    setState((s) => {
      const d = s.errorCode.split("");
      d[3] = "1";
      return {
        ...s,
        errorCode: d.join(""),
        logs: [
          ...s.logs,
          { t: fmtT(s.t), level: "CRIT", msg: "EMERGENCY PARACHUTE deployed" },
        ],
      };
    });
  }, []);

  const redundantActivation = useCallback(() => {
    setState((s) => ({
      ...s,
      logs: [
        ...s.logs,
        { t: fmtT(s.t), level: "WARN", msg: "Redundant subsystems activated" },
      ],
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState((s) => ({ ...s, errorCode: "0000" }));
  }, []);

  const triggerFault = useCallback((digitIndex: number) => {
    setState((s) => {
      const d = s.errorCode.split("");
      d[digitIndex] = "1";
      return { ...s, errorCode: d.join("") };
    });
  }, []);

  const last = state.history[state.history.length - 1];
  const phase = last?.phase ?? "PRE-LAUNCH";
  const path = useMemo(
    () => state.history.filter((h) => h.t >= ASCENT_START).map((h) => [h.lat, h.lon] as [number, number]),
    [state.history]
  );

  return {
    ...state,
    last,
    phase,
    path,
    start,
    stop,
    reset,
    manualSeparation,
    deployEmergencyChute,
    redundantActivation,
    clearErrors,
    triggerFault,
    fmtT,
  };
}
