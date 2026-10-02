import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { subscribeToPeerPresence } from "@/lib/shareTransport";
import { Globe, Laptop, MonitorSmartphone, Radar, Smartphone, Wifi } from "lucide-react";

const platformIcons = {
  Android: Smartphone,
  iOS: Smartphone,
  Windows: MonitorSmartphone,
  macOS: Laptop,
  Linux: Laptop,
  Web: Globe,
};

export default function Nearby() {
  const navigate = useNavigate();
  const [presence, setPresence] = useState({ state: "connecting", peers: [] });

  useEffect(() => subscribeToPeerPresence(setPresence), []);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader title="Nearby devices" subtitle="Live devices connected to this Conduit server" icon={Radar} />

      <section className="bento-cell space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">
            {presence.state === "connected" ? `${presence.peers.length} other device(s) online` : "Connecting to sharing server"}
          </span>
        </div>
        {presence.state !== "connected" ? (
          <p className="text-sm text-secondary-ink" role="status">
            Waiting for the Conduit server. Confirm this device is using the same server address as the other device in Settings.
          </p>
        ) : presence.peers.length ? (
          <div className="space-y-2">
            {presence.peers.map((peer) => {
              const Icon = platformIcons[peer.platform] || Globe;
              return (
                <div key={peer.peerId} className="flex flex-wrap items-center gap-3 rounded-lg border border-grid bg-white/5 p-3">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-primary-ink">{peer.name}</div>
                    <div className="text-xs text-secondary-ink">{peer.platform} · online now</div>
                  </div>
                  <button
                    onClick={() => navigate("/send")}
                    className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    Choose files to send
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary-ink">
            No other devices are online yet. Open Conduit on the receiving device and connect it to this same server; the list updates automatically.
          </p>
        )}
        <p className="border-t border-grid pt-3 text-xs text-secondary-ink">
          Direct sending does not need a copied link or QR. Both devices must stay online on this server; the receiver will get an invitation to accept.
        </p>
      </section>
    </div>
  );
}
