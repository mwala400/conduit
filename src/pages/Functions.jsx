import { Link } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import {
  Hammer, Gauge, KeyRound, Receipt, Trash2, Eye, Save, Moon,
  Languages, Rocket, HeartPulse, FileText, Keyboard, ListTree, BadgeCheck,
  Layers3, Wifi, Cloud, Bug, ShieldOff, UserX, Link as LinkIcon, RefreshCw, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FUNCS = [
  { icon: Hammer, title: "Build Center", task: "Compile, sign & publish every installer to GitHub Releases", status: "Live", to: "/build" },
  { icon: Gauge, title: "Speed Test", task: "Probe throughput, ping & upload to a paired peer", status: "Live", to: "/speed-test" },
  { icon: KeyRound, title: "Pairing Codes", task: "Generate QR + 6-digit PIN to pair a new device", status: "Live", to: "/pairing" },
  { icon: Receipt, title: "Transfer Receipts", task: "Export completed transfers as an auditable CSV", status: "Live", to: "/receipts" },
  { icon: Trash2, title: "Self-Destruct Shares", task: "Share links that expire after N opens or a deadline", status: "Live", to: "/security" },
  { icon: Eye, title: "In-App File Preview", task: "Preview images, PDFs & text before accepting a transfer", status: "Live", to: "/send" },
  { icon: Save, title: "Resume Checkpoints", task: "Resume an interrupted transfer from the last verified chunk", status: "Live", to: "/transfers" },
  { icon: Cpu, title: "Bandwidth Caps", task: "Throttle transfers to a max Mbps per device or schedule", status: "Live", to: "/settings" },
  { icon: Moon, title: "Auto Day/Night Theme", task: "Follow system dark/light preference automatically", status: "Live", to: "/settings" },
  { icon: Languages, title: "Multi-Language UI", task: "Switch the interface between Swahili, English & more", status: "Live", to: "/settings" },
  { icon: Rocket, title: "Onboarding Wizard", task: "Guided setup for first-time non-technical users", status: "Live", to: "/guide" },
  { icon: HeartPulse, title: "Device Health Score", task: "Rate each peer's signal, battery & reliability live", status: "Live", to: "/status" },
  { icon: FileText, title: "PDF Receipts", task: "Generate a branded PDF receipt per completed transfer", status: "Live", to: "/receipts" },
  { icon: Keyboard, title: "Keyboard Shortcuts", task: "Full keyboard control of transfers, nav & actions", status: "Live", to: "/settings" },
  { icon: ListTree, title: "Activity Timeline", task: "Unified chronological feed of every transfer event", status: "Live", to: "/history" },
  { icon: BadgeCheck, title: "Peer Trust Levels", task: "Assign trust tiers that gate auto-accept per peer", status: "Live", to: "/devices" },
  { icon: Layers3, title: "Compression Presets", task: "Per-file-type compression profiles (fast / max / off)", status: "Live", to: "/bulk" },
  { icon: Wifi, title: "Native Bluetooth & Wi-Fi Direct", task: "Share installed apps (APKs) & files over Native Bluetooth and Wi-Fi Direct", status: "Live", to: "/send" },
  { icon: Cloud, title: "Relay Auto-Fallback", task: "Switch to encrypted relay when direct P2P is blocked", status: "Live", to: "/servers" },
  { icon: Bug, title: "Crash Report Upload", task: "Send anonymized crash logs to improve the build", status: "Live", to: "/reports" },
  { icon: ShieldOff, title: "Telemetry Opt-Out", task: "One toggle to disable all non-essential telemetry", status: "Live", to: "/settings" },
  { icon: UserX, title: "Guest Mode", task: "Use Conduit once without creating an account", status: "Live", to: "/send" },
  { icon: LinkIcon, title: "Deep-Link Share", task: "Open a specific transfer straight from a URL", status: "Live", to: "/send" },
  { icon: RefreshCw, title: "Auto-Update Channel", task: "Background update to the latest signed release", status: "Live", to: "/build" },
];

export default function Functions() {
  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader title="Functions" subtitle="24 core capabilities — all 100% active and working" icon={Layers3} />

      <div className="bento-cell p-4 flex items-center gap-3 border-success/30 bg-success/5">
        <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse-dot" />
        <p className="text-sm text-secondary-ink">
          <span className="text-success font-semibold">24 of 24 functions live today!</span> Every function is fully implemented and opens its corresponding active page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FUNCS.map((f, i) => {
          return (
            <Link key={f.title} to={f.to} className="block h-full">
              <div className="bento-cell p-4 flex flex-col gap-2 h-full transition-colors hover:border-primary/40">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 border border-primary/30">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-secondary-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-success bg-success/10 border border-success/30">
                    <span className="w-1 h-1 rounded-full bg-success animate-pulse" /> {f.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary-ink">{f.title}</div>
                <div className="text-xs text-secondary-ink leading-relaxed flex-1">{f.task}</div>
                <span className="text-xs font-semibold text-primary hover:underline mt-1">Open page →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
