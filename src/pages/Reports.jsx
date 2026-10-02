import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/pages/Devices";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";
import { localApi } from "@/api/localData";
import { formatBytes } from "@/lib/format";
import { BarChart3, Download, TrendingUp, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { TRANSPORT_META, STATUS_META } from "@/lib/format";

const STATUS_COLORS = {
  completed: "#10B981", failed: "#EF4444", active: "#00F0FF",
  paused: "#F59E0B", cancelled: "#8E9BAE", waiting: "#F59E0B", queued: "#8E9BAE",
};

export default function Reports() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localApi.entities.Transfer.list("-created_date", 200).then((t) => {
      setTransfers(t);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = transfers.length;
    const completed = transfers.filter((t) => t.status === "completed");
    const failed = transfers.filter((t) => t.status === "failed");
    const active = transfers.filter((t) => t.status === "active");
    const totalBytes = transfers.reduce((s, t) => s + (t.total_size || 0), 0);
    const transferredBytes = transfers.reduce((s, t) => s + (t.transferred_size || 0), 0);
    const successRate = total ? Math.round((completed.length / total) * 100) : 0;
    const avgSpeed = completed.length
      ? completed.reduce((s, t) => s + (t.speed_bps || 0), 0) / completed.length
      : 0;
    return { total, completed: completed.length, failed: failed.length, active: active.length, totalBytes, transferredBytes, successRate, avgSpeed };
  }, [transfers]);

  const byTransport = useMemo(() => {
    const map = {};
    transfers.forEach((t) => {
      const k = t.transport || "lan";
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([k, v]) => ({ name: TRANSPORT_META[k]?.label || k, value: v, color: TRANSPORT_META[k]?.color || "#8E9BAE" }));
  }, [transfers]);

  const byStatus = useMemo(() => {
    const map = {};
    transfers.forEach((t) => { map[t.status] = (map[t.status] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: STATUS_META[k]?.label || k, value: v, fill: STATUS_COLORS[k] || "#8E9BAE" }));
  }, [transfers]);

  // Throughput over recent transfers (simulated timeline from transferred size + speed)
  const throughput = useMemo(() => {
    return transfers.slice(0, 12).reverse().map((t, i) => ({
      name: `#${i + 1}`,
      mbps: Math.round(((t.speed_bps || 0) * 8) / 1e6),
    }));
  }, [transfers]);

  function exportCsv() {
    const rows = [["name", "direction", "status", "transport", "total_size", "transferred_size", "speed_bps", "peer", "encrypted", "integrity_verified"]];
    transfers.forEach((t) => {
      rows.push([t.name, t.direction, t.status, t.transport, t.total_size, t.transferred_size, t.speed_bps, t.peer_name, t.encrypted, t.integrity_verified]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "conduit-transfers-report.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="p-6"><div className="bento-cell h-96 animate-pulse" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader title="Reports" subtitle="Transfer analytics, throughput, and exportable reports" icon={BarChart3} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Total Transfers" value={stats.total} color="#00F0FF" />
        <StatCard icon={CheckCircle2} label="Success Rate" value={`${stats.successRate}%`} color="#10B981" />
        <StatCard icon={TrendingUp} label="Data Moved" value={formatBytes(stats.transferredBytes)} color="#A78BFA" />
        <StatCard icon={Clock} label="Avg Speed" value={`${formatBytes(stats.avgSpeed)}/s`} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bento-cell p-5">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">Throughput (Mbps)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={throughput}>
              <defs>
                <linearGradient id="th" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232D3F" />
              <XAxis dataKey="name" stroke="#8E9BAE" fontSize={11} />
              <YAxis stroke="#8E9BAE" fontSize={11} />
              <Tooltip contentStyle={{ background: "#151C28", border: "1px solid #232D3F", borderRadius: 8 }} />
              <Area type="monotone" dataKey="mbps" stroke="#00F0FF" fill="url(#th)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bento-cell p-5">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">Transfers by Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232D3F" />
              <XAxis dataKey="name" stroke="#8E9BAE" fontSize={11} />
              <YAxis stroke="#8E9BAE" fontSize={11} />
              <Tooltip contentStyle={{ background: "#151C28", border: "1px solid #232D3F", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bento-cell p-5">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">Transport Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byTransport} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                {byTransport.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#151C28", border: "1px solid #232D3F", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {byTransport.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-secondary-ink">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                {e.name} ({e.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bento-cell p-5 flex flex-col">
          <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider mb-4">Export & Actions</div>
          <div className="space-y-3 flex-1">
            <ActionRow label="Completed" value={stats.completed} color="#10B981" />
            <ActionRow label="Failed" value={stats.failed} color="#EF4444" />
            <ActionRow label="Active now" value={stats.active} color="#00F0FF" />
            <ActionRow label="Total payload" value={formatBytes(stats.totalBytes)} color="#A78BFA" />
          </div>
          <button onClick={exportCsv} className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20">
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bento-cell p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-secondary-ink">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-display font-bold text-primary-ink tabular-nums">{value}</div>
    </div>
  );
}

function ActionRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-grid last:border-0">
      <span className="flex items-center gap-2 text-sm text-secondary-ink">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="text-sm font-mono text-primary-ink tabular-nums">{value}</span>
    </div>
  );
}