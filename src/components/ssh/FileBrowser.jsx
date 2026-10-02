import { useState } from "react";
import { FolderOpen, File, Upload, Download, RefreshCw, Home, FilePlus, ChevronRight, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

// Virtual remote filesystem for session preview. Live SSH requires the native build.
const FS = {
  "/": ["home", "etc", "var", "opt", "srv", "root", "tmp"],
  "/home": ["conduit", "uploads", "backups"],
  "/home/conduit": ["manifest.json", "config.toml", ".ssh"],
  "/home/uploads": ["dataset-2026.parquet", "archive-q3.tar.gz", "report.pdf", "logs.zip"],
  "/home/backups": ["db-2026-09-30.sql.gz", "db-2026-09-29.sql.gz"],
  "/etc": ["hostname", "hosts", "sshd_config"],
  "/var": ["log", "lib", "cache"],
  "/var/log": ["syslog", "auth.log", "conduit.log"],
  "/opt": ["conduit", "node"],
  "/srv": ["shares"],
  "/root": [".bashrc"],
  "/tmp": [],
};
const FILES = {
  "/home/conduit/manifest.json": { size: 1284, perms: "rw-r--r--", mtime: "2026-09-30 14:02" },
  "/home/conduit/config.toml": { size: 612, perms: "rw-r--r--", mtime: "2026-09-28 09:11" },
  "/home/uploads/dataset-2026.parquet": { size: 482103452, perms: "rw-r--r--", mtime: "2026-10-01 22:40" },
  "/home/uploads/archive-q3.tar.gz": { size: 94371840, perms: "rw-r--r--", mtime: "2026-09-30 03:18" },
  "/home/uploads/report.pdf": { size: 2840123, perms: "rw-r--r--", mtime: "2026-10-01 11:05" },
  "/home/uploads/logs.zip": { size: 12083200, perms: "rw-r--r--", mtime: "2026-09-29 20:44" },
  "/home/backups/db-2026-09-30.sql.gz": { size: 67108864, perms: "rw-r-----", mtime: "2026-09-30 02:00" },
  "/etc/hostname": { size: 12, perms: "rw-r--r--", mtime: "2026-01-12 08:00" },
  "/etc/hosts": { size: 184, perms: "rw-r--r--", mtime: "2026-01-12 08:00" },
  "/var/log/syslog": { size: 45022, perms: "rw-r-----", mtime: "2026-10-02 09:30" },
  "/var/log/auth.log": { size: 12044, perms: "rw-r-----", mtime: "2026-10-02 09:30" },
};

export function FileBrowser({ server }) {
  const [path, setPath] = useState("/home");
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState("");

  const entries = (FS[path] || []).map((name) => {
    const full = path === "/" ? `/${name}` : `${path}/${name}`;
    const isDir = FS[full] != null || !FILES[full];
    const meta = FILES[full];
    return { name, full, isDir, size: meta?.size ?? 0, perms: meta?.perms ?? "drwxr-xr-x", mtime: meta?.mtime ?? "—" };
  }).sort((a, b) => (a.isDir === b.isDir) ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1);

  const crumbs = path === "/" ? [""] : path.split("/");
  const act = (label, ms = 700) => { setBusy(label); setTimeout(() => setBusy(""), ms); };

  return (
    <div className="flex flex-col h-full bento-cell overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-grid">
        <HardDrive className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-secondary-ink truncate">{server.username}@{server.host}</span>
        <span className="ml-auto text-[10px] font-mono text-secondary-ink">{server.os}</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-grid text-xs overflow-x-auto scrollbar-thin">
        <button onClick={() => setPath("/home")} className="p-1 rounded hover:bg-white/5"><Home className="w-3.5 h-3.5 text-secondary-ink" /></button>
        {crumbs.map((c, i) => {
          const p = c === "" ? "/" : "/" + crumbs.slice(1, i + 1).join("/");
          return (
            <span key={i} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="w-3 h-3 text-secondary-ink/50" />
              <button onClick={() => FS[p] != null && setPath(p)} className={cn("px-1.5 py-0.5 rounded font-mono", path === p ? "text-primary" : "text-secondary-ink hover:text-primary-ink")}>
                {c === "" ? "root" : c}
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface text-secondary-ink">
            <tr className="text-left">
              <th className="px-3 py-1.5 font-medium">Name</th>
              <th className="px-3 py-1.5 font-medium w-20">Size</th>
              <th className="px-3 py-1.5 font-medium w-24">Perms</th>
              <th className="px-3 py-1.5 font-medium w-32">Modified</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.full} onClick={() => (e.isDir ? null : setSel(e.full))} onDoubleClick={() => e.isDir && setPath(e.full)}
                className={cn("cursor-pointer border-t border-grid/40 hover:bg-white/5", sel === e.full && "bg-primary/10")}>
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    {e.isDir ? <FolderOpen className="w-3.5 h-3.5 text-primary" /> : <File className="w-3.5 h-3.5 text-secondary-ink" />}
                    <span className="font-mono">{e.name}</span>
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono text-secondary-ink">{e.isDir ? "—" : formatBytes(e.size)}</td>
                <td className="px-3 py-1.5 font-mono text-secondary-ink">{e.perms}</td>
                <td className="px-3 py-1.5 font-mono text-secondary-ink">{e.mtime}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-secondary-ink">Empty directory</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-grid">
        <button onClick={() => act("Refreshed")} className="px-2 py-1 rounded text-xs text-secondary-ink hover:text-primary-ink hover:bg-white/5 flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
        <button onClick={() => act("Uploading…")} className="px-2 py-1 rounded text-xs text-secondary-ink hover:text-primary hover:bg-white/5 flex items-center gap-1"><Upload className="w-3.5 h-3.5" />Upload</button>
        <button onClick={() => sel && act("Downloading…")} disabled={!sel} className="px-2 py-1 rounded text-xs text-secondary-ink hover:text-primary hover:bg-white/5 flex items-center gap-1 disabled:opacity-40"><Download className="w-3.5 h-3.5" />Download</button>
        <button onClick={() => act("Created folder")} className="px-2 py-1 rounded text-xs text-secondary-ink hover:text-primary-ink hover:bg-white/5 flex items-center gap-1"><FilePlus className="w-3.5 h-3.5" />Mkdir</button>
        <span className="ml-auto text-[11px] font-mono text-primary min-w-[80px] text-right">{busy}</span>
      </div>
    </div>
  );
}