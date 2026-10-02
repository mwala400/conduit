import { PageHeader } from "@/pages/Devices";
import { AlertTriangle, Cable, CheckCircle2, Info, Network, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-4xl space-y-4 p-4 lg:p-6">
      <PageHeader title="About" subtitle="How Conduit works today" icon={Info} />

      <section className="bento-cell p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Cable className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-ink">CONDUIT</div>
            <div className="font-mono text-xs uppercase tracking-widest text-secondary-ink">WebRTC file sharing</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-secondary-ink">
          Conduit sends files between devices using a WebRTC data channel. A Conduit signaling server is needed to discover
          online devices and exchange connection setup messages. The signaling server does not save the shared file contents.
          A TURN service may relay encrypted WebRTC traffic when a direct connection cannot be established.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bento-cell p-5">
          <div className="mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">Connection flow</span>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-sm text-secondary-ink">
            <li>Devices connect to the same Conduit signaling server.</li>
            <li>The receiver reviews and accepts a share or direct invitation.</li>
            <li>WebRTC negotiates the data connection, using STUN and optional TURN configuration.</li>
            <li>Files are transferred while both devices stay connected.</li>
          </ol>
        </section>

        <section className="bento-cell p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">Data and privacy</span>
          </div>
          <ul className="space-y-2 text-sm text-secondary-ink">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> File contents are not stored by the signaling server.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> The app keeps local settings and history in the device browser/app storage.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> WebRTC encrypts its data channel in transit.</li>
          </ul>
        </section>
      </div>

      <section className="bento-cell p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">Platform capabilities</span>
        </div>
        <ul className="list-inside list-disc space-y-2 text-sm text-secondary-ink">
          <li><strong>Android APK:</strong> Supports Native Bluetooth sharing, Native Wi-Fi Direct / Quick Share, and Installed App (APK) extraction and sharing.</li>
          <li><strong>Cross-Platform Web:</strong> Works in any modern browser on Windows, macOS, Linux, and iOS.</li>
          <li><strong>Online Discovery:</strong> Allows nearby WebRTC device discovery without links when both devices are on the same Conduit server.</li>
          <li><strong>Security:</strong> Direct device-to-device encrypted transmission with end-to-end privacy.</li>
        </ul>
      </section>
    </div>
  );
}
