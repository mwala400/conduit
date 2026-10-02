import { PageHeader } from "@/pages/Devices";
import { Sparkles, ShieldCheck, Zap, Layers, FileCheck2, Calendar, Link2, MapPin, Radar,
  RefreshCw, Command, Gauge, Route, Bell, MousePointerClick, Palette, Activity, Cpu,
  Download, Terminal, Globe, Smartphone, Lock, GitBranch, Network, Wifi, Boxes } from "lucide-react";

const FEATURES = [
  { icon: Network, title: "Direct Device-to-Device", text: "Files flow straight peer-to-peer — your data never touches a third-party cloud.", status: "Live", tone: "primary" },
  { icon: Lock, title: "End-to-End Encryption", text: "Every chunk is encrypted on-device; even the relay can't read your payload.", status: "Live", tone: "success" },
  { icon: Route, title: "WebRTC Transport", text: "Connects directly when possible; a TURN relay can be configured for restrictive networks.", status: "Live", tone: "primary" },
  { icon: Boxes, title: "Chunked Transfer", text: "Files are sent in bounded chunks with backpressure to avoid overfilling the connection.", status: "Live", tone: "primary" },
  { icon: FileCheck2, title: "SHA-256 Integrity Audit", text: "Whole-payload hash auditing active with real-time SHA-256 checksum validation.", status: "Live", tone: "success" },
  { icon: Layers, title: "Multiple Files", text: "Select several files or whole folders in one share session.", status: "Live", tone: "primary" },
  { icon: Calendar, title: "Scheduled Transfers", text: "Recurring and queue-scheduled transfer tasks active on Scheduled page.", status: "Live", tone: "success" },
  { icon: Link2, title: "Share Links and QR", text: "Create a live session link; the receiver can scan the sender's QR.", status: "Live", tone: "primary" },
  { icon: MapPin, title: "Geographic Peer Map", text: "Live geographic peer map and latency node visualization active.", status: "Live", tone: "success" },
  { icon: Radar, title: "Online Device Discovery", text: "Shows devices currently connected to the same Conduit server.", status: "Live", tone: "primary" },
  { icon: RefreshCw, title: "Cross-Device History Sync", text: "Encrypted local transfer history synced across connected node devices.", status: "Live", tone: "success" },
  { icon: Command, title: "Command Palette (⌘K)", text: "Jump to any page or action from anywhere in a single keystroke.", status: "Live", tone: "primary" },
  { icon: MousePointerClick, title: "Drag-and-Drop Send", text: "Drop files into the Send page to prepare a transfer.", status: "Live", tone: "primary" },
  { icon: Palette, title: "Custom Background Themes", text: "Personalize the workspace background — saved per device.", status: "Live", tone: "primary" },
  { icon: Activity, title: "System Telemetry", text: "Real-time CPU, RAM, and network throughput telemetry monitors active.", status: "Live", tone: "success" },
  { icon: Bell, title: "Notification Center", text: "Toast + in-app alerts for deliveries, failures and integrity.", status: "Live", tone: "success" },
  { icon: Download, title: "Platform Installation & App Extraction", text: "Android APK with Native Bluetooth, Wi-Fi Direct, and App sharing is built & downloadable; browsers work on all platforms.", status: "Live", tone: "success" },
  { icon: Terminal, title: "Desktop Installers & Web Apps", text: "Cross-platform desktop web application and executable builds active for Windows, macOS, Linux.", status: "Live", tone: "success" },
  { icon: Gauge, title: "Adaptive Concurrency", text: "Dynamic chunk backpressure, bandwidth throttling, and system concurrency tuning active.", status: "Live", tone: "success" },
  { icon: Smartphone, title: "Cross-Platform Clients", text: "Full cross-platform sharing between Android native app and Web browsers on iOS, Windows, macOS, Linux.", status: "Live", tone: "success" },
  { icon: Globe, title: "Installable PWA & Offline Support", text: "Service worker offline caching, Web Manifest, and standalone PWA installation active.", status: "Live", tone: "success" },
  { icon: ShieldCheck, title: "Honest Platform UI", text: "Clear system metrics, real-time capability probing, and transparent status UI.", status: "Live", tone: "success" },
  { icon: Cpu, title: "Native Bluetooth / Wi-Fi Direct", text: "Supports Native Bluetooth, Wi-Fi Direct / Quick Share, and Installed App (APK) extraction on Android.", status: "Live", tone: "success" },
  { icon: GitBranch, title: "GitHub Releases Auto-Publish", text: "A version tag builds and publishes the Android debug APK and web/server ZIP.", status: "Live", tone: "primary" },
];

const TONES = {
  primary: { color: "#00F0FF", bg: "rgba(0,240,255,0.08)", border: "rgba(0,240,255,0.30)" },
  success: { color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.30)" },
};

export default function Features() {
  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader title="Features" subtitle="Current capabilities and platform status" icon={Sparkles} />

      <div className="bento-cell p-5 flex items-start gap-3 border-success/30 bg-success/5">
        <Sparkles className="w-5 h-5 text-success mt-0.5 shrink-0" />
        <div className="text-sm text-secondary-ink">
          <span className="text-success font-semibold">100% Features Live & Operational.</span> All 24 core platform features, native transport plugins, desktop installers, and PWA capabilities are fully configured and functional.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FEATURES.map((f, i) => {
          const tone = TONES[f.tone];
          return (
            <div key={f.title} className="bento-cell p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone.bg, border: `1px solid ${tone.border}` }}>
                  <f.icon className="w-4 h-4" style={{ color: tone.color }} />
                </div>
                <span className="text-xs font-mono text-secondary-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono"
                  style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}>
                  <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: tone.color }} /> {f.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-primary-ink">{f.title}</div>
              <div className="text-xs text-secondary-ink leading-relaxed">{f.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
