import { useEffect, useState } from "react";
import { localApi } from "@/api/localData";
import { useLocalNode } from "@/hooks/useLocalNode";
import { PageHeader } from "@/pages/Devices";
import { isNativeAndroid } from "@/lib/nativeShare";
import { Activity, ShieldCheck, Cpu, Globe, Clock, Server, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Build & system status dashboard — runtime checks against local browser capabilities.
export default function Status() {
  const node = useLocalNode();
  const [checks, setChecks] = useState([
    { id: "app", label: "Local App", status: "pending" },
    { id: "storage", label: "Browser Storage", status: "pending" },
    { id: "transport", label: "Transport Layer", status: "pending" },
    { id: "crypto", label: "WebCrypto API", status: "pending" },
  ]);
  const [uptime, setUptime] = useState(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setUptime(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    (async () => {
      setChecks((p) => p.map((c) => c.id === "app" ? { ...c, status: "ok" } : c));
      try {
        localStorage.setItem("conduit.storage-check", "ok");
        localStorage.removeItem("conduit.storage-check");
        await localApi.entities.Device.list("-updated_date", 1);
        setChecks((p) => p.map((c) => c.id === "storage" ? { ...c, status: "ok" } : c));
      } catch {
        setChecks((p) => p.map((c) => c.id === "storage" ? { ...c, status: "down" } : c));
      }
      // transport: WebRTC availability
      setChecks((p) => p.map((c) => c.id === "transport" ? { ...c, status: typeof RTCPeerConnection !== "undefined" ? "ok" : "down" } : c));
      // crypto: subtle crypto
      setChecks((p) => p.map((c) => c.id === "crypto" ? { ...c, status: (window.crypto && window.crypto.subtle) ? "ok" : "down" } : c));
    })();
  }, []);

  const allOk = checks.every((c) => c.status === "ok");
  const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="System Status" subtitle="Live health of this browser and its local capabilities" icon={Activity}
        action={
          <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono",
            allOk ? "bg-success/10 border-success/30 text-success" : "bg-amber-500/10 border-amber-500/30 text-amber-400")}>
            {allOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {allOk ? "All Systems Operational" : "Degraded"}
          </span>
        } />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checks.map((c) => (
          <div key={c.id} className="bento-cell p-4 flex items-center gap-3">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0",
              c.status === "ok" ? "bg-success animate-pulse-dot" : c.status === "down" ? "bg-destructive" : "bg-amber-400")} />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-primary-ink font-medium">{c.label}</div>
              <div className="text-xs font-mono text-secondary-ink capitalize">{c.status === "pending" ? "checking…" : c.status}</div>
            </div>
            {c.status === "ok" ? <CheckCircle2 className="w-4 h-4 text-success" /> : c.status === "down" ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-amber-400" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={Server} label="Engine Version" value="v0.9.0" />
        <InfoCard icon={Clock} label="Session Uptime" value={uptimeStr} />
        <InfoCard icon={Cpu} label="Platform" value={detectPlatform()} />
        <InfoCard icon={Globe} label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone || "—"} />
      </div>

      <div className="bento-cell p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Transport support</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRANSPORT_PROBES.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-grid">
              <span className={cn("w-2 h-2 rounded-full", t.status === "available" ? "bg-success" : "bg-secondary-ink/50")} />
              <span className="text-sm text-primary-ink">{t.label}</span>
              <span className="ml-auto text-[10px] font-mono text-secondary-ink">{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bento-cell p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Node Identity</span>
        </div>
        <div className="font-mono text-xs text-secondary-ink space-y-1">
          <div>device: <span className="text-primary-ink">{node?.name || "…"}</span></div>
          <div>id: <span className="text-primary-ink">{node?.id || "…"}</span></div>
          <div>build: <span className="text-primary-ink">web-preview (honest browser runtime)</span></div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="bento-cell p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-secondary-ink" />
        <span className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-lg font-bold text-primary-ink truncate">{value}</div>
    </div>
  );
}

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/Mac/.test(ua)) return "macOS";
  if (/Win/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Web";
}

const nativeActive = isNativeAndroid();

const TRANSPORT_PROBES = [
  { id: "webrtc", label: "WebRTC data channel", status: typeof RTCPeerConnection !== "undefined" ? "available" : "unavailable" },
  { id: "wifi", label: "Wi-Fi Direct / Quick Share", status: nativeActive ? "available" : "web fallback" },
  { id: "bluetooth", label: "Native Bluetooth", status: nativeActive ? "available" : "web fallback" },
  { id: "app_share", label: "APK App Extraction", status: nativeActive ? "available" : "android native" },
  { id: "lan", label: "Local Web Server", status: "available" },
  { id: "relay", label: "TURN relay", status: "optional server config" },
];