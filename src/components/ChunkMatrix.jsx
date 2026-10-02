import { cn } from "@/lib/utils";

// Matrix chunking visualizer — signature element.
// Renders a grid of chunk cells colored by state: done / active / pending / failed.
const STATE_COLORS = {
  done: "#10B981",
  active: "#00F0FF",
  pending: "#232D3F",
  failed: "#EF4444",
};

export function ChunkMatrix({ chunks, cols = 16, className }) {
  if (!chunks || chunks.length === 0) {
    return <div className={cn("text-xs font-mono text-secondary-ink", className)}>no chunks</div>;
  }
  return (
    <div
      className={cn("grid gap-1", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {chunks.map((c, i) => (
        <div
          key={i}
          title={`chunk ${i} · ${c.state}`}
          className="aspect-square rounded-[2px] transition-colors"
          style={{
            background: STATE_COLORS[c.state] || STATE_COLORS.pending,
            boxShadow: c.state === "active" ? "0 0 6px 0 #00F0FF80" : "none",
          }}
        />
      ))}
    </div>
  );
}