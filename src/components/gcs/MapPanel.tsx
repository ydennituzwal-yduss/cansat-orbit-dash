import { useEffect, useRef } from "react";

export function MapPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current || mapRef.current) return;

      // Fix default icon paths
      // @ts-expect-error private
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = [28.5733, 77.3263];
      const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView(center, 15);
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map);

      // Mission path placeholder
      const path: [number, number][] = [
        [28.5728, 77.3255],
        [28.5730, 77.3258],
        [28.5732, 77.3260],
        [28.5733, 77.3263],
      ];
      L.polyline(path, { color: "#22d3ee", weight: 2, opacity: 0.8, dashArray: "4,4" }).addTo(map);

      const cansatIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#22d3ee;border:2px solid #fff;box-shadow:0 0 12px #22d3ee"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(center, { icon: cansatIcon }).addTo(map).bindPopup("CanSat — LIVE");

      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="absolute inset-0" />
      <div className="pointer-events-none absolute right-2 top-2 z-[400] flex flex-col gap-1 rounded-md border border-border bg-panel/85 p-2 font-mono text-[0.65rem] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">SATS</span>
          <span className="text-cyan-glow">12</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">HDOP</span>
          <span className="text-cyan-glow">0.9</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">FIX</span>
          <span className="text-nominal">3D</span>
        </div>
      </div>
    </div>
  );
}
