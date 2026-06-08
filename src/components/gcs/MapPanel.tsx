import { useEffect, useRef } from "react";

interface MapPanelProps {
  path: [number, number][];
  current?: [number, number];
}

export function MapPanel({ path, current }: MapPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<{ poly?: any; marker?: any; L?: any }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current || mapRef.current) return;
      // @ts-expect-error private
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = current ?? [28.5728, 77.3255];
      const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView(center, 16);
      mapRef.current = map;
      layerRef.current.L = L;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);

      layerRef.current.poly = L.polyline(path.length ? path : [center], {
        color: "#22d3ee",
        weight: 2.5,
        opacity: 0.9,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#22d3ee;border:2px solid #fff;box-shadow:0 0 12px #22d3ee"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      layerRef.current.marker = L.marker(center, { icon }).addTo(map).bindPopup("CanSat · LIVE");

      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = {};
    };
  }, []);

  useEffect(() => {
    const { poly, marker } = layerRef.current;
    if (!mapRef.current || !poly || !marker) return;
    const pts = path.length ? path : current ? [current] : [];
    if (pts.length) poly.setLatLngs(pts);
    if (current) marker.setLatLng(current);
  }, [path, current]);

  const coord = current ?? path[path.length - 1];

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="absolute inset-0" />
      <div className="pointer-events-none absolute right-2 top-2 z-[400] flex flex-col gap-1 rounded-md border border-border bg-panel/85 p-2 font-mono text-[0.65rem] backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">LAT</span>
          <span className="text-cyan-glow tabular-nums">{coord ? coord[0].toFixed(5) : "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">LON</span>
          <span className="text-cyan-glow tabular-nums">{coord ? coord[1].toFixed(5) : "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">PTS</span>
          <span className="text-cyan-glow tabular-nums">{path.length}</span>
        </div>
      </div>
    </div>
  );
}
