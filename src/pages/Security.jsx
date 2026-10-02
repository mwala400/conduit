import { useLocalNode } from "@/hooks/useLocalNode";
import { PageHeader } from "@/pages/Devices";
import { AlertTriangle, Fingerprint, Lock, ShieldCheck } from "lucide-react";

const notes = [
  {
    title: "Data in transit",
    body: "WebRTC encrypts data-channel traffic in transit using DTLS. The connection may be direct or may pass through a TURN relay; the signaling server does not store file contents.",
  },
  {
    title: "Receiver approval",
    body: "The receiver must review and accept a share or direct invitation before the transfer starts. Only accept files from a sender you recognize.",
  },
  {
    title: "Signaling and deployment",
    body: "The signaling service handles device presence and connection setup, including connection metadata. Use HTTPS/WSS for an internet-facing deployment and restrict access to the server.",
  },
  {
    title: "Share links and QR codes",
    body: "A share link or QR code grants access to its live session. Share it only with the intended receiver; it is not a verified identity credential.",
  },
];

export default function Security() {
  const node = useLocalNode();

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader title="Security" subtitle="Transport encryption and practical safety notes" icon={ShieldCheck} />

      <section className="bento-cell p-5">
        <div className="mb-3 flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-secondary-ink">This device</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-secondary-ink">Local device ID</span>
          <code className="max-w-full truncate rounded bg-black/20 px-2 py-1 font-mono text-sm text-primary-ink">{node?.id || "Loading…"}</code>
        </div>
        <p className="mt-3 text-xs text-secondary-ink">
          This ID helps distinguish devices in the app. It is not a cryptographic key or an independently verified identity.
        </p>
      </section>

      <section className="bento-cell space-y-4 p-5">
        {notes.map((note) => (
          <div key={note.title} className="flex items-start gap-3 border-b border-grid pb-3 last:border-0 last:pb-0">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-primary-ink">{note.title}</h2>
              <p className="mt-1 text-sm text-secondary-ink">{note.body}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="bento-cell flex items-start gap-3 p-5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm text-secondary-ink">
          Conduit does not currently provide custom cryptographic peer-identity verification, a device-pairing trust store,
          or a security audit claim. WebRTC encryption protects traffic in transit but does not prove that a displayed device
          name belongs to the person you expect.
        </p>
      </div>
    </div>
  );
}
