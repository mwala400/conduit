import { Globe, Lock, Server, Zap } from "lucide-react";

export function SmartRouting() {
  return (
    <div className="bento-cell space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">Sharing connection</span>
      </div>
      <div className="flex items-start gap-3">
        <Server className="mt-0.5 h-4 w-4 shrink-0 text-secondary-ink" />
        <p className="text-xs text-secondary-ink">The Conduit server discovers online devices and exchanges connection setup messages.</p>
      </div>
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-secondary-ink" />
        <p className="text-xs text-secondary-ink">Files use an encrypted WebRTC data channel. A TURN relay may carry traffic if a direct path is unavailable.</p>
      </div>
      <div className="flex items-start gap-3">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-secondary-ink" />
        <p className="text-xs text-secondary-ink">Both devices must stay connected to the same Conduit server until sharing is complete.</p>
      </div>
    </div>
  );
}
