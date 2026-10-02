import { Link } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import {
  Hammer, Gauge, KeyRound, Receipt, Trash2, Eye, Save, Moon,
  Languages, Rocket, HeartPulse, FileText, Keyboard, ListTree, BadgeCheck,
  Layers3, Wifi, Cloud, Bug, ShieldOff, UserX, Link as LinkIcon, RefreshCw, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 24 NEW functionalities beyond the original Features page, each with a
// specific task. "Live" links to a working page; "Roadmap" is planned.
const FUNCS = [
  { icon: Hammer, title: "Build Center", task: "Compile, sign & publish every installer to GitHub Releases", status: "Live", to: "/build" },
  { icon: Gauge, title: "Speed Test", task: "Probe throughput, ping & upload to a paired peer", status: "Live", to: "/speed-test" },
  { icon: KeyRound, title: "Pairing Codes", task: "Generate QR + 6-digit PIN to pair a new device", status: "Live", to: "/pairing" },
  { icon: Receipt, title: "Transfer Receipts", task: "Export completed transfers as an auditable CSV", status: "Live", to: "/receipts" },
  { icon: Trash2, title: "Self-Destruct Shares", task: "Share links that expire after N opens or a deadline", status: "Roadmap", to: null },
  { icon: Eye, title: "In-App File Preview", task: "Preview images, PDFs & text before accepting a transfer", status: "Roadmap", to: null },
  { icon: Save, title: "Resume Checkpoints", task: "Resume an interrupted transfer from the last verified chunk", status: "Roadmap", to: null },
  { icon: Cpu, title: "Bandwidth Caps", task: "Throttle transfers to a max Mbps per device or schedule", status: "Roadmap", to: null },
  { icon: Moon, title: "Auto Day/Night Theme", task: "Follow system dark/light preference automatically", status: "Roadmap", to: null },
  { icon: Languages, title: "Multi-Language UI", task: "Switch the interface between Swahili, English & more", status: "Roadmap", to: null },
  { icon: Rocket, title: "Onboarding Wizard", task: "3-step guided setup for first-time non-technical users", status: "Roadmap", to: null },
  { icon: HeartPulse, title: "Device Health Score", task: "Rate each peer's signal, battery & reliability live", status: "Roadmap", to: null },
  { icon: FileText, title: "PDF Receipts", task: "Generate a branded PDF receipt per completed transfer", status: "Roadmap", to: null },
  { icon: Keyboard, title: "Keyboard Shortcuts", task: "Full keyboard control of transfers, nav & actions", status: "Roadmap", to: null },
  { icon: ListTree, title: "Activity Timeline", task: "Unified chronological feed of every transfer event", status: "Roadmap", to: null },
  { icon: BadgeCheck, title: "Peer Trust Levels", task: "Assign trust tiers that gate auto-accept per peer", status: "Roadmap", to: null },
  { icon: Layers3, title: "Compression Presets", task: "Per-file-type compression profiles (fast / max / off)", status: "Roadmap", to: null },
  { icon: Wifi, title: "Native Bluetooth & Wi-Fi Direct", task: "Share installed apps (APKs) & files over Native Bluetooth and Wi-Fi Direct", status: "Live", to: "/send" },
  { icon: Cloud, title: "Relay Auto-Fallback", task: "Switch to encrypted relay when direct P2P is blocked", status: "Roadmap", to: null },
  { icon: Bug, title: "Crash Report Upload", task: "Send anonymized crash logs to improve the build", status: "Roadmap", to: null },
  { icon: ShieldOff, title: "Telemetry Opt-Out", task: "One toggle to disable all non-essential telemetry", status: "Roadmap", to: null },
  { icon: UserX, title: "Guest Mode", task: "Use Conduit once without creating an account", status: "Roadmap", to: null },
  { icon: LinkIcon, title: "Deep-Link Share", task: "Open a specific transfer straight from a URL", status: "Roadmap", to: null },
  { icon: RefreshCw, title: "Auto-Update Channel", task: "Background update to the latest signed release", status: "Roadmap", to: null },
];

export default function Functions() {
  const live = FUNCS.filter((f) => f.status === "Live");
  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader title="Functions" subtitle="24 more capabilities — each with a specific task" icon={Layers3} />

      <div className="bento-cell p-4 flex items-center gap-3 border-primary/20">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
        <p className="text-sm text-secondary-ink">
          <span className="text-primary-ink font-semibold">{live.length} live</span> today, the rest on the roadmap.
          Every live function opens a working page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FUNCS.map((f, i) => {
          const isLive = f.status === "Live";
          const content = (
            <div className={cn("bento-cell p-4 flex flex-col gap-2 h-full transition-colors",
              isLive ? "hover:border-primary/30" : "opacity-80")}>
              <div className="flex items-center gap-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isLive ? "bg-primary/10 border border-primary/30" : "bg-white/5 border border-grid")}>
                  <f.icon className={cn("w-4 h-4", isLive ? "text-primary" : "text-secondary-ink")} />
                </div>
                <span className="text-xs font-mono text-secondary-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono",
                  isLive ? "text-success bg-success/10 border border-success/30" : "text-secondary-ink bg-white/5 border border-grid")}>
                  {f.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-primary-ink">{f.title}</div>
              <div className="text-xs text-secondary-ink leading-relaxed flex-1">{f.task}</div>
              {isLive && <span className="text-xs text-primary hover:underline mt-1">Open →</span>}
            </div>
          );
          return isLive ? (
            <Link key={f.title} to={f.to} className="block h-full">{content}</Link>
          ) : (
            <div key={f.title} className="h-full">{content}</div>
          );
        })}
      </div>
    </div>
  );
}