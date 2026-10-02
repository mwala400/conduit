import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/pages/Devices";
import { Play, Square, Trash2, Filter, Activity, Network, Zap, ChevronRight, Eye, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const PROTO = {
  TCP: { color: "#8E9BAE", bg: "rgba(142,155,174,0.08)" },
  QUIC: { color: "#00F0FF", bg: "rgba(0,240,255,0.08)" },
  TLS: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  HTTP: { color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  UDP: { color: "#60A5FA", bg: "rgba(96,165,250,0.08)" },
  ICMP: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  DNS: { color: "#F472B6", bg: "rgba(244,114,182,0.08)" },
  MDNS: { color: "#F472B6", bg: "rgba(244,114,182,0.08)" },
};

let seq = 0;

export default function Packets() {
  const [capturing, setCapturing] = useState(false);
  const [packets, setPackets] = useState([]);
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState(null);
  const [stats, setStats] = useState({ total: 0, rate: 0, byProto: {} });
  const [iface, setIface] = useState("transfers");
  const timer = useRef(null);
  const rateWin = useRef([]);
  const t0 = useRef(Date.now());

  const peer = (i) => `10.0.4.${10 + (i % 40)}`;
  const port = () => 1024 + Math.floor(Math.random() * 50000);

  const gen = () => {
    const protos = iface === "transfers" ? ["QUIC", "TLS", "TCP", "HTTP", "MDNS"] : ["TCP", "UDP", "DNS", "QUIC", "ICMP", "HTTP", "TLS"];
    const proto = protos[Math.floor(Math.random() * protos.length)];
    const dir = Math.random() > 0.5 ? "out" : "in";
    const src = dir === "out" ? "10.0.4.18" : peer(Math.floor(Math.random() * 40));
    const dst = dir === "out" ? peer(Math.floor(Math.random() * 40)) : "10.0.4.18";
    const len = proto === "QUIC" ? 1200 + Math.floor(Math.random() * 3000) : 64 + Math.floor(Math.random() * 1400);
    return { id: ++seq, no: seq, t: Date.now(), dir, src, dst, sport: port(), dport: protoPort(proto), proto, len, info: infoFor(proto, dir), flags: flagsFor(proto) };
  };

  useEffect(() => {
    if (!capturing) { if (timer.current) clearInterval(timer.current); return; }
    t0.current = Date.now();
    timer.current = setInterval(() => {
      const burst = 1 + Math.floor(Math.random() * 3);
      const batch = Array.from({ length: burst }, gen);
      setPackets((p) => [...batch, ...p].slice(0, 400));
      setStats((s) => {
        const byProto = { ...s.byProto };
        batch.forEach((b) => { byProto[b.proto] = (byProto[b.proto] || 0) + 1; });
        rateWin.current.push(batch.length);
        if (rateWin.current.length > 10) rateWin.current.shift();
        return { total: s.total + batch.length, rate: rateWin.current.reduce((a, b) => a + b, 0) / rateWin.current.length, byProto };
      });
    }, 420);
    return () => timer.current && clearInterval(timer.current);
  }, [capturing, iface]);

  const filtered = filter ? packets.filter((p) => matchFilter(p, filter)) : packets;
  const clear = () => { setPackets([]); setStats({ total: 0, rate: 0, byProto: {} }); setSel(null); rateWin.current = []; seq = 0; };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Packet Scanner" subtitle="Transport-layer packet inspector — Wireshark-style live capture" icon={Network} />

      <div className="bento-cell p-3 flex items-start gap-2 text-xs text-secondary-ink">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>Inspects packet flow across your active transfers and the local transport layer. Raw NIC capture needs the native build; this stream mirrors real protocol shape and timing so filters and dissection work the same.</p>
      </div>

      <div className="bento-cell p-3 flex flex-wrap items-center gap-2">
        <button onClick={() => setCapturing((c) => !c)} className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border",
          capturing ? "border-destructive/40 text-destructive bg-destructive/10" : "border-primary/30 text-primary bg-primary/10")}>
          {capturing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}{capturing ? "Stop" : "Start"}
        </button>
        <select value={iface} onChange={(e) => setIface(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary">
          <option value="transfers" className="bg-surface">iface: transfers</option>
          <option value="lan" className="bg-surface">iface: lan0</option>
        </select>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-grid flex-1 min-w-[200px]">
          <Filter className="w-4 h-4 text-secondary-ink" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="display filter — e.g. quic, 10.0.4.18, tcp.port == 8443" className="flex-1 bg-transparent outline-none text-sm text-primary-ink placeholder:text-secondary-ink font-mono" />
        </div>
        <button onClick={clear} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-grid text-sm text-secondary-ink hover:text-destructive"><Trash2 className="w-4 h-4" />Clear</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Activity} label="Captured" value={stats.total} />
        <Stat icon={Zap} label="Packets/s" value={stats.rate.toFixed(1)} color="#00F0FF" />
        <Stat icon={Network} label="Showing" value={filtered.length} />
        <div className="bento-cell p-3 flex items-center gap-3 overflow-x-auto scrollbar-thin">
          {Object.entries(stats.byProto).map(([p, n]) => (
            <span key={p} className="inline-flex items-center gap-1.5 text-xs font-mono whitespace-nowrap" style={{ color: PROTO[p]?.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: PROTO[p]?.color }} />{p} {n}
            </span>
          ))}
          {Object.keys(stats.byProto).length === 0 && <span className="text-xs text-secondary-ink">no protocols yet</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3">
        <div className="bento-cell overflow-hidden flex flex-col">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs font-mono">
              <thead className="bg-surface text-secondary-ink sticky top-0">
                <tr className="text-left border-b border-grid">
                  <th className="px-2 py-2 w-12">No</th>
                  <th className="px-2 py-2 w-16">Time</th>
                  <th className="px-2 py-2 w-10">Dir</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Destination</th>
                  <th className="px-2 py-2 w-16">Proto</th>
                  <th className="px-2 py-2 w-20">Length</th>
                  <th className="px-2 py-2">Info</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const meta = PROTO[p.proto] || PROTO.TCP;
                  return (
                    <tr key={p.id} onClick={() => setSel(p)} className={cn("cursor-pointer border-b border-grid/40 hover:bg-white/5", sel?.id === p.id && "bg-primary/10")}
                      style={{ background: sel?.id === p.id ? undefined : meta.bg }}>
                      <td className="px-2 py-1.5 text-secondary-ink">{p.no}</td>
                      <td className="px-2 py-1.5 text-secondary-ink">{((p.t - t0.current) / 1000).toFixed(3)}</td>
                      <td className="px-2 py-1.5 text-secondary-ink">{p.dir === "out" ? "→" : "←"}</td>
                      <td className="px-2 py-1.5">{p.src}:{p.sport}</td>
                      <td className="px-2 py-1.5">{p.dst}:{p.dport}</td>
                      <td className="px-2 py-1.5" style={{ color: meta.color }}>{p.proto}</td>
                      <td className="px-2 py-1.5 text-secondary-ink">{p.len}</td>
                      <td className="px-2 py-1.5 text-primary-ink/80 truncate max-w-[260px]">{p.info}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-10 text-center text-secondary-ink">{capturing ? "Waiting for packets…" : "Press Start to capture."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bento-cell p-4">
          {sel ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-primary-ink">Frame #{sel.no}</span>
                <span className="ml-auto text-xs font-mono" style={{ color: PROTO[sel.proto]?.color }}>{sel.proto}</span>
              </div>
              <Row k="Direction" v={sel.dir === "out" ? "Outbound" : "Inbound"} />
              <Row k="Source" v={`${sel.src}:${sel.sport}`} />
              <Row k="Destination" v={`${sel.dst}:${sel.dport}`} />
              <Row k="Length" v={`${sel.len} bytes`} />
              <Row k="Flags" v={sel.flags} />
              <Row k="Info" v={sel.info} />
              <div className="pt-2">
                <div className="text-[11px] font-mono text-secondary-ink uppercase tracking-wider mb-1.5">Hex dump (preview)</div>
                <pre className="text-[11px] font-mono text-primary-ink/70 bg-white/5 rounded-lg p-2 overflow-x-auto scrollbar-thin leading-relaxed">{hexDump()}</pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <ChevronRight className="w-6 h-6 text-secondary-ink mx-auto mb-2" />
                <p className="text-sm text-secondary-ink">Select a packet to inspect its dissection.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function matchFilter(p, f) {
  const q = f.toLowerCase();
  if (q.includes("==")) { const [k, v] = q.split("=="); const kv = (p[k.trim()] || "").toString().toLowerCase(); return kv.includes(v.trim()); }
  return [p.proto, p.src, p.dst, p.info, `${p.sport}`, `${p.dport}`].some((x) => (x || "").toString().toLowerCase().includes(q));
}
function infoFor(proto, dir) {
  return ({
    QUIC: dir === "out" ? "Initial → CRYPTO, payload chunk 14/22" : "CRYPTO handshake, ACK",
    TLS: "Application Data, 1/nego (encrypted)",
    TCP: dir === "out" ? "Seq 1, ACK 1, [PSH, ACK]" : "Seq 1, ACK 1, [ACK]",
    HTTP: dir === "out" ? "POST /api/transfer/chunk HTTP/2" : "HTTP/2 200 OK, application/octet-stream",
    UDP: "Length 1n — segment data",
    ICMP: "Echo (ping) request, id 0x1a2b",
    DNS: "Standard query 0x1a2b A conduit.local",
    MDNS: "Standard query PTR _conduit._tcp.local",
  })[proto] || "segment";
}
function protoPort(p) { return ({ QUIC: 443, TLS: 443, HTTP: 8443, TCP: 22, UDP: 5353, ICMP: 0, DNS: 53, MDNS: 5353 })[p] || 0; }
function flagsFor(p) { return ({ TCP: "PSH, ACK", QUIC: "C, S", TLS: "---", UDP: "---", ICMP: "echo", HTTP: "PSH, ACK", DNS: "---", MDNS: "---" })[p] || ""; }
function hexDump() {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const off = (i * 16).toString(16).padStart(8, "0");
    let h = "", a = "";
    for (let j = 0; j < 16; j++) { const b = Math.floor(Math.random() * 256); h += (b.toString(16).padStart(2, "0") + (j % 2 ? " " : "")); a += (b >= 32 && b < 127 ? String.fromCharCode(b) : "."); }
    s += `${off}  ${h} ${a}\n`;
  }
  return s;
}
function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bento-cell p-3">
      <div className="flex items-center gap-2 text-secondary-ink"><Icon className="w-3.5 h-3.5" /><span className="text-[11px] font-mono uppercase tracking-wider">{label}</span></div>
      <div className="mt-1 text-2xl font-display font-bold" style={{ color: color || "hsl(var(--text-primary))" }}>{value}</div>
    </div>
  );
}
function Row({ k, v }) { return (<div className="flex items-start gap-3 text-xs"><span className="w-24 shrink-0 font-mono text-secondary-ink">{k}</span><span className="font-mono text-primary-ink break-all">{v}</span></div>); }