import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { TransportBadge } from "@/components/TransportBadge";
import { timeAgo, TRANSPORT_META, PLATFORM_META } from "@/lib/format";
import { Radar, Radio, Wifi, Bluetooth, Server, Globe, RefreshCw, Send, MonitorSmartphone, Smartphone, Laptop, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_ICON = { windows: MonitorSmartphone, linux: Laptop, macos: Laptop, android: Smartphone, ios: Smartphone, web: Globe };

// Network Discovery Radar — a dedicated, animated scan view that surfaces
// every peer reachable on the local network and over the internet relay.
export default function NetworkRadar() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [sweep, setSweep] = useState(0);
  const navigate = useNavigate();
  const raf = useRef();

  const load = useCallback(async () => {
    try {
      const d = await localApi.entities.Device.list("-updated_date", 100);
      setDevices(d || []);
    } catch { setDevices([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // sweep animation
  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      setSweep((s) => (s + dt * 60) % 360);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const scan = async () => {
    setScanning(true);
    await load();
    setTimeout(() => setScanning(false), 1200);
  };

  const peers = devices.filter((d) => d.status !== "blocked");
  const online = peers.filter((d) => d.status === "online" || d.status === "paired");
  const discovered = peers.filter((d) => d.status === "discovered");

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Network Radar" subtitle="Live discovery of every peer on your network" icon={Radar}
        action={
          <button onClick={scan} disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40">
            <RefreshCw className={cn("w-4 h-4", scanning && "animate-spin")} /> {scanning ? "Scanning…" : "Scan Now"}
          </button>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Radar visual */}
        <div className="bento-cell p-6 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
          <RadarScope sweep={sweep} peers={peers} loading={loading} onDrop={(d) => {
            sessionStorage.setItem("conduit.pending_peer", d.node_id);
            sessionStorage.setItem("conduit.pending_peer_name", d.name);
            navigate("/send");
          }} />
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-secondary-ink uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            {scanning ? "scanning…" : online.length > 0 ? `${online.length} peers live` : "idle"}
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-3 text-xs font-mono text-secondary-ink">
            <Legend color="#10B981" label="online" />
            <Legend color="#00F0FF" label="discovered" />
            <Legend color="#F59E0B" label="offline" />
          </div>
        </div>

        {/* Peer list */}
        <div className="space-y-4">
          <SummaryCard icon={Wifi} label="Online / Paired" value={online.length} color="#10B981" />
          <SummaryCard icon={Radio} label="Discovered" value={discovered.length} color="#00F0FF" />
          <SummaryCard icon={Bluetooth} label="Bluetooth-capable" value={peers.filter((d) => d.transport === "bluetooth").length} color="#A78BFA" />
          <SummaryCard icon={Server} label="Relay / Cloud" value={peers.filter((d) => d.transport === "relay" || d.transport === "cloud").length} color="#F472B6" />
        </div>
      </div>

      {/* Peer detail list */}
      <div className="bento-cell p-5">
        <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-3">Discovered Peers</div>
        {loading ? (
          <div className="text-sm text-secondary-ink">scanning local network…</div>
        ) : peers.length === 0 ? (
          <div className="text-center py-8">
            <Radar className="w-10 h-10 text-secondary-ink mx-auto mb-3" />
            <div className="text-sm text-secondary-ink mb-4">No peers detected yet. Make sure other devices run Conduit on the same network.</div>
            <button onClick={() => navigate("/nearby")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm">
              <Plus className="w-4 h-4" /> Pair a Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {peers.map((d) => {
              const Icon = PLATFORM_ICON[d.platform] || Globe;
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-grid hover:border-primary/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-grid flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-primary-ink truncate">{d.name}</div>
                    <div className="text-xs font-mono text-secondary-ink">
                      {PLATFORM_META[d.platform]?.label} · {d.latency_ms != null ? `${d.latency_ms}ms` : "—"}
                    </div>
                  </div>
                  <TransportBadge transport={d.transport} />
                  <button onClick={() => navigate("/send")} className="text-primary hover:text-primary/80" title="Send files">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RadarScope({ sweep, peers, loading, onDrop }) {
  // place peers around the scope using a stable pseudo-angle from id
  const placed = peers.slice(0, 10).map((d, i) => {
    const seed = (d.node_id || d.id || String(i)).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const angle = (seed % 360) * (Math.PI / 180);
    const radius = 22 + (seed % 60);
    return { d, x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, online: d.status === "online" || d.status === "paired", discovered: d.status === "discovered" };
  });
  return (
    <div className="relative w-full max-w-[360px] aspect-square">
      {[1, 0.72, 0.46, 0.22].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-primary/15" style={{ inset: `${(1 - r) * 50}%` }} />
      ))}
      {/* crosshair */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/10" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/10" />
      {/* sweep */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 origin-left"
          style={{
            width: "50%", height: "2px",
            transform: `rotate(${sweep}deg)`,
            background: "linear-gradient(90deg, hsl(var(--primary)), transparent)",
            boxShadow: "0 0 16px hsl(var(--primary) / 0.6)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 origin-left"
          style={{
            width: "50%", height: "50%",
            transform: `rotate(${sweep}deg)`,
            background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.18), transparent 40deg)",
            transformOrigin: "left center",
          }}
        />
      </div>
      {/* center node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary animate-pulse-dot glow-primary" />
      {/* peers */}
      {!loading && placed.map(({ d, x, y, online, discovered }) => (
        <button
          key={d.id}
          onClick={() => onDrop(d)}
          title={`${d.name} — click to send`}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span className={cn("block w-3 h-3 rounded-full border-2 border-background transition-transform group-hover:scale-150",
            online ? "bg-success" : discovered ? "bg-primary" : "bg-amber-500")} />
          <span className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap text-[10px] font-mono text-primary-ink bg-black/60 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {d.name}
          </span>
        </button>
      ))}
    </div>
  );
}

function Legend({ color, label }) {
  return <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} /> {label}</span>;
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bento-cell p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, border: `1px solid ${color}40` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-primary-ink tabular-nums leading-none">{value}</div>
        <div className="text-xs text-secondary-ink mt-0.5">{label}</div>
      </div>
    </div>
  );
}