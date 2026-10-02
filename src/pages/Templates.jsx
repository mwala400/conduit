import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { TransportBadge } from "@/components/TransportBadge";
import { Plus, LayoutTemplate, Play, Trash2, Pencil, Sparkles } from "lucide-react";
import { TRANSPORT_META } from "@/lib/format";

const COMPRESSION = ["auto", "off", "fast", "maximum"];
const PRIORITY = ["performance", "balanced", "battery_saver", "data_saver"];
const TRANSPORTS = ["lan", "wifi", "bluetooth", "webrtc", "quic", "tcp", "relay", "cloud"];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([localApi.entities.TransferTemplate.list("-updated_date", 100), localApi.entities.Device.list("-updated_date", 100)]);
      setTemplates(t || []); setDevices(d || []);
    } catch { setTemplates([]); setDevices([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing.name) return;
    if (editing.id) await localApi.entities.TransferTemplate.update(editing.id, editing);
    else await localApi.entities.TransferTemplate.create(editing);
    setEditing(null); load();
  };
  const remove = async (id) => { await localApi.entities.TransferTemplate.delete(id); load(); };

  const launch = async (t) => {
    await localApi.entities.Transfer.create({
      name: `template: ${t.name}`,
      direction: "send",
      status: "queued",
      transport: t.transport,
      compression: t.compression,
      priority: t.priority,
      encrypted: t.encrypted,
      peer_name: t.peer_name,
      peer_node_id: t.peer_node_id,
    });
    navigate("/transfers");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Templates" subtitle="Reusable transfer presets — one click to queue a job" icon={LayoutTemplate}
        action={<button onClick={() => setEditing(blank())} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90"><Plus className="w-4 h-4" /> New Template</button>} />

      {loading ? <div className="text-sm text-secondary-ink">Loading…</div> : templates.length === 0 ? (
        <div className="bento-cell p-10 text-center">
          <LayoutTemplate className="w-8 h-8 text-secondary-ink mx-auto mb-2" />
          <p className="text-sm text-secondary-ink mb-4">No templates yet. Save your favorite transfer settings to launch them in one click.</p>
          <button onClick={() => setEditing(blank())} className="text-sm text-primary">Create a template →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="bento-cell p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0"><LayoutTemplate className="w-4 h-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-primary-ink truncate">{t.name}</div>
                  {t.description && <div className="text-xs text-secondary-ink truncate">{t.description}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <TransportBadge transport={t.transport} />
                <span className="text-[11px] font-mono text-secondary-ink">{t.compression}</span>
                <span className="text-[11px] font-mono text-secondary-ink">{t.priority}</span>
              </div>
              <div className="text-xs font-mono text-secondary-ink truncate">
                {t.peer_name || "any peer"}{t.file_pattern ? ` · ${t.file_pattern}` : ""}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-grid">
                <button onClick={() => launch(t)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-semibold hover:bg-primary/20"><Play className="w-3.5 h-3.5" />Launch</button>
                <button onClick={() => setEditing({ ...t })} className="ml-auto p-1.5 text-secondary-ink hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(t.id)} className="p-1.5 text-secondary-ink hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bento-cell w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-carved text-primary-ink text-xl">{editing.id ? "Edit" : "New"} Template</h3>
            </div>
            <div className="space-y-3">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} placeholder="Nightly backup push" />
              <Field label="Description" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} placeholder="Auto-push daily backup archives to edge-01" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Peer" value={editing.peer_name || ""} onChange={(v) => { const d = devices.find((x) => x.name === v); setEditing({ ...editing, peer_name: v, peer_node_id: d?.node_id }); }} options={[{ v: "", l: "Any peer" }, ...devices.map((d) => ({ v: d.name, l: d.name }))]} />
                <Select label="Transport" value={editing.transport} onChange={(v) => setEditing({ ...editing, transport: v })} options={TRANSPORTS.map((t) => ({ v: t, l: TRANSPORT_META[t].label }))} />
                <Select label="Compression" value={editing.compression} onChange={(v) => setEditing({ ...editing, compression: v })} options={COMPRESSION.map((c) => ({ v: c, l: c }))} />
                <Select label="Priority" value={editing.priority} onChange={(v) => setEditing({ ...editing, priority: v })} options={PRIORITY.map((p) => ({ v: p, l: p }))} />
              </div>
              <Field label="File pattern (glob)" value={editing.file_pattern || ""} onChange={(v) => setEditing({ ...editing, file_pattern: v })} placeholder="*.tar.gz" />
              <label className="flex items-center gap-2 text-sm text-primary-ink">
                <input type="checkbox" checked={editing.encrypted} onChange={(e) => setEditing({ ...editing, encrypted: e.target.checked })} className="accent-[hsl(var(--primary))]" /> End-to-end encrypted
              </label>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-ink font-semibold text-sm">{editing.id ? "Save" : "Create"}</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-grid text-sm text-secondary-ink hover:text-primary-ink">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function blank() { return { id: null, name: "", description: "", peer_name: "", peer_node_id: "", transport: "quic", compression: "auto", priority: "balanced", file_pattern: "", encrypted: true }; }
function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono text-secondary-ink uppercase tracking-wider">{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary" />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono text-secondary-ink uppercase tracking-wider">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary">
        {options.map((o) => <option key={o.v} value={o.v} className="bg-surface">{o.l}</option>)}
      </select>
    </label>
  );
}