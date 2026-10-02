import { TRANSPORT_META } from "@/lib/format";
import { cn } from "@/lib/utils";

// Glowing transport status badge — signature element
export function TransportBadge({ transport, latencyMs = null, className = "" }) {
  const meta = TRANSPORT_META[transport] || TRANSPORT_META.tcp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border",
        className
      )}
      style={{
        color: meta.color,
        borderColor: `${meta.color}40`,
        background: `${meta.color}12`,
        boxShadow: `0 0 12px -4px ${meta.color}80`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: meta.color }} />
      {meta.label}
      {latencyMs != null && (
        <span className="text-secondary-ink/70 ml-0.5">· {latencyMs}ms</span>
      )}
    </span>
  );
}