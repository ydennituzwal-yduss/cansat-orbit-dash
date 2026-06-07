import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

interface MiniChartProps {
  label: string;
  unit: string;
  color: string; // css color
  data: number[];
  yMin?: number;
  yMax?: number;
}

export function MiniChart({ label, unit, color, data, yMin, yMax }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, color + "55");
    grad.addColorStop(1, color + "00");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((_, i) => i.toString()),
        datasets: [
          {
            data,
            borderColor: color,
            backgroundColor: grad,
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { tooltip: { enabled: false } },
        scales: {
          x: {
            display: false,
            grid: { color: "rgba(120,160,200,0.06)" },
          },
          y: {
            min: yMin,
            max: yMax,
            ticks: {
              color: "rgba(180,200,220,0.55)",
              font: { family: "JetBrains Mono, monospace", size: 9 },
              maxTicksLimit: 4,
            },
            grid: { color: "rgba(120,160,200,0.08)" },
            border: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [color, data, yMax, yMin]);

  const last = data[data.length - 1];
  return (
    <div className="flex flex-col rounded-md border border-border bg-panel/50 p-2">
      <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span style={{ color }}>
          {last?.toFixed(1)} {unit}
        </span>
      </div>
      <div className="relative mt-1 h-24">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
