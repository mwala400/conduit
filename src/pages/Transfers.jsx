import { useEffect, useState, useCallback } from "react";
import { localApi } from "@/api/localData";
import { TransportBadge } from "@/components/TransportBadge";
import { PageHeader } from "@/pages/Devices";
import { formatBytes, formatSpeed, formatEta, progressPercent, STATUS_META } from "@/lib/format";
import { ListChecks, Pause, Play, X, RotateCcw, ShieldCheck, CheckCircle2, AlertTriangle, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const t = await localApi.entities.Transfer.list("-updated_date", 100);
      setTransfers(t || []);
    } catch { setTransfers([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // animate active transfer progress client-side for a live feel
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const control = async (id, status, extra = {}) => {
    await localApi.entities.Transfer.update(id, { status, ...extra });
    load();
  };

  const bulkControl = async (fromStatus, toStatus) => {
    const targets = transfers.filter((t) => t.status === fromStatus).map((t) => ({ id: t.id, status: toStatus }));
    if (targets.length === 0) return;
    await localApi.entities.Transfer.bulkUpdate(targets);
    load();
  };

  const active = transfers.filter((t) => t.status === "active" || t.status === "paused");
  const queued = transfers.filter((t) => t.status === "queued" || t.status === "waiting");
  const activeCount = transfers.filter((t) => t.status === "active").length;
  const pausedCount = transfers.filter((t) => t.status === "paused").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Transfers" subtitle="Active and queued transfers with full control" icon={ListChecks}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => bulkControl("active", "paused")} disabled={activeCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-grid text-xs text-primary-ink hover:bg-white/10 disabled:opacity-40">
              <PauseCircle className="w-3.5 h-3.5" /> Pause All
            </button>
            <button onClick={() => bulkControl("paused", "active")} disabled={pausedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-grid text-xs text-primary-ink hover:bg-white/10 disabled:opacity-40">
              <PlayCircle className="w-3.5 h-3.5" /> Resume All
            </button>
            <button onClick={() => bulkControl("active", "cancelled")} disabled={activeCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-grid text-xs text-secondary-ink hover:text-destructive disabled:opacity-40">
              <XCircle className="w-3.5 h-3.5" /> Cancel All
            </button>
          </div>
        } />

      {loading ? (
        <div className="text-sm text-secondary-ink">Loading…</div>
      ) : transfers.length === 0 ? (
        <div className="bento-cell p-10 text-center">
          <ListChecks className="w-10 h-10 text-secondary-ink mx-auto mb-3" />
          <div className="font-display font-bold text-primary-ink mb-1">No transfers</div>
          <p className="text-sm text-secondary-ink">Start a transfer from the Send page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {active.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
              >
                <TransferRow t={t} tick={tick} onControl={control} />
              </motion.div>
            ))}
          </AnimatePresence>
          {queued.length > 0 && (
            <div className="bento-cell p-4">
              <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-2">Queued</div>
              <div className="space-y-2">
                <AnimatePresence>
                  {queued.map((t, i) => (
                    <motion.div key={t.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="flex items-center gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-ink" />
                      <span className="text-primary-ink truncate flex-1">{t.name}</span>
                      <span className="text-xs font-mono text-secondary-ink">{formatBytes(t.total_size)}</span>
                      <button onClick={() => control(t.id, "active")} className="text-xs text-primary hover:underline">Start</button>
                      <button onClick={() => control(t.id, "cancelled")} className="text-xs text-secondary-ink hover:text-destructive">Cancel</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TransferRow({ t, tick, onControl }) {
  const [localPct, setLocalPct] = useState(() => progressPercent(t.transferred_size, t.total_size));
  const [localTransferred, setLocalTransferred] = useState(t.transferred_size || 0);

  useEffect(() => {
    if (t.status !== "active") return;
    setLocalTransferred((prev) => {
      const next = Math.min(t.total_size, prev + (t.speed_bps || 0));
      setLocalPct(progressPercent(next, t.total_size));
      return next;
    });
  }, [tick, t.status, t.speed_bps, t.total_size]);

  const st = STATUS_META[t.status] || STATUS_META.queued;
  const eta = t.speed_bps ? (t.total_size - localTransferred) / t.speed_bps : 0;

  return (
    <div className="bento-cell p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: st.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-primary-ink text-sm truncate">{t.name}</span>
            <span className="text-[10px] font-mono uppercase text-secondary-ink">{t.direction}</span>
          </div>
          <div className="text-xs text-secondary-ink font-mono">
            {t.peer_name} · {t.file_count || 1} files · {formatBytes(t.total_size)}
          </div>
        </div>
        <TransportBadge transport={t.transport} />
      </div>

      <div className="mb-2">
        <div className="flex items-end justify-between mb-1">
          <div className="font-mono text-sm text-primary-ink tabular-nums">
            {formatBytes(localTransferred)} <span className="text-secondary-ink">/ {formatBytes(t.total_size)}</span>
          </div>
          <div className="font-mono text-sm text-primary tabular-nums">{formatSpeed(t.speed_bps)}</div>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${localPct}%`, background: t.status === "paused" ? "#F59E0B" : "linear-gradient(90deg, #00F0FF, #10B981)" }} />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs font-mono text-secondary-ink">
          <span>{localPct.toFixed(1)}%</span>
          <span>ETA {t.status === "active" ? formatEta(eta) : "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-grid">
        {t.status === "active" ? (
          <button onClick={() => onControl(t.id, "paused")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-grid text-xs text-primary-ink hover:bg-white/10">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : (
          <button onClick={() => onControl(t.id, "active")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20">
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        )}
        <button onClick={() => onControl(t.id, "cancelled")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-grid text-xs text-secondary-ink hover:text-destructive">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        {t.status === "failed" && (
          <button onClick={() => onControl(t.id, "active")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-grid text-xs text-primary-ink hover:bg-white/10">
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs font-mono text-secondary-ink">
          {t.encrypted && <span className="flex items-center gap-1 text-success"><ShieldCheck className="w-3.5 h-3.5" /> E2E</span>}
          {t.integrity_verified && <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3.5 h-3.5" /> verified</span>}
          {!t.integrity_verified && t.status === "completed" && <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="w-3.5 h-3.5" /> unverified</span>}
        </div>
      </div>
    </div>
  );
}