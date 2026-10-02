import { useEffect, useState, useCallback } from "react";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { formatBytes, timeAgo } from "@/lib/format";
import { RefreshCw, CloudDownload, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Sync Transfer History — re-pulls the latest transfers + devices from the
// platform, records a sync log, and surfaces what changed since last sync.
export default function Sync() {
  const [transfers, setTransfers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [log, setLog] = useState([]);

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        localApi.entities.Transfer.list("-updated_date", 200),
        localApi.entities.Device.list("-updated_date", 50),
      ]);
      setTransfers(t || []);
      setDevices(d || []);
    } catch {
      setTransfers([]);
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("conduit.last_sync");
    if (saved) setLastSync(new Date(saved));
    const savedLog = localStorage.getItem("conduit.sync_log");
    if (savedLog) { try { setLog(JSON.parse(savedLog)); } catch {} }
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    const beforeCount = transfers.length;
    const beforeDevice = devices.length;
    const started = new Date();
    await load();
    // after load the state hasn't updated synchronously in this tick for the
    // *new* counts, so re-read fresh
    let afterTransfers = transfers.length;
    let afterDevices = devices.length;
    try {
      const [t2, d2] = await Promise.all([
        localApi.entities.Transfer.list("-updated_date", 200),
        localApi.entities.Device.list("-updated_date", 50),
      ]);
      afterTransfers = (t2 || []).length;
      afterDevices = (d2 || []).length;
      setTransfers(t2 || []);
      setDevices(d2 || []);
    } catch {}
    const entry = {
      at: started.toISOString(),
      transfers: afterTransfers,
      devices: afterDevices,
      newTransfers: Math.max(0, afterTransfers - beforeCount),
      newDevices: Math.max(0, afterDevices - beforeDevice),
    };
    const nextLog = [entry, ...log].slice(0, 12);
    setLog(nextLog);
    setLastSync(started);
    localStorage.setItem("conduit.last_sync", started.toISOString());
    localStorage.setItem("conduit.sync_log", JSON.stringify(nextLog));
    setSyncing(false);
  };

  const totalSent = transfers.filter((t) => t.direction === "send").reduce((s, t) => s + (t.total_size || 0), 0);
  const totalReceived = transfers.filter((t) => t.direction === "receive").reduce((s, t) => s + (t.total_size || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Sync History" subtitle="Pull the latest transfer and device records from the platform" icon={CloudDownload}
        action={
          <button onClick={sync} disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40">
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} /> {syncing ? "Syncing…" : "Sync Now"}
          </button>
        } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Transfers Synced" value={String(transfers.length)} icon={ArrowDownToLine} />
        <StatCard label="Devices Synced" value={String(devices.length)} icon={ArrowUpFromLine} />
        <StatCard label="Data Sent" value={formatBytes(totalSent)} icon={ArrowUpFromLine} />
        <StatCard label="Data Received" value={formatBytes(totalReceived)} icon={ArrowDownToLine} />
      </div>

      <div className="bento-cell p-4 flex items-center gap-3">
        <Clock className="w-4 h-4 text-secondary-ink" />
        <span className="text-sm text-secondary-ink">Last sync:</span>
        <span className="text-sm text-primary-ink font-mono">{lastSync ? timeAgo(lastSync) : "never"}</span>
        {lastSync && <span className="ml-auto text-xs font-mono text-secondary-ink">{lastSync.toLocaleString()}</span>}
      </div>

      <div className="bento-cell p-5">
        <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-3">Sync Log</div>
        {log.length === 0 ? (
          <div className="text-sm text-secondary-ink py-6 text-center">No syncs yet. Press “Sync Now” to record one.</div>
        ) : (
          <div className="divide-y divide-border">
            {log.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-primary-ink">{e.transfers} transfers · {e.devices} devices</div>
                  <div className="text-xs font-mono text-secondary-ink">{new Date(e.at).toLocaleString()} · +{e.newTransfers} transfers · +{e.newDevices} devices</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bento-cell p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-secondary-ink" />
        <span className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-display text-xl font-bold text-primary-ink tabular-nums">{value}</div>
    </div>
  );
}