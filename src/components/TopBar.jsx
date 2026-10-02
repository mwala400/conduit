import { useEffect, useState } from "react";
import { useLocalNode } from "@/hooks/useLocalNode";
import { useBackgroundTheme } from "@/hooks/useBackgroundTheme";
import { Cable, Wifi } from "lucide-react";
import { BackgroundPicker } from "@/components/BackgroundPicker";
import { NotificationCenter } from "@/components/NotificationCenter";

export function TopBar() {
  const node = useLocalNode();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Apply persisted background theme on mount (so color loads before first paint of authed app)
  useBackgroundTheme();

  return (
    <header className="h-16 shrink-0 border-b border-grid bg-surface/80 backdrop-blur flex items-center gap-3 px-4 lg:px-6">
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Cable className="w-4 h-4 text-primary" />
        </div>
        <span className="font-display font-bold text-primary-ink text-sm">CONDUIT</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-grid">
        <Wifi className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs text-primary-ink">{node?.name || "initializing…"}.local</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationCenter />
        <BackgroundPicker />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-grid">
          <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-success animate-pulse-dot" : "bg-destructive"}`} />
          <span className="font-mono text-xs text-secondary-ink">{online ? "Signal Active" : "Offline"}</span>
        </div>
      </div>
    </header>
  );
}