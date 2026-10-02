import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { localApi } from "@/api/localData";
import { TransportBadge } from "@/components/TransportBadge";
import { timeAgo, PLATFORM_META, STATUS_META } from "@/lib/format";
import { Upload, Search, ShieldCheck, ShieldAlert, Trash2, Plus, MonitorSmartphone, Smartphone, Laptop, Globe } from "lucide-react";

const PLATFORM_ICON = { windows: MonitorSmartphone, linux: Laptop, macos: Laptop, android: Smartphone, ios: Smartphone, web: Globe };

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const d = await localApi.entities.Device.list("-updated_date", 100);
      setDevices(d || []);
    } catch { setDevices([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const updateDevice = async (id, patch) => {
    await localApi.entities.Device.update(id, patch);
    load();
  };
  const removeDevice = async (id) => {
    await localApi.entities.Device.delete(id);
    load();
  };

  const filtered = devices.filter((d) => d.name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Devices" subtitle="Paired and discovered peers across your network" icon={MonitorSmartphone}
        action={<button onClick={() => navigate("/nearby")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90"><Plus className="w-4 h-4" /> Add Device</button>} />

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-grid max-w-md">
        <Search className="w-4 h-4 text-secondary-ink" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search devices…" className="bg-transparent outline-none text-sm flex-1 text-primary-ink placeholder:text-secondary-ink" />
      </div>

      {loading ? (
        <div className="text-sm text-secondary-ink">Loading devices…</div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={() => navigate("/nearby")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((d) => {
            const Icon = PLATFORM_ICON[d.platform] || Globe;
            const st = STATUS_META[d.status] || STATUS_META.offline;
            return (
              <div key={d.id} className="bento-cell p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-grid flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-primary-ink text-sm truncate">{d.name}</div>
                    <div className="font-mono text-xs text-secondary-ink truncate">{d.node_id?.slice(0, 16)}…</div>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: st.color }} title={st.label} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <TransportBadge transport={d.transport} />
                  <span className="text-xs font-mono text-secondary-ink">{PLATFORM_META[d.platform]?.label}</span>
                  {d.latency_ms != null && <span className="text-xs font-mono text-secondary-ink">{d.latency_ms}ms</span>}
                </div>
                <div className="text-xs text-secondary-ink font-mono">
                  last seen {timeAgo(d.last_seen || d.updated_date)}
                  {d.bandwidth_mbps ? ` · ${d.bandwidth_mbps} Mbps` : ""}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-grid">
                  {d.trusted ? (
                    <button onClick={() => updateDevice(d.id, { trusted: false })} className="flex items-center gap-1.5 text-xs text-success hover:opacity-80">
                      <ShieldCheck className="w-3.5 h-3.5" /> Trusted
                    </button>
                  ) : (
                    <button onClick={() => updateDevice(d.id, { trusted: true, status: "paired" })} className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80">
                      <ShieldAlert className="w-3.5 h-3.5" /> Trust
                    </button>
                  )}
                  <button onClick={() => navigate("/send")} className="ml-auto flex items-center gap-1.5 text-xs text-primary-ink hover:text-primary">
                    <Upload className="w-3.5 h-3.5" /> Send
                  </button>
                  <button onClick={() => removeDevice(d.id)} className="flex items-center gap-1 text-xs text-secondary-ink hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="bento-cell p-10 text-center">
      <MonitorSmartphone className="w-10 h-10 text-secondary-ink mx-auto mb-3" />
      <div className="font-display font-bold text-primary-ink mb-1">No devices yet</div>
      <p className="text-sm text-secondary-ink mb-4">Discover and pair a device on your local network or over the internet.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm">Discover Nearby</button>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, action = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3">
        {Icon && <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>}
        <div>
          <h1 className="text-carved text-primary-ink text-3xl sm:text-4xl">{title}</h1>
          {subtitle && <p className="text-sm text-secondary-ink font-accent mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="sm:ml-auto">{action}</div>}
    </div>
  );
}