import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { Calendar, Clock, Play, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

// Scheduled Transfers — defer a transfer's start to a future time. Stored
// locally (browser) since this preview has no cron runtime; a native build
// would hand these to the OS scheduler.
export default function Scheduled() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("conduit.scheduled") || "[]"); } catch { return []; }
  });
  const [name, setName] = useState("");
  const [when, setWhen] = useState("");
  const [peer, setPeer] = useState("");

  const persist = (next) => {
    setJobs(next);
    localStorage.setItem("conduit.scheduled", JSON.stringify(next));
  };

  const add = () => {
    if (!name || !when) return;
    persist([{ id: Math.random().toString(36).slice(2), name, when, peer, status: "pending" }, ...jobs]);
    setName(""); setWhen(""); setPeer("");
  };

  const remove = (id) => persist(jobs.filter((j) => j.id !== id));
  const runNow = (j) => {
    remove(j.id);
    sessionStorage.setItem("conduit.pending_files", JSON.stringify([{ name: j.name, size: 0 }]));
    if (j.peer) sessionStorage.setItem("conduit.pending_peer_name", j.peer);
    navigate("/send");
  };

  const dueSoon = (when) => {
    const t = new Date(when).getTime();
    return t - Date.now() < 60 * 60 * 1000 && t > Date.now();
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Scheduled" subtitle="Defer transfers to a future time — fire-and-forget delivery" icon={Calendar} />

      <div className="bento-cell p-5">
        <div className="text-carved text-primary-ink text-xl mb-3">New Scheduled Transfer</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Payload name"
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary" />
          <input value={peer} onChange={(e) => setPeer(e.target.value)} placeholder="Peer name (optional)"
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink outline-none focus:border-primary" />
          <button onClick={add} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90">
            <Plus className="w-4 h-4" /> Schedule
          </button>
        </div>
      </div>

      <div className="bento-cell p-5">
        <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-3">Queued Jobs</div>
        {jobs.length === 0 ? (
          <div className="text-sm text-secondary-ink py-6 text-center">No scheduled transfers. Create one above.</div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center gap-3 py-3">
                <Clock className={cn("w-4 h-4 shrink-0", dueSoon(j.when) ? "text-amber-400" : "text-secondary-ink")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-primary-ink truncate">{j.name}</div>
                  <div className="text-xs font-mono text-secondary-ink">
                    {new Date(j.when).toLocaleString()} · to {j.peer || "auto"} · {timeAgo(j.when)}
                  </div>
                </div>
                {dueSoon(j.when) && <span className="text-[10px] font-mono text-amber-400 uppercase">due soon</span>}
                <button onClick={() => runNow(j)} className="text-primary hover:opacity-80"><Play className="w-4 h-4" /></button>
                <button onClick={() => remove(j.id)} className="text-secondary-ink hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}