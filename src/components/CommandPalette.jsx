import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, Command } from "lucide-react";
import { cn } from "@/lib/utils";

// Command palette — Cmd/Ctrl+K anywhere in the app to jump to a page or run
// a quick action. Flagship "legendary" pro feature for power users.
const COMMANDS = [
  { id: "home", label: "Go to Dashboard", path: "/", group: "Navigate" },
  { id: "send", label: "Send Files", path: "/send", group: "Navigate" },
  { id: "receive", label: "Receive", path: "/receive", group: "Navigate" },
  { id: "bulk", label: "Bulk Transfer", path: "/bulk", group: "Navigate" },
  { id: "scheduled", label: "Scheduled Transfers", path: "/scheduled", group: "Navigate" },
  { id: "share-link", label: "Share Links", path: "/share-link", group: "Navigate" },
  { id: "peer-map", label: "Peer Map", path: "/peer-map", group: "Navigate" },
  { id: "network-radar", label: "Network Radar", path: "/network-radar", group: "Navigate" },
  { id: "audit", label: "Integrity Audit", path: "/audit", group: "Navigate" },
  { id: "features", label: "Features (24)", path: "/features", group: "Navigate" },
  { id: "functions", label: "Functions (24)", path: "/functions", group: "Navigate" },
  { id: "servers", label: "Servers (SSH)", path: "/servers", group: "Navigate" },
  { id: "packets", label: "Packet Scanner", path: "/packets", group: "Navigate" },
  { id: "templates", label: "Transfer Templates", path: "/templates", group: "Navigate" },
  { id: "build", label: "Build Center", path: "/build", group: "Navigate" },
  { id: "speed-test", label: "Speed Test", path: "/speed-test", group: "Navigate" },
  { id: "pairing", label: "Pairing", path: "/pairing", group: "Navigate" },
  { id: "receipts", label: "Receipts", path: "/receipts", group: "Navigate" },
  { id: "transfers", label: "Transfers", path: "/transfers", group: "Navigate" },
  { id: "devices", label: "Devices", path: "/devices", group: "Navigate" },
  { id: "nearby", label: "Nearby Discovery", path: "/nearby", group: "Navigate" },
  { id: "reports", label: "Reports", path: "/reports", group: "Navigate" },
  { id: "history", label: "History", path: "/history", group: "Navigate" },
  { id: "sync", label: "Sync History", path: "/sync", group: "Navigate" },
  { id: "status", label: "System Status", path: "/status", group: "Navigate" },
  { id: "storage", label: "Storage", path: "/storage", group: "Navigate" },
  { id: "security", label: "Security", path: "/security", group: "Navigate" },
  { id: "install", label: "Install", path: "/install", group: "Navigate" },
  { id: "settings", label: "Settings", path: "/settings", group: "Navigate" },
  { id: "guide", label: "User Guide", path: "/guide", group: "Navigate" },
  { id: "about", label: "About", path: "/about", group: "Navigate" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q) || c.path.includes(q));
  }, [query]);

  useEffect(() => { setActive(0); }, [query]);

  const run = (cmd) => {
    setOpen(false);
    setQuery("");
    navigate(cmd.path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bento-cell p-0 overflow-hidden glow-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-grid">
          <Search className="w-4 h-4 text-primary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Enter" && filtered[active]) { e.preventDefault(); run(filtered[active]); }
            }}
            placeholder="Search pages or actions…"
            className="flex-1 bg-transparent outline-none text-sm text-primary-ink placeholder:text-secondary-ink"
          />
          <kbd className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-grid text-[10px] font-mono text-secondary-ink">
            <Command className="w-3 h-3" /> K
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-secondary-ink py-6 text-center">No matches.</div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                  i === active ? "bg-primary/10 text-primary" : "text-primary-ink hover:bg-white/5")}
              >
                <span className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider w-16">{c.group}</span>
                <span className="flex-1">{c.label}</span>
                {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-secondary-ink" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}