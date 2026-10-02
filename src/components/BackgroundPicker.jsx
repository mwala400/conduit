import { useState, useRef, useEffect } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import { useBackgroundTheme } from "@/hooks/useBackgroundTheme";
import { cn } from "@/lib/utils";

const PRESETS = [
  { name: "Midnight", hex: "#0B0F17" },
  { name: "Deep Ocean", hex: "#0A1628" },
  { name: "Forest", hex: "#0A1F12" },
  { name: "Plum", hex: "#1A0A1F" },
  { name: "Slate", hex: "#131820" },
  { name: "Charcoal", hex: "#161616" },
  { name: "Indigo", hex: "#12122E" },
  { name: "Cocoa", hex: "#1E140D" },
];

export function BackgroundPicker() {
  const { color, set, reset } = useBackgroundTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-grid hover:border-primary/30 transition-colors"
        title="Customize background color"
      >
        <Palette className="w-3.5 h-3.5 text-primary" />
        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: color || "#0B0F17" }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-surface border border-grid rounded-xl p-3 shadow-2xl">
          <div className="font-mono text-[10px] text-secondary-ink uppercase tracking-wider mb-2">Background Color</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.hex}
                onClick={() => set(p.hex)}
                title={p.name}
                className={cn(
                  "h-9 rounded-lg border-2 flex items-center justify-center transition-transform hover:scale-105",
                  color === p.hex ? "border-primary" : "border-transparent"
                )}
                style={{ background: p.hex }}
              >
                {color === p.hex && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="color"
              value={color || "#0B0F17"}
              onChange={(e) => set(e.target.value)}
              className="w-9 h-9 rounded-lg border border-grid bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={color || ""}
              onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set(e.target.value)}
              placeholder="#0B0F17"
              className="flex-1 px-2 py-1.5 rounded-lg bg-black/30 border border-grid text-xs font-mono text-primary-ink"
            />
          </div>
          <button
            onClick={() => { reset(); setOpen(false); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-grid text-xs text-secondary-ink hover:text-primary-ink"
          >
            <RotateCcw className="w-3 h-3" /> Reset to default
          </button>
        </div>
      )}
    </div>
  );
}