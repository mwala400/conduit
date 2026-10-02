import { useEffect, useState } from "react";

// Persists a custom background color in localStorage and applies it to the
// document root by overriding the --background CSS variable (HSL channels).
// Surface is derived as a slightly lighter shade so bento cells stay readable.
const KEY = "conduit.bg_color";

export function useBackgroundTheme() {
  const [color, setColor] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      setColor(stored);
      applyColor(stored);
    }
  }, []);

  function set(hex) {
    setColor(hex);
    localStorage.setItem(KEY, hex);
    applyColor(hex);
  }

  function reset() {
    setColor(null);
    localStorage.removeItem(KEY);
    document.documentElement.style.removeProperty("--background");
    document.documentElement.style.removeProperty("--surface");
  }

  return { color, set, reset };
}

function applyColor(hex) {
  const [h, s, l] = hexToHsl(hex);
  document.documentElement.style.setProperty("--background", `${h} ${s}% ${l}%`);
  // Derive a surface shade ~6% lighter for readable bento cells
  document.documentElement.style.setProperty("--surface", `${h} ${s}% ${Math.min(l + 6, 20)}%`);
  document.documentElement.style.setProperty("--border", `${h} ${s}% ${Math.min(l + 13, 28)}%`);
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}