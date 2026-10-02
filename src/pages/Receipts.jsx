import { useEffect, useState, useCallback } from "react";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { TransportBadge } from "@/components/TransportBadge";
import { formatBytes, timeAgo } from "@/lib/format";
import { Receipt, FileDown, CheckCircle2, ShieldCheck, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// Transfer Receipts — export completed transfers as a downloadable CSV receipt.
export default function Receipts() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | send | receive
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await localApi.entities.Transfer.list("-updated_date", 200);
      setTransfers((t || []).filter((x) => x.status === "completed"));
    } catch { setTransfers([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = transfers.filter((t) => filter === "all" || t.direction === filter);

  const exportCsv = () => {
    const header = ["name", "direction", "status", "transport", "total_bytes", "transferred_bytes", "peer", "encrypted", "integrity_verified", "started_at", "completed_at"];
    const lines = [header.join(",")];
    rows.forEach((t) => {
      lines.push([
        q(t.name), t.direction, t.status, t.transport, t.total_size || 0, t.transferred_size || 0,
        q(t.peer_name || ""), t.encrypted ? "yes" : "no", t.integrity_verified ? "yes" : "no",
        t.started_at || "", t.completed_at || "",
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    download(`conduit-receipts-${Date.now()}.csv`, blob);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Receipts" subtitle="Export completed transfers as a CSV receipt" icon={Receipt}
        action={
          <button onClick={exportCsv} disabled={rows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40">
            <FileDown className="w-4 h-4" /> {done ? "Downloaded" : "Export CSV"}
          </button>
        } />

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-secondary-ink" />
        {["all", "send", "receive"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors",
              filter === f ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink hover:bg-white/10")}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-secondary-ink">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bento-cell p-10 text-center">
          <Receipt className="w-10 h-10 text-secondary-ink mx-auto mb-3" />
          <div className="font-display font-bold text-primary-ink mb-1">No completed transfers</div>
          <p className="text-sm text-secondary-ink">Finish a transfer and its receipt will appear here.</p>
        </div>
      ) : (
        <div className="bento-cell p-0 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-mono text-secondary-ink uppercase tracking-wider border-b border-grid">
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Dir</th>
                  <th className="px-4 py-3">Peer</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Transport</th>
                  <th className="px-4 py-3">Integrity</th>
                  <th className="px-4 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-primary-ink truncate max-w-[200px]">{t.name}</td>
                    <td className="px-4 py-3 text-secondary-ink font-mono text-xs">{t.direction}</td>
                    <td className="px-4 py-3 text-secondary-ink truncate max-w-[140px]">{t.peer_name || "—"}</td>
                    <td className="px-4 py-3 text-primary-ink font-mono">{formatBytes(t.total_size)}</td>
                    <td className="px-4 py-3"><TransportBadge transport={t.transport} /></td>
                    <td className="px-4 py-3">
                      {t.integrity_verified
                        ? <span className="inline-flex items-center gap-1 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> verified</span>
                        : <span className="text-xs text-secondary-ink">—</span>}
                    </td>
                    <td className="px-4 py-3 text-secondary-ink font-mono text-xs">{timeAgo(t.completed_at || t.updated_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bento-cell p-4 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <p className="text-xs text-secondary-ink">Each receipt row includes the integrity flag and timestamps so you can audit what was delivered, to whom, and when.</p>
      </div>
    </div>
  );
}

function q(s) { return `"${String(s).replace(/"/g, '""')}"`; }
function download(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}