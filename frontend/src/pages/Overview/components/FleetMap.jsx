import React, { useState } from "react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { Truck, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", minHeight: "400px" };
const STALE_THRESHOLD_MS = 15 * 60 * 1000;

const STATUS = {
  online: "#0e8c8c", // accent teal
  stale: "#f2a413", // signal-med
};

const isStale = (updatedAt) => Date.now() - new Date(updatedAt).getTime() > STALE_THRESHOLD_MS;

const getDriverName = (loc) => {
  const d = loc.driverId;
  if (!d) return "Unknown driver";
  if (typeof d === "string") return d;
  return [d.firstName, d.lastName].filter(Boolean).join(" ") || "Unknown driver";
};

// Truck-silhouette marker in a rounded console badge (not a teardrop).
// Anchored at the bottom tip.
const truckMarker = (color) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <rect x="1.5" y="1.5" width="37" height="35" rx="10" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
      <path d="M20 36 L13.5 36 L20 47 L26.5 36 Z" fill="${color}"/>
      <rect x="7" y="13" width="12.6" height="9" rx="1.4" fill="#ffffff"/>
      <path d="M19.6 15.6 h4 l3.4 3.3 v3.1 h-7.4 z" fill="#ffffff"/>
      <circle cx="11.6" cy="23.6" r="2.4" fill="#ffffff"/>
      <circle cx="24" cy="23.6" r="2.4" fill="#ffffff"/>
      <circle cx="11.6" cy="23.6" r="1" fill="${color}"/>
      <circle cx="24" cy="23.6" r="1" fill="${color}"/>
    </svg>`
  )}`;

// Muted "console" map style so the trucks read first.
const CONSOLE_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#eef1f6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b93a7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dfe4ec" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#d7e3ec" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
];

const StatusDot = ({ color }) => (
  <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
);

const FleetMap = ({ locations }) => {
  const [selected, setSelected] = useState(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "drawing"],
  });

  const active = (locations || []).filter(
    (l) => l.locationPermission && l.latitude != null && l.longitude != null
  );
  const offlineCount = (locations || []).filter((l) => !l.locationPermission || l.latitude == null).length;
  const onlineCount = active.filter((l) => !isStale(l.updatedAt)).length;
  const staleCount = active.filter((l) => isStale(l.updatedAt)).length;

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-none border-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3">
        <div className="flex items-center gap-2">
          <Truck size={16} style={{ color: "var(--accent)" }} strokeWidth={2.4} />
          <span className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Live Fleet
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <StatusDot color={STATUS.online} /> Moving <span className="num">{onlineCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot color={STATUS.stale} /> Stale <span className="num">{staleCount}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <WifiOff size={12} /> Offline <span className="num">{offlineCount}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0">
        {!isLoaded ? (
          <Skeleton className="h-full min-h-[460px] w-full rounded-xl bg-slate-200/50" />
        ) : active.length === 0 ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-400">
            <Truck size={44} className="opacity-30" />
            <p className="text-sm font-medium">No drivers are sharing location right now</p>
          </div>
        ) : (
          <div
            className="h-full overflow-hidden rounded-xl"
            style={{ border: "2px solid var(--ink)", minHeight: 400 }}
          >
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={
                active.length === 1
                  ? { lat: active[0].latitude, lng: active[0].longitude }
                  : INDIA_CENTER
              }
              zoom={active.length === 1 ? 12 : 5}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
                styles: CONSOLE_MAP_STYLE,
              }}
            >
              {active.map((loc) => {
                const stale = isStale(loc.updatedAt);
                const id = loc.driverId?._id || loc.driverId || loc._id;
                return (
                  <MarkerF
                    key={id}
                    position={{ lat: loc.latitude, lng: loc.longitude }}
                    title={getDriverName(loc)}
                    icon={{
                      url: truckMarker(stale ? STATUS.stale : STATUS.online),
                      scaledSize:
                        typeof window !== "undefined" && window.google
                          ? new window.google.maps.Size(40, 48)
                          : undefined,
                      anchor:
                        typeof window !== "undefined" && window.google
                          ? new window.google.maps.Point(20, 47)
                          : undefined,
                    }}
                    onClick={() => setSelected(loc)}
                  />
                );
              })}
              {selected && (
                <InfoWindowF
                  position={{ lat: selected.latitude, lng: selected.longitude }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div style={{ padding: "2px 2px", minWidth: 168, fontFamily: "system-ui, sans-serif" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0e1726" }}>
                      {getDriverName(selected)}
                    </p>
                    {selected.driverId?.mobileNumber && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          margin: "4px 0",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {selected.driverId.mobileNumber}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0 0" }}>
                      Updated {new Date(selected.updatedAt).toLocaleString("en-IN")}
                    </p>
                    {isStale(selected.updatedAt) && (
                      <p style={{ fontSize: 11, color: "#b45309", margin: "4px 0 0 0", fontWeight: 600 }}>
                        Location may be stale
                      </p>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FleetMap;
