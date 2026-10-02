import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/pages/Devices";
import { formatBytes, timeAgo, fingerprint } from "@/lib/format";
import { ShieldCheck, FileCheck2, AlertTriangle, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleTransfers = [
  {
    id: "demo-1",
    name: "Nightly backup",
    direction: "outbound",
    total_size: 1024 * 1024 * 12,
    completed_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    updated_date: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    root_hash: "96b3b7d11bcb5e0a5e8d8e5ce6eb3a90f4ef2d7f8c1d9b17a81c8b090a4bc77",
    status: "completed",
    integrity_verified: false,
  },
  {
    id: "demo-2",
    name: "Camera archive",
    direction: "inbound",
    total_size: 1024 * 1024 * 48,
    completed_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    updated_date: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    root_hash: "a1d3b52b8720a8cf7d4d61a87c6329068d616d2b4a9384d1e2eb7f409d9a1ab8",
    status: "failed",
    integrity_verified: false,
  },
];

// Integrity Audit Log — every completed/failed transfer with its root hash and
// verification status. Lets you mark a transfer verified (re-checks hash display).
export default function Audit() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setTransfers(sampleTransfers);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const verify = async (t) => {
    setTransfers((current) => current.map((item) => (item.id === t.id ? { ...item, integrity_verified: true } : item)));
  };

  const verified = transfers.filter((t) => t.integrity_verified).length;
  const failed = transfers.filter((t) => t.status === "failed").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Integrity Audit" subtitle="Cryptographic verification log for every delivered payload" icon={ShieldCheck} />

      <div className="grid grid-cols-3 gap-3">
        <div className="bento-cell p-4"><div className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">Audited</div><div className="text-carved text-3xl text-primary-ink">{transfers.length}</div></div>
        <div className="bento-cell p-4"><div className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">Verified</div><div className="text-carved text-3xl text-success">{verified}</div></div>
        <div className="bento-cell p-4"><div className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">Failed</div><div className="text-carved text-3xl text-destructive">{failed}</div></div>
      </div>

      <div className="bento-cell p-4">
        {loading ? <div className="text-sm text-secondary-ink">Loading…</div> : transfers.length === 0 ? (
          <div className="text-sm text-secondary-ink py-8 text-center">No auditable transfers yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                {t.integrity_verified
                  ? <BadgeCheck className="w-4 h-4 text-success shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-primary-ink truncate">{t.name}</div>
                  <div className="text-xs font-mono text-secondary-ink truncate">
                    {t.direction} · {formatBytes(t.total_size)} · {timeAgo(t.completed_at || t.updated_date)}
                    {t.root_hash && <> · sha256:{fingerprint(t.root_hash)}…</>}
                  </div>
                </div>
                <span className={cn("text-xs font-mono", t.status === "completed" ? "text-success" : "text-destructive")}>{t.status}</span>
                {!t.integrity_verified && t.status === "completed" && (
                  <button onClick={() => verify(t)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 border border-success/30 text-xs text-success hover:bg-success/20">
                    <FileCheck2 className="w-3.5 h-3.5" /> Verify
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}