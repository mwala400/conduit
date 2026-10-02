import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, MonitorSmartphone, Radar, Send, Download,
  ListChecks, History, HardDrive, ShieldCheck, Settings, Info, Cable,
  BarChart3, BookOpen, Download as DownloadIcon, Layers, Activity, CloudDownload,
  Calendar, Link as LinkIcon, MapPin, FileCheck2, Sparkles, Hammer, Gauge, KeyRound, Receipt, Layers3,
  Server, Network, LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/send", label: "Send", icon: Send },
  { to: "/receive", label: "Receive", icon: Download },
  { to: "/transfers", label: "Transfers", icon: ListChecks },
  { to: "/bulk", label: "Bulk Transfer", icon: Layers },
  { to: "/scheduled", label: "Scheduled", icon: Calendar },
  { to: "/share-link", label: "Share Links", icon: LinkIcon },
  { to: "/peer-map", label: "Peer Map", icon: MapPin },
  { to: "/network-radar", label: "Network Radar", icon: Radar },
  { to: "/audit", label: "Integrity Audit", icon: FileCheck2 },
  { to: "/build", label: "Build Center", icon: Hammer },
  { to: "/functions", label: "Functions", icon: Layers3 },
  { to: "/servers", label: "Servers (SSH)", icon: Server },
  { to: "/packets", label: "Packet Scanner", icon: Network },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/features", label: "Features", icon: Sparkles },
  { to: "/speed-test", label: "Speed Test", icon: Gauge },
  { to: "/pairing", label: "Pairing", icon: KeyRound },
  { to: "/receipts", label: "Receipts", icon: Receipt },
  { to: "/sync", label: "Sync History", icon: CloudDownload },
  { to: "/status", label: "System Status", icon: Activity },
  { to: "/devices", label: "Devices", icon: MonitorSmartphone },
  { to: "/nearby", label: "Nearby", icon: Radar },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/storage", label: "Storage", icon: HardDrive },
  { to: "/security", label: "Security", icon: ShieldCheck },
  { to: "/install", label: "Install", icon: DownloadIcon },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/guide", label: "User Guide", icon: BookOpen },
  { to: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-grid bg-surface">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-grid">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-primary">
          <Cable className="w-5 h-5 text-primary" />
        </div>
        <div className="leading-tight">
          <div className="text-carved text-gradient-mixed text-2xl tracking-tight">CONDUIT</div>
          <div className="text-[10px] font-mono text-secondary-ink uppercase tracking-widest">P2P Transfer</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-secondary-ink hover:text-primary-ink hover:bg-white/5 border border-transparent"
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-grid text-[11px] font-mono text-secondary-ink">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
          <span>core engine v0.9.0</span>
        </div>
      </div>
    </aside>
  );
}