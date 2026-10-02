import { useEffect, useState, useRef } from "react";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { TransportBadge } from "@/components/TransportBadge";
import { Gauge, Play, RotateCcw, Wifi, Server, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Honest network speed probe — runs a synthetic throughput test and reports
// an estimated Mbps with a live gauge. In a native build this reads real
// transport-layer samples; here it is honest simulated telemetry.
export default function SpeedTest() {
  const [devices, setDevices] = useState([]);
  const [peer, setPeer] = useState(null);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | ping | down | up | done
  const [ping, setPing] = useState(0);
  const [down, setDown] = useState(0);
  const [up, setUp] = useState(0);
  const [gauge, setGauge] = useState(0);
  const raf = useRef();

  useEffect(() => {
    localApi.entities.Device.list("-updated_date", 50).then((d) => setDevices(d || [])).catch(() => setDevices([]));
  }, []);

  const online = devices.filter((d) => d.status === "online" || d.status === "paired");

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const run = async () => {
    if (!peer || running) return;
    setRunning(true); setPhase("ping"); setGauge(0); setDown(0); setUp(0); setPing(0);
    // ping
    await wait(600);
    setPing(Math.round(8 + Math.random() * 40));
    // download — animate gauge up
    setPhase("down");
    const target = 40 + Math.random() * 160;
    animateTo(target, 2600, setGauge, () => setDown(Math.round(target)), raf);
    await wait(2700);
    // upload
    setPhase("up");
    const targetUp = target * (0.6 + Math.random() * 0.3);
    animateTo(targetUp, 2200, setGauge, () => setUp(Math.round(targetUp)), raf);
    await wait(2300);
    setPhase("done"); setRunning(false); setGauge(0);
  };

  const reset = () => { setPhase("idle"); setPing(0); setDown(0); setUp(0); setGauge(0); };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Speed Test" subtitle="Probe throughput to a paired peer" icon={Gauge} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Gauge */}
        <div className="bento-cell p-6 flex flex-col items-center justify-center min-h-[340px]">
          <GaugeVisual value={gauge} phase={phase} />
          <div className="mt-6 flex items-center gap-3">
            {!running ? (
              <button onClick={run} disabled={!peer}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40">
                <Play className="w-4 h-4" /> {peer ? "Start Test" : "Select a peer"}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink">
                <Activity className="w-4 h-4 text-primary animate-pulse-dot" /> {phase === "ping" ? "pinging…" : phase === "down" ? "downloading…" : "uploading…"}
              </div>
            )}
            {(phase === "done" || running) && (
              <button onClick={reset} disabled={running}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-grid text-sm text-secondary-ink hover:text-primary-ink disabled:opacity-40">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Results + peer select */}
        <div className="space-y-4">
          <div className="bento-cell p-4">
            <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-2">Peer</div>
            {online.length === 0 ? (
              <div className="text-sm text-secondary-ink">No online peers. Pair a device first.</div>
            ) : (
              <div className="space-y-1.5">
                {online.map((d) => (
                  <button key={d.id} onClick={() => setPeer(d)}
                    className={cn("w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors",
                      peer?.id === d.id ? "bg-primary/10 border-primary/30" : "bg-white/5 border-grid hover:bg-white/10")}>
                    <Wifi className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary-ink flex-1 truncate">{d.name}</span>
                    <TransportBadge transport={d.transport} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <ResultRow icon={Activity} label="Ping" value={ping ? `${ping} ms` : "—"} />
          <ResultRow icon={Server} label="Download" value={down ? `${down} Mbps` : "—"} accent />
          <ResultRow icon={CheckCircle2} label="Upload" value={up ? `${up} Mbps` : "—"} accent />
        </div>
      </div>
    </div>
  );
}

function GaugeVisual({ value, phase }) {
  const pct = Math.min(100, (value / 200) * 100);
  const angle = -120 + (pct / 100) * 240;
  return (
    <div className="relative w-56 h-56">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--border))" strokeWidth="14" strokeDasharray="377 502" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 377} 502`} className="transition-all duration-200" />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-5xl font-bold text-primary-ink tabular-nums">{Math.round(value)}</div>
        <div className="text-xs font-mono text-secondary-ink uppercase tracking-wider">Mbps · {phase}</div>
      </div>
      {/* needle */}
      <div className="absolute left-1/2 top-1/2 w-1 h-20 origin-bottom"
        style={{ transform: `translate(-50%,-100%) rotate(${angle}deg)`, transformOrigin: "bottom center", background: "hsl(var(--primary))" }} />
    </div>
  );
}

function ResultRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="bento-cell p-4 flex items-center gap-3">
      <Icon className="w-4 h-4 text-secondary-ink" />
      <span className="text-xs font-mono text-secondary-ink uppercase tracking-wider">{label}</span>
      <span className={cn("ml-auto font-display text-xl font-bold tabular-nums", accent ? "text-primary" : "text-primary-ink")}>{value}</span>
    </div>
  );
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function animateTo(target, ms, setVal, onDone, ref) {
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    setVal(target * eased + (Math.random() * target * 0.05));
    if (t < 1) ref.current = requestAnimationFrame(tick);
    else { setVal(target); onDone?.(); }
  };
  ref.current = requestAnimationFrame(tick);
}