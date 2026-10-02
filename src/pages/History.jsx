import { useEffect, useState, useCallback } from "react";
import { localApi } from "@/api/localData";
import { TransportBadge } from "@/components/TransportBadge";
import { PageHeader } from "@/pages/Devices";
import { formatBytes, formatSpeed, timeAgo, STATUS_META } from "@/lib/format";
import { History as HistoryIcon, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "completed", "failed", "cancelled", "paused", "waiting"];

export default function History() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const t = await localApi.entities.Transfer.list("-updated_date", 200);
      setTransfers(t || []);
    } catch { setTransfers([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? transfers : transfers.filter((t) => t.status === filter);

  const clearHistory = async () => {
    // only clear terminal-state transfers
    const terminal = transfers.filter((t) => ["completed", "failed", "cancelled"].includes(t.status));
    for (const t of terminal) {
      await localApi.entities.Transfer.delete(t.id);
    }
    load();
  };

  const totalSent = transfers.filter((t) => t.direction === "send" && t.status === "completed").reduce((s, t) => s + (t.total_size || 0), 0);
  const totalReceived = transfers.filter((t) => t.direction === "receive" && t.status === "completed").reduce((s, t) => s + (t.total_size || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="History" subtitle="Local transfer log — contents are never stored" icon={HistoryIcon}
        action={<button onClick={clearHistory} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-grid text-sm text-secondary-ink hover:text-destructive"><Trash2 className="w-4 h-4" /> Clear History</button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Sent" value={formatBytes(totalSent)} />
        <StatCard label="Total Received" value={formatBytes(totalReceived)} />
        <StatCard label="Transfers" value={String(transfers.length)} />
        <StatCard label="Completed" value={String(transfers.filter((t) => t.status === "completed").length)} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-secondary-ink" />
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-mono border", filter === f ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink")}>
            {f}
          </button>
        ))}
      </div>

      <div className="bento-cell p-4">
        {loading ? (
          <div className="text-sm text-secondary-ink">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-secondary-ink py-8 text-center">No transfer history yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const st = STATUS_META[t.status] || STATUS_META.queued;
              return (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-primary-ink truncate">{t.name}</div>
                    <div className="text-xs font-mono text-secondary-ink">
                      {t.direction} · {t.peer_name || "—"} · {formatBytes(t.total_size)} · {timeAgo(t.completed_at || t.updated_date)}
                    </div>
                  </div>
                  <TransportBadge transport={t.transport} />
                  <span className="text-xs font-mono text-secondary-ink hidden sm:inline">{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bento-cell p-4">
      <div className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">{label}</div>
      <div className="font-display text-xl font-bold text-primary-ink tabular-nums mt-1">{value}</div>
    </div>
  );
}