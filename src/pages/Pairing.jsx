import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { KeyRound, Link2, Radar, ShieldCheck } from "lucide-react";

export default function Pairing() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl space-y-4 p-4 lg:p-6">
      <PageHeader title="Connect devices" subtitle="No PIN pairing is needed for a file share" icon={KeyRound} />

      <section className="bento-cell space-y-3 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          <h2 className="text-carved text-primary-ink text-xl">Connect to the same Conduit server</h2>
        </div>
        <p className="text-sm text-secondary-ink">
          Open Conduit on both devices and set the same sharing-server address in Settings. The devices then appear in Nearby and
          the Send page. Choose a receiver; they review the file list and accept before bytes are sent.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate("/nearby")} className="inline-flex items-center gap-2 rounded-lg border border-grid px-4 py-2.5 text-sm text-primary-ink">
            <Radar className="h-4 w-4" /> See online devices
          </button>
          <button onClick={() => navigate("/send")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink">
            <Link2 className="h-4 w-4" /> Send files
          </button>
        </div>
      </section>

      <p className="bento-cell p-4 text-sm text-secondary-ink">
        If the receiver is not already online, create a live share on the Send page. The sender displays a real QR code; only the receiver
        scans it. The QR contains a temporary live-session link, not a permanent pairing key.
      </p>
    </div>
  );
}
