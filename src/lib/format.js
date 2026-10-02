// Formatting and transfer-domain helpers (pure functions, no side effects)

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes < 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function formatSpeed(bps) {
  return `${formatBytes(bps)}/s`;
}

export function formatEta(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${String(s).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "—";
  return formatEta(seconds);
}

export function timeAgo(dateStr) {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function progressPercent(transferred, total) {
  if (!total) return 0;
  return Math.min(100, (transferred / total) * 100);
}

// SHA-256 via WebCrypto (async) — real integrity hashing, not a fake
export async function sha256Hex(data) {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Short fingerprint of a key/hash for display
export function fingerprint(hash) {
  if (!hash) return "—";
  return hash.slice(0, 16).toUpperCase();
}

// Generate a cryptographically random short pairing code
export function generatePairingCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (n) => n % 10).join("");
}

// Generate a random node id
export function generateNodeId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const TRANSPORT_META = {
  lan: { label: "LAN", color: "#10B981", icon: "Network" },
  wifi: { label: "Wi-Fi", color: "#00F0FF", icon: "Wifi" },
  bluetooth: { label: "Bluetooth", color: "#60A5FA", icon: "Bluetooth" },
  webrtc: { label: "WebRTC", color: "#A78BFA", icon: "Globe" },
  quic: { label: "QUIC", color: "#00F0FF", icon: "Zap" },
  tcp: { label: "TCP", color: "#8E9BAE", icon: "Cable" },
  relay: { label: "Relay", color: "#F59E0B", icon: "Repeat" },
  cloud: { label: "Cloud", color: "#F472B6", icon: "Cloud" },
};

export const PLATFORM_META = {
  windows: { label: "Windows", icon: "Monitor" },
  linux: { label: "Linux", icon: "Terminal" },
  macos: { label: "macOS", icon: "Laptop" },
  android: { label: "Android", icon: "Smartphone" },
  ios: { label: "iOS", icon: "Smartphone" },
  web: { label: "Web", icon: "Globe" },
};

export const STATUS_META = {
  online: { label: "Online", color: "#10B981" },
  offline: { label: "Offline", color: "#8E9BAE" },
  paired: { label: "Paired", color: "#00F0FF" },
  discovered: { label: "Discovered", color: "#F59E0B" },
  blocked: { label: "Blocked", color: "#EF4444" },
  active: { label: "Active", color: "#00F0FF" },
  paused: { label: "Paused", color: "#F59E0B" },
  completed: { label: "Completed", color: "#10B981" },
  failed: { label: "Failed", color: "#EF4444" },
  cancelled: { label: "Cancelled", color: "#8E9BAE" },
  waiting: { label: "Waiting", color: "#F59E0B" },
  queued: { label: "Queued", color: "#8E9BAE" },
};