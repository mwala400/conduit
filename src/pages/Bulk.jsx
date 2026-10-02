import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { localApi } from "@/api/localData";
import { TransportBadge } from "@/components/TransportBadge";
import { PageHeader } from "@/pages/Devices";
import { formatBytes, sha256Hex } from "@/lib/format";
import { Layers, Upload, File as FileIcon, X, Send as SendIcon, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Bulk transfer: broadcast the same file set to MANY peers in one action.
// Creates one Transfer record per selected peer (parallel fan-out).
export default function Bulk() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedPeers, setSelectedPeers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await localApi.entities.Device.list("-updated_date", 50);
      setDevices((d || []).filter((x) => x.status !== "blocked"));
    } catch { setDevices([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalSize = useMemo(() => selectedFiles.reduce((s, f) => s + (f.size || 0), 0), [selectedFiles]);
  const allPeers = devices.length ? devices : SAMPLE_PEERS_FALLBACK;

  const onPickFiles = (fileList) => {
    const files = Array.from(fileList || []).map((f) => ({ name: f.name, size: f.size, type: f.type || "binary" }));
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const togglePeer = (id) => {
    setSelectedPeers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const startBulk = async () => {
    if (selectedPeers.length === 0 || selectedFiles.length === 0) return;
    setCreating(true);
    try {
      const rootHash = await sha256Hex(selectedFiles.map((f) => `${f.name}:${f.size}`).join("|"));
      const payloadName = selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files`;
      const chunkCount = Math.max(8, Math.min(256, Math.ceil(totalSize / (4 * 1024 * 1024)) || 8));
      const records = selectedPeers.map((pid) => {
        const peer = allPeers.find((d) => (d.id || d.node_id) === pid) || {};
        return {
          name: payloadName,
          direction: "send",
          status: "active",
          total_size: totalSize,
          transferred_size: 0,
          transport: peer.transport || "lan",
          peer_name: peer.name,
          peer_node_id: peer.node_id,
          speed_bps: (peer.bandwidth_mbps || 100) * 125000,
          encrypted: true,
          chunk_count: chunkCount,
          chunks_completed: 0,
          file_count: selectedFiles.length,
          destination: "Downloads/Shared",
          started_at: new Date().toISOString(),
          eta_seconds: totalSize / ((peer.bandwidth_mbps || 100) * 125000),
          compression: "auto",
          priority: "balanced",
          integrity_verified: false,
          root_hash: rootHash,
        };
      });
      await localApi.entities.Transfer.bulkCreate(records);
      navigate("/transfers");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Bulk Transfer" subtitle="Broadcast the same payload to many peers at once" icon={Layers}
        action={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-grid text-xs font-mono text-secondary-ink">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {selectedPeers.length} peers · {selectedFiles.length} files
          </span>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onPickFiles(e.dataTransfer.files); }}
            className={cn("bento-cell p-8 flex flex-col items-center justify-center text-center min-h-[180px] transition-colors", dragOver && "border-primary glow-primary bg-primary/5")}
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div className="font-display font-bold text-primary-ink mb-1">Add Files to Broadcast</div>
            <p className="text-sm text-secondary-ink mb-4">The same set goes to every selected peer.</p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm cursor-pointer hover:opacity-90">
                <FileIcon className="w-4 h-4" /> Browse Files
                <input type="file" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bento-cell p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">{selectedFiles.length} items · {formatBytes(totalSize)}</span>
                <button onClick={() => setSelectedFiles([])} className="text-xs text-secondary-ink hover:text-destructive">Clear all</button>
              </div>
              <div className="max-h-56 overflow-y-auto scrollbar-thin divide-y divide-border">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <FileIcon className="w-4 h-4 text-secondary-ink shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-primary-ink truncate">{f.name}</div>
                      <div className="text-xs font-mono text-secondary-ink">{formatBytes(f.size)}</div>
                    </div>
                    <button onClick={() => setSelectedFiles((p) => p.filter((_, j) => j !== i))} className="text-secondary-ink hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bento-cell p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Select Peers</span>
              <button onClick={() => setSelectedPeers(selectedPeers.length === allPeers.length ? [] : allPeers.map((d) => d.id || d.node_id))}
                className="text-xs text-primary hover:underline">
                {selectedPeers.length === allPeers.length ? "Clear" : "All"}
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {allPeers.map((d) => {
                const id = d.id || d.node_id;
                const checked = selectedPeers.includes(id);
                return (
                  <button key={id} onClick={() => togglePeer(id)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                      checked ? "bg-primary/10 border-primary/30" : "bg-white/5 border-grid hover:bg-white/10")}>
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", checked ? "bg-primary border-primary" : "border-grid")}>
                      {checked && <CheckCircle2 className="w-3 h-3 text-primary-ink" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-primary-ink truncate">{d.name}</div>
                      <div className="text-xs font-mono text-secondary-ink">{d.bandwidth_mbps || "?"} Mbps · {d.latency_ms || "?"}ms</div>
                    </div>
                    <TransportBadge transport={d.transport} />
                    {d.trusted && <ShieldCheck className="w-4 h-4 text-success" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={startBulk} disabled={selectedPeers.length === 0 || selectedFiles.length === 0 || creating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed glow-primary">
            <SendIcon className="w-4 h-4" /> {creating ? "Broadcasting…" : `Broadcast to ${selectedPeers.length} peer${selectedPeers.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_PEERS_FALLBACK = [
  { node_id: "demo1", name: "Hekima-Laptop", platform: "macos", transport: "lan", bandwidth_mbps: 940, latency_ms: 0.4, trusted: true },
  { node_id: "demo2", name: "Hekima-Android", platform: "android", transport: "wifi", bandwidth_mbps: 320, latency_ms: 2.1, trusted: false },
];