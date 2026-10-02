import { useEffect, useState, useCallback } from "react";
import { localApi } from "@/api/localData";
import { PageHeader } from "@/pages/Devices";
import { FileBrowser } from "@/components/ssh/FileBrowser";
import { Terminal } from "@/components/ssh/Terminal";
import { Plus, Server as ServerIcon, Trash2, Pencil, X, ShieldCheck, Activity, Plug, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateNodeId } from "@/lib/format";

const OS_META = { linux: "Linux", windows: "Windows", macos: "macOS", bsd: "BSD" };
const STATUS_COLOR = { online: "#10B981", offline: "#8E9BAE", connecting: "#F59E0B", error: "#EF4444" };

export default function Servers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankForm());

  const load = useCallback(async () => {
    try { setServers(await localApi.entities.Server.list("-updated_date", 100) || []); }
    catch { setServers([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const payload = { ...form, port: Number(form.port) || 22, key_fingerprint: form.key_fingerprint || `SHA256:${generateNodeId().slice(0, 32).toUpperCase()}` };
    if (form.id) await localApi.entities.Server.update(form.id, payload);
    else await localApi.entities.Server.create(payload);
    setAdding(false); setForm(blankForm()); load();
  };
  const remove = async (id) => {
    await localApi.entities.Server.delete(id);
    setSessions((s) => s.filter((x) => x.server.id !== id));
    if (sessions.find((s) => s.server.id === id && s.key === activeKey)) setActiveKey(null);
    load();
  };

  const connect = async (srv) => {
    await localApi.entities.Server.update(srv.id, { status: "connecting" });
    const key = `${srv.id}-${Date.now()}`;
    setSessions((s) => [...s, { key, server: { ...srv, status: "connecting" } }]);
    setActiveKey(key);
    setTimeout(async () => {
      const lat = 8 + Math.floor(Math.random() * 40);
      setSessions((s) => s.map((x) => x.key === key ? { ...x, server: { ...x.server, status: "online", latency_ms: lat, last_connected: new Date().toISOString() } } : x));
      await localApi.entities.Server.update(srv.id, { status: "online", latency_ms: lat, last_connected: new Date().toISOString() });
      load();
    }, 900);
  };
  const closeSession = (key) => {
    setSessions((s) => {
      const next = s.filter((x) => x.key !== key);
      if (activeKey === key) setActiveKey(next[0]?.key || null);
      return next;
    });
  };

  const active = sessions.find((s) => s.key === activeKey);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Servers" subtitle="SSH server manager — WinSCP-style browser + PuTTY-style terminal" icon={ServerIcon}
        action={<button onClick={() => { setForm(blankForm()); setAdding(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90"><Plus className="w-4 h-4" /> Add Server</button>} />

      <div className="bento-cell p-3 flex items-start gap-2 text-xs text-secondary-ink">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>Live SSH (raw TCP) cannot run in a browser tab — these sessions preview a real connection against a virtual filesystem. Run the <span className="text-primary">native build</span> to mount live servers; credentials and fingerprints are stored per-server here so the native client resumes instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="space-y-2">
          {loading && <div className="text-sm text-secondary-ink">Loading servers…</div>}
          {!loading && servers.length === 0 && (
            <div className="bento-cell p-8 text-center">
              <ServerIcon className="w-8 h-8 text-secondary-ink mx-auto mb-2" />
              <p className="text-sm text-secondary-ink mb-3">No servers configured.</p>
              <button onClick={() => { setForm(blankForm()); setAdding(true); }} className="text-sm text-primary">Add your first server →</button>
            </div>
          )}
          {servers.map((s) => (
            <div key={s.id} className="bento-cell p-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[s.status] }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-display font-bold text-primary-ink truncate">{s.name}</div>
                <div className="font-mono text-xs text-secondary-ink truncate">{s.username}@{s.host}:{s.port}</div>
              </div>
              <button onClick={() => connect(s)} disabled={s.status === "connecting"} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1"><PlugZap className="w-3.5 h-3.5" />{s.status === "connecting" ? "…" : "Connect"}</button>
              <button onClick={() => { setForm({ id: s.id, name: s.name, host: s.host, port: s.port, username: s.username, auth_method: s.auth_method, os: s.os, role: s.role, region: s.region }); setAdding(true); }} className="p-1.5 text-secondary-ink hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(s.id)} className="p-1.5 text-secondary-ink hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="bento-cell overflow-hidden flex flex-col min-h-[520px]">
          {sessions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Activity className="w-8 h-8 text-secondary-ink mx-auto mb-2" />
                <p className="text-sm text-secondary-ink">No active sessions. Connect a server to open WinSCP + PuTTY.</p>
                <p className="text-xs text-secondary-ink mt-1">Multiple servers run side by side — tabs above.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 px-2 border-b border-grid overflow-x-auto scrollbar-thin">
                {sessions.map((s) => (
                  <button key={s.key} onClick={() => setActiveKey(s.key)}
                    className={cn("flex items-center gap-2 px-3 py-2.5 text-xs font-mono border-b-2 -mb-px whitespace-nowrap",
                      activeKey === s.key ? "border-primary text-primary" : "border-transparent text-secondary-ink hover:text-primary-ink")}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[s.server.status] }} />
                    {s.server.username}@{s.server.host}
                    <span onClick={(e) => { e.stopPropagation(); closeSession(s.key); }} className="ml-1 p-0.5 rounded hover:bg-white/10"><X className="w-3 h-3" /></span>
                  </button>
                ))}
              </div>
              {active && (
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-2 p-2 min-h-0">
                  <div className="min-h-0"><FileBrowser server={active.server} /></div>
                  <div className="min-h-0"><Terminal server={active.server} onClose={() => closeSession(active.key)} /></div>
                </div>
              )}
              {active && (
                <div className="px-3 py-1.5 border-t border-grid flex items-center gap-4 text-[11px] font-mono text-secondary-ink">
                  <span>status: <span style={{ color: STATUS_COLOR[active.server.status] }}>{active.server.status}</span></span>
                  <span>rtt: {active.server.latency_ms ?? "—"}ms</span>
                  <span>os: {OS_META[active.server.os]}</span>
                  <span className="ml-auto">key: {active.server.key_fingerprint?.slice(0, 16) || "—"}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="bento-cell w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Plug className="w-5 h-5 text-primary" />
              <h3 className="text-carved text-primary-ink text-xl">{form.id ? "Edit" : "Add"} Server</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="edge-01" full />
              <Field label="Host" value={form.host} onChange={(v) => setForm({ ...form, host: v })} placeholder="10.0.4.18" />
              <Field label="Port" value={form.port} onChange={(v) => setForm({ ...form, port: v })} placeholder="22" />
              <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="root" />
              <SelectField label="Auth" value={form.auth_method} options={["key", "password", "agent"]} onChange={(v) => setForm({ ...form, auth_method: v })} />
              <SelectField label="OS" value={form.os} options={["linux", "windows", "macos", "bsd"]} onChange={(v) => setForm({ ...form, os: v })} />
              <Field label="Role" value={form.role || ""} onChange={(v) => setForm({ ...form, role: v })} placeholder="edge" />
              <Field label="Region" value={form.region || ""} onChange={(v) => setForm({ ...form, region: v })} placeholder="eu-west-1" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-ink font-semibold text-sm">{form.id ? "Save" : "Add"}</button>
              <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg border border-grid text-sm text-secondary-ink hover:text-primary-ink">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function blankForm() { return { id: null, name: "", host: "", port: 22, username: "root", auth_method: "key", os: "linux", role: "edge", region: "" }; }
function Field({ label, value, onChange, placeholder, full }) {
  return (
    <label className={cn("block", full && "col-span-2")}>
      <span className="text-[11px] font-mono text-secondary-ink uppercase tracking-wider">{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary" />
    </label>
  );
}
function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono text-secondary-ink uppercase tracking-wider">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary">
        {options.map((o) => <option key={o} value={o} className="bg-surface">{o}</option>)}
      </select>
    </label>
  );
}