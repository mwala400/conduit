import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT = (user, host, cwd) => `${user}@${host}:${cwd}$`;
const HELP = `Available: ls, cd, pwd, cat, whoami, uname, date, uptime,
df, free, ps, netstat, ip, ping, echo, mkdir, rm, clear, exit, help`;

const FS = {
  "/": ["home", "etc", "var", "opt", "srv", "root", "tmp"],
  "/home": ["conduit", "uploads", "backups"],
  "/home/conduit": ["manifest.json", "config.toml", ".ssh"],
  "/home/uploads": ["dataset-2026.parquet", "archive-q3.tar.gz", "report.pdf"],
  "/home/backups": ["db-2026-09-30.sql.gz"],
  "/etc": ["hostname", "hosts", "sshd_config"],
  "/var": ["log", "lib", "cache"],
  "/var/log": ["syslog", "auth.log", "conduit.log"],
  "/opt": ["conduit", "node"],
  "/srv": ["shares"], "/root": [".bashrc"], "/tmp": [],
};
const CAT = {
  "/etc/hostname": "edge-01",
  "/home/conduit/config.toml": "[conduit]\nnode_id = 0x1a2b3c\ntransport = quic\nencryption = x25519-chacha20",
};

export function Terminal({ server, onClose }) {
  const [cwd, setCwd] = useState("/home");
  const [lines, setLines] = useState([
    { t: "sys", s: `Conduit SSH session — ${server.username}@${server.host}:${server.port} (${server.os})` },
    { t: "sys", s: "Live SSH requires the native build. This is a read-only session preview." },
    { t: "sys", s: "Type 'help' for commands." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const push = (s, t = "out") => setLines((l) => [...l, { t, s }]);

  const run = (raw) => {
    const cmd = raw.trim();
    push(`${PROMPT(server.username, server.host, cwd)} ${cmd}`, "in");
    if (!cmd) return;
    const [c, ...args] = cmd.split(/\s+/);
    switch (c) {
      case "help": push(HELP); break;
      case "pwd": push(cwd); break;
      case "whoami": push(server.username); break;
      case "uname": push(args[0] === "-a" ? `Linux ${server.host} 6.5.0-conduit #1 SMP x86_64 GNU/Linux` : "Linux"); break;
      case "date": push(new Date().toString()); break;
      case "uptime": push(` ${new Date().toLocaleTimeString()} up 14 days, 3:02, 1 user, load avg: 0.12, 0.18, 0.21`); break;
      case "echo": push(args.join(" ")); break;
      case "clear": setLines([]); break;
      case "exit": onClose?.(); break;
      case "ls": push((FS[cwd] || []).join("  ")); break;
      case "cd": {
        const target = args[0] || "/home";
        const next = target.startsWith("/") ? target : (cwd === "/" ? `/${target}` : `${cwd}/${target}`);
        if (FS[next] != null) setCwd(next); else push(`cd: no such file or directory: ${target}`, "err");
        break;
      }
      case "cat": push(CAT[args[0]] || `cat: ${args[0] || ""}: no such file`, "err"); break;
      case "df": push("Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1       128G   41G   79G  35% /\ntmpfs           3.9G   0B  3.9G   0% /dev/shm"); break;
      case "free": push("              total        used        free      shared  buff/cache   available\nMem:          7.8Gi       1.2Gi       4.8Gi       0.1Gi       1.8Gi       6.2Gi\nSwap:         2.0Gi          0B       2.0Gi"); break;
      case "ps": push("  PID USER     %CPU %MEM COMMAND\n    1 root      0.0  0.1 systemd\n  842 conduit   1.2  0.8 conduit-node\n  901 conduit   0.4  0.3 conduit-relay\n 1203 root      0.0  0.1 sshd"); break;
      case "netstat": push("Proto Local Address           Foreign Address         State\ntcp   0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp   0.0.0.0:8443             0.0.0.0:*               LISTEN\nudp   0.0.0.0:5353             0.0.0.0:*               "); break;
      case "ip": push("1: lo: <LOOPBACK> inet 127.0.0.1/8\n2: eth0: <UP> inet 10.0.4.18/24"); break;
      case "ping": push(`PING ${args[0] || "gateway"} 56(84) bytes of data.\n64 bytes from ${args[0] || "gateway"}: icmp_seq=1 ttl=64 time=0.42 ms\n64 bytes from ${args[0] || "gateway"}: icmp_seq=2 ttl=64 time=0.38 ms\n--- 2 packets transmitted, 2 received, 0% packet loss`); break;
      case "mkdir": push(`created directory '${args[0] || ""}' (preview)`); break;
      case "rm": push(`removed '${args[0] || ""}' (preview)`); break;
      default: push(`${c}: command not found — type 'help'`, "err");
    }
  };

  return (
    <div className="flex flex-col h-full bento-cell overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-grid">
        <TerminalIcon className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-secondary-ink truncate">{server.username}@{server.host} — /bin/bash</span>
        {onClose && <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-white/5"><X className="w-3.5 h-3.5 text-secondary-ink" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 font-mono text-xs leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className={cn("whitespace-pre-wrap", l.t === "in" && "text-primary-ink", l.t === "sys" && "text-secondary-ink", l.t === "err" && "text-destructive", l.t === "out" && "text-primary-ink/80")}>{l.s}</div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-primary shrink-0">{PROMPT(server.username, server.host, cwd)}</span>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { run(input); setInput(""); } }}
            className="flex-1 bg-transparent outline-none text-primary-ink min-w-0" />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}