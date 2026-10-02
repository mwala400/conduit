import { useState } from "react";
import { PageHeader } from "@/pages/Devices";
import { formatBytes } from "@/lib/format";
import { HardDrive, Cloud, Trash2, Lock, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Cloud fallback storage settings. Cloud is NOT the default transport — it is
// an optional encrypted store-and-forward fallback when direct P2P is impossible.
export default function Storage() {
  const [enabled, setEnabled] = useState(false);
  const [retention, setRetention] = useState("24h");
  const [maxTemp, setMaxTemp] = useState("50");

  const RETENTION = [
    { value: "1h", label: "1 hour" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "until-delivered", label: "Until delivered" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Storage" subtitle="Cloud fallback and local cache management" icon={HardDrive} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bento-cell p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Cloud Fallback</span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-grid mb-4">
            <Lock className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <p className="text-xs text-secondary-ink">
              Cloud is <span className="text-primary-ink">never the default</span>. Used only when direct P2P and relay both fail.
              All temporary data is end-to-end encrypted and auto-deleted after delivery.
            </p>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={cn("w-full px-4 py-2.5 rounded-lg border text-sm font-semibold", enabled ? "bg-success/10 border-success/30 text-success" : "bg-white/5 border-grid text-secondary-ink")}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-secondary-ink" />
                <span className="text-xs font-mono text-secondary-ink uppercase tracking-wider">Retention</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RETENTION.map((r) => (
                  <button key={r.value} onClick={() => setRetention(r.value)}
                    className={cn("px-3 py-2 rounded-lg border text-sm", retention === r.value ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-grid text-secondary-ink")}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-3.5 h-3.5 text-secondary-ink" />
                <span className="text-xs font-mono text-secondary-ink uppercase tracking-wider">Max Temp Storage: {maxTemp} GB</span>
              </div>
              <input type="range" min="5" max="500" step="5" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} className="w-full accent-[#00F0FF]" />
            </div>
          </div>
        </div>

        <div className="bento-cell p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Local Cache</span>
          </div>
          <div className="space-y-3">
            <CacheRow label="Incomplete chunks" value={formatBytes(2.4 * 1024 * 1024 * 1024)} />
            <CacheRow label="Transfer metadata" value={formatBytes(8.2 * 1024 * 1024)} />
            <CacheRow label="Device keys" value={formatBytes(12 * 1024)} />
          </div>
          <div className="mt-4 pt-4 border-t border-grid">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-grid text-sm text-secondary-ink hover:text-destructive">
              <Trash2 className="w-4 h-4" /> Purge Incomplete Chunks
            </button>
          </div>
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-grid">
            <ShieldCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />
            <p className="text-xs text-secondary-ink">Chunk metadata and keys are stored locally only. No file contents are logged or persisted beyond the transfer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CacheRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-grid last:border-0">
      <span className="text-sm text-primary-ink">{label}</span>
      <span className="text-sm font-mono text-secondary-ink tabular-nums">{value}</span>
    </div>
  );
}