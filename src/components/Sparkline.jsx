// Lightweight SVG sparkline for throughput visualization.
// Pure presentational, driven by a numeric samples array.
export function Sparkline({ samples, color = "#00F0FF", width = 120, height = 28, fill = true }) {
  if (!samples || samples.length < 2) {
    return <div style={{ width, height }} className="opacity-30" />;
  }
  const max = Math.max(...samples, 1);
  const min = Math.min(...samples, 0);
  const range = max - min || 1;
  const step = width / (samples.length - 1);
  const points = samples.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && <path d={areaPath} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}