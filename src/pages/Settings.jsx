import { useState } from "react";
import { PageHeader } from "@/pages/Devices";
import { Settings as SettingsIcon, Gauge, Battery, Wifi, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { reconnectPeerPresence } from "@/lib/shareTransport";

const buildSignalingUrl = /** @type {ImportMeta & {env?: {VITE_SIGNALING_URL?: string}}} */ (import.meta).env
  ?.VITE_SIGNALING_URL;

export default function Settings() {
  const [bandwidth, setBandwidth] = useState("unlimited");
  const [priority, setPriority] = useState("balanced");
  const [compression, setCompression] = useState("auto");
  const [darkMode, setDarkMode] = useState(true);
  const [notify, setNotify] = useState(true);
  const [sharingServer, setSharingServer] = useState(() => {
    const configured = localStorage.getItem("conduit.signaling_url") || buildSignalingUrl || "";
    if (!configured) return "";
    try { return new URL(configured).origin; } catch { return configured; }
  });
  const [sharingServerSaved, setSharingServerSaved] = useState(false);
  const [sharingServerError, setSharingServerError] = useState("");

  const BANDWIDTH = [
    { value: "unlimited", label: "Unlimited" },
    { value: "20", label: "20 MB/s" },
    { value: "50", label: "50 MB/s" },
    { value: "100", label: "100 MB/s" },
    { value: "custom", label: "Custom" },
  ];
  const PRIORITY = [
    { value: "performance", label: "Performance", icon: Zap, desc: "Max parallelism & CPU" },
    { value: "balanced", label: "Balanced", icon: Gauge, desc: "Adaptive defaults" },
    { value: "battery_saver", label: "Battery Saver", icon: Battery, desc: "Lower concurrency on mobile" },
    { value: "data_saver", label: "Data Saver", icon: Wifi, desc: "Cap mobile data use" },
  ];

  const saveSharingServer = () => {
    setSharingServerError("");
    setSharingServerSaved(false);
    try {
      const parsed = new URL(sharingServer);
      if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
        throw new Error("Enter a valid HTTP or HTTPS server address.");
      }
      parsed.pathname = "/signal";
      parsed.search = "";
      parsed.hash = "";
      localStorage.setItem("conduit.signaling_url", parsed.toString());
      setSharingServer(parsed.origin);
      reconnectPeerPresence();
      setSharingServerSaved(true);
    } catch (error) {
      setSharingServerError(error.message || "Enter a valid server address, such as https://share.example.com.");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Settings" subtitle="Transfer behavior, bandwidth, and appearance" icon={SettingsIcon} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bento-cell p-5 lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">File sharing server</span>
          </div>
          <p className="text-sm text-secondary-ink">
            On the same Wi-Fi, enter the computer's LAN address and port (for example, http://192.168.1.20:8787).
            For sharing over the internet, enter your public HTTPS server address.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={sharingServer}
              onChange={(event) => { setSharingServer(event.target.value); setSharingServerSaved(false); }}
              placeholder="https://share.example.com"
              aria-label="File sharing server address"
              className="flex-1 rounded-lg bg-white/5 border border-grid px-3 py-2 text-sm text-primary-ink"
            />
            <button onClick={saveSharingServer} className="px-4 py-2 rounded-lg bg-primary text-primary-ink font-semibold text-sm">
              Save server
            </button>
          </div>
          {sharingServerSaved && <p className="text-sm text-success" role="status">Sharing server saved on this device.</p>}
          {sharingServerError && <p className="text-sm text-destructive" role="alert">{sharingServerError}</p>}
          {!sharingServer && <p className="text-xs text-secondary-ink">The development site uses its own address by default. The Android app needs a server address.</p>}
        </div>

        <div className="bento-cell p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Bandwidth Limit</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BANDWIDTH.map((b) => (
              <button key={b.value} onClick={() => setBandwidth(b.value)}
                className={cn("px-3 py-2 rounded-lg border text-sm", bandwidth === b.value ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink")}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bento-cell p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Default Compression</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["auto", "off", "fast", "maximum"].map((c) => (
              <button key={c} onClick={() => setCompression(c)}
                className={cn("px-3 py-2 rounded-lg border text-sm capitalize", compression === c ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink")}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="bento-cell p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Battery className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Network Priority</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PRIORITY.map((p) => (
              <button key={p.value} onClick={() => setPriority(p.value)}
                className={cn("p-4 rounded-lg border text-left", priority === p.value ? "bg-primary/10 border-primary/30" : "bg-white/5 border-grid")}>
                <p.icon className={cn("w-5 h-5 mb-2", priority === p.value ? "text-primary" : "text-secondary-ink")} />
                <div className="text-sm text-primary-ink font-medium">{p.label}</div>
                <div className="text-xs text-secondary-ink mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bento-cell p-5">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">Appearance & Notifications</div>
          <Toggle label="Dark mode" value={darkMode} onChange={setDarkMode} />
          <Toggle label="Transfer notifications" value={notify} onChange={setNotify} />
        </div>

        <div className="bento-cell p-5">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">CLI / Developer Mode</div>
          <p className="text-sm text-secondary-ink mb-3">The same transfer engine is exposed via CLI in native builds:</p>
          <div className="font-mono text-xs text-primary-ink bg-black/40 rounded-lg p-3 space-y-1">
            <div><span className="text-secondary-ink">$</span> conduit send ./project</div>
            <div><span className="text-secondary-ink">$</span> conduit receive</div>
            <div><span className="text-secondary-ink">$</span> conduit status</div>
            <div><span className="text-secondary-ink">$</span> conduit benchmark</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-grid last:border-0">
      <span className="text-sm text-primary-ink">{label}</span>
      <button onClick={() => onChange(!value)}
        className={cn("w-11 h-6 rounded-full border transition-colors relative", value ? "bg-primary/30 border-primary/40" : "bg-white/5 border-grid")}>
        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full transition-all", value ? "left-5 bg-primary" : "left-0.5 bg-secondary-ink")} />
      </button>
    </div>
  );
}