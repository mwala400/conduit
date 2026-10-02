import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, MonitorSmartphone, Send, Download, ListChecks, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  History, HardDrive, ShieldCheck, Settings, Radar,
  BarChart3, BookOpen, Download as DownloadIcon, Layers, Activity, CloudDownload,
  Calendar, Link as LinkIcon, MapPin, FileCheck2, Sparkles, Hammer, Gauge, KeyRound, Receipt, Layers3,
  Server, Network, LayoutTemplate,
} from "lucide-react";

const PRIMARY = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/send", label: "Send", icon: Send },
  { to: "/transfers", label: "Transfers", icon: ListChecks },
  { to: "/bulk", label: "Bulk", icon: Layers },
];

const MORE = [
  { to: "/devices", label: "Devices", icon: MonitorSmartphone },
  { to: "/nearby", label: "Nearby", icon: Radar },
  { to: "/scheduled", label: "Scheduled", icon: Calendar },
  { to: "/share-link", label: "Share Links", icon: LinkIcon },
  { to: "/peer-map", label: "Peer Map", icon: MapPin },
  { to: "/network-radar", label: "Radar", icon: Radar },
  { to: "/audit", label: "Audit", icon: FileCheck2 },
  { to: "/build", label: "Build", icon: Hammer },
  { to: "/functions", label: "Functions", icon: Layers3 },
  { to: "/servers", label: "SSH", icon: Server },
  { to: "/packets", label: "Packets", icon: Network },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/features", label: "Features", icon: Sparkles },
  { to: "/speed-test", label: "Speed", icon: Gauge },
  { to: "/pairing", label: "Pairing", icon: KeyRound },
  { to: "/receipts", label: "Receipts", icon: Receipt },
  { to: "/sync", label: "Sync", icon: CloudDownload },
  { to: "/status", label: "Status", icon: Activity },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
  { to: "/receive", label: "Receive", icon: Download },
  { to: "/storage", label: "Storage", icon: HardDrive },
  { to: "/security", label: "Security", icon: ShieldCheck },
  { to: "/install", label: "Install", icon: DownloadIcon },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/guide", label: "Guide", icon: BookOpen },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-grid flex items-stretch h-16 px-1">
        {PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
                isActive ? "text-primary" : "text-secondary-ink"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-secondary-ink"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-16 inset-x-0 bg-surface border-t border-grid rounded-t-2xl p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-primary-ink">More</span>
              <button onClick={() => setMoreOpen(false)} className="text-secondary-ink text-sm">Close</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border",
                      isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink"
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}