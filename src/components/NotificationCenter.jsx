import { useEffect, useState, useRef } from "react";
import { localApi } from "@/api/localData";
import { Bell, X, CheckCircle2, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

// Automated transfer alerting — subscribes to live Transfer entity events and
// surfaces receiver/delivery alerts as both toast popups and a bell dropdown.
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("conduit.alerts") || "[]"); } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);
  const seenRef = useRef(new Set());

  const persist = (next) => {
    setAlerts(next);
    localStorage.setItem("conduit.alerts", JSON.stringify(next.slice(0, 50)));
  };

  const pushToast = (alert) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { ...alert, _tid: id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x._tid !== id)), 5000);
  };

  useEffect(() => {
    // load existing transfers so we don't alert on history
    (async () => {
      try {
        const existing = await localApi.entities.Transfer.list("-updated_date", 50);
        (existing || []).forEach((t) => seenRef.current.add(t.id));
      } catch {}
    })();

    const unsubscribe = localApi.entities.Transfer.subscribe((event) => {
      const t = event.data || {};
      const id = t.id;
      if (!id) return;
      let alert = null;
      if (event.type === "create" && !seenRef.current.has(id)) {
        seenRef.current.add(id);
        alert = {
          id, kind: t.direction === "receive" ? "incoming" : "started",
          title: t.direction === "receive" ? "Incoming Transfer" : "Transfer Started",
          message: `${t.name || "Payload"} · ${t.peer_name || "—"}`,
          tone: t.direction === "receive" ? "receive" : "send",
          at: new Date().toISOString(),
        };
      } else if (event.type === "update") {
        const status = t.status;
        if (status === "completed") {
          alert = { id, kind: "delivered", title: "Delivery Confirmed", message: `${t.name || "Payload"} reached ${t.peer_name || "peer"}`, tone: "success", at: new Date().toISOString() };
        } else if (status === "failed") {
          alert = { id, kind: "failed", title: "Transfer Failed", message: `${t.name || "Payload"} could not complete`, tone: "error", at: new Date().toISOString() };
        } else if (status === "paused") {
          alert = { id, kind: "paused", title: "Transfer Paused", message: t.name || "Payload", tone: "warn", at: new Date().toISOString() };
        }
      }
      if (alert) {
        persist((prev) => [alert, ...prev].slice(0, 50));
        pushToast(alert);
      }
    });
    return unsubscribe;
  }, []);

  const unread = alerts.length;
  const clearAll = () => persist([]);

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="relative w-9 h-9 rounded-lg bg-white/5 border border-grid flex items-center justify-center hover:bg-white/10 transition">
          <Bell className="w-4 h-4 text-primary-ink" />
          {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-ink text-[10px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
        </button>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-11 w-80 sm:w-96 bento-cell p-0 overflow-hidden z-50">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-grid">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-carved text-primary-ink text-xl">Alerts</span>
                <span className="ml-auto font-mono text-xs text-secondary-ink">{alerts.length} total</span>
                {alerts.length > 0 && <button onClick={clearAll} className="text-secondary-ink hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {alerts.length === 0 ? (
                  <div className="text-sm text-secondary-ink py-8 text-center">No alerts yet. Transfer events will appear here.</div>
                ) : (
                  alerts.map((a, i) => <AlertRow key={a.id + i} alert={a} />)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((a) => (
            <motion.div key={a._tid}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={cn("bento-cell p-3 flex items-start gap-3 pointer-events-auto", toneRing(a.tone))}>
              <ToneIcon tone={a.tone} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-primary-ink">{a.title}</div>
                <div className="text-xs text-secondary-ink truncate">{a.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function AlertRow({ alert }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b border-grid last:border-0">
      <ToneIcon tone={alert.tone} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-primary-ink">{alert.title}</div>
        <div className="text-xs text-secondary-ink truncate">{alert.message}</div>
      </div>
      <span className="text-[10px] font-mono text-secondary-ink shrink-0">{timeAgo(alert.at)}</span>
    </div>
  );
}

function ToneIcon({ tone }) {
  if (tone === "success") return <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />;
  if (tone === "error") return <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />;
  if (tone === "warn") return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
  if (tone === "receive") return <ArrowDownToLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
  return <ArrowUpFromLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
}

function toneRing(tone) {
  if (tone === "success") return "border-success/40";
  if (tone === "error") return "border-destructive/40";
  if (tone === "warn") return "border-amber-500/40";
  return "border-primary/40";
}