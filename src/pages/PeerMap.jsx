import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PageHeader } from "@/pages/Devices";
import { MapPin, Globe2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Geographic peer map — shows where peers and relays sit relative to this node.
// Coordinates here are sample topological anchors (an honest representation: the
// web preview has no real geo-IP), used to visualize relay hops and direct links.
const PEERS = [
  { name: "Local Node", coords: [-6.8, 39.28], kind: "self", transport: "lan" },
  { name: "Office Laptop", coords: [-6.79, 39.27], kind: "peer", transport: "lan" },
  { name: "Home Android", coords: [-6.82, 39.30], kind: "peer", transport: "wifi" },
  { name: "Relay EU", coords: [50.11, 8.68], kind: "relay", transport: "relay" },
  { name: "Peer US", coords: [40.71, -74.0], kind: "peer", transport: "quic" },
];

const COLORS = { self: "#00F0FF", peer: "#10B981", relay: "#F59E0B" };

export default function PeerMap() {
  const [self, setSelf] = useState(PEERS[0]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Peer Map" subtitle="Topological view of peers, relays and direct links" icon={MapPin} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="bento-cell p-0 overflow-hidden h-[460px]">
          <MapContainer center={self.coords} zoom={3} scrollWheelZoom={false} className="w-full h-full" style={{ background: "#0B0F17" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />
            {PEERS.map((p, i) => (
              <CircleMarker key={i} center={p.coords} radius={p.kind === "self" ? 10 : 7}
                pathOptions={{ color: COLORS[p.kind], fillColor: COLORS[p.kind], fillOpacity: 0.6, weight: 2 }}>
                <Popup>
                  <strong>{p.name}</strong><br />{p.transport.toUpperCase()} · {p.kind}
                </Popup>
              </CircleMarker>
            ))}
            {PEERS.filter((p) => p.kind !== "self").map((p, i) => (
              <Polyline key={i} positions={[self.coords, p.coords]}
                pathOptions={{ color: COLORS[p.kind], weight: 1.5, opacity: 0.5, dashArray: "4 6" }} />
            ))}
          </MapContainer>
        </div>

        <div className="space-y-3">
          <div className="bento-cell p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe2 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Legend</span>
            </div>
            {Object.entries(COLORS).map(([k, c]) => (
              <div key={k} className="flex items-center gap-2 py-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-sm text-primary-ink capitalize">{k}</span>
              </div>
            ))}
          </div>
          <div className="bento-cell p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Topology</span>
            </div>
            <div className="space-y-2">
              {PEERS.map((p, i) => (
                <button key={i} onClick={() => setSelf(p)} className={cn("w-full text-left flex items-center gap-2 p-2 rounded-lg", self.name === p.name ? "bg-primary/10" : "hover:bg-white/5")}>
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[p.kind] }} />
                  <span className="text-sm text-primary-ink truncate flex-1">{p.name}</span>
                  <span className="text-[10px] font-mono text-secondary-ink uppercase">{p.transport}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}