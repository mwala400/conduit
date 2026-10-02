import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { BookOpen, Download, Link2, Radar, Send, ShieldCheck } from "lucide-react";

const steps = [
  {
    title: "Connect both devices to the same Conduit server",
    body: "On the same Wi-Fi, run the Conduit server on one computer and enter its address in Settings on both devices. Keep that computer and server running during the transfer.",
  },
  {
    title: "Choose how to connect",
    body: "If the receiver is online, choose the device on Nearby or Send. Otherwise create a share on Send and show its QR code; the receiver opens Receive and scans it. You can also share the temporary link or code.",
  },
  {
    title: "Review and accept the files",
    body: "The receiver reviews the incoming file list and accepts the share before the transfer begins.",
  },
  {
    title: "Keep both devices online until it finishes",
    body: "Files travel over a WebRTC data channel when the connection succeeds. Conduit servers exchange connection setup messages; they do not store the file contents. Difficult networks may need TURN configured on the server.",
  },
];

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl space-y-4 p-4 lg:p-6">
      <PageHeader title="File sharing guide" subtitle="Connect, choose a receiver, and accept the transfer" icon={BookOpen} />

      <section className="bento-cell p-5">
        <h2 className="mb-2 text-xl font-bold text-primary-ink">What you need</h2>
        <p className="text-sm leading-relaxed text-secondary-ink">
          Conduit is a browser-based file-sharing app with an Android app. Both devices need internet or network access to the same
          running Conduit signaling server. The server helps devices find each other and negotiate the connection; file bytes are sent
          through WebRTC and are not saved by the signaling server.
        </p>
      </section>

      <ol className="bento-cell space-y-4 p-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-primary">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-primary-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-secondary-ink">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bento-cell p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-primary-ink"><Send className="h-4 w-4 text-primary" /> Send</h2>
          <p className="text-sm text-secondary-ink">Choose files on Send, then select an online device or create a QR/link share for the receiver.</p>
        </section>
        <section className="bento-cell p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-primary-ink"><Download className="h-4 w-4 text-primary" /> Receive</h2>
          <p className="text-sm text-secondary-ink">Open Receive to scan a sender&apos;s QR code, enter a share code, or review an incoming direct invitation.</p>
        </section>
      </div>

      <section className="bento-cell p-5">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-primary-ink"><ShieldCheck className="h-4 w-4 text-primary" /> A few important details</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-secondary-ink">
          <li>Nearby devices appear only while Conduit is open and connected to the same signaling server.</li>
          <li>Android app supports Native Bluetooth, Wi-Fi Direct, and Installed App (APK) sharing; Web clients use WebRTC P2P.</li>
          <li>QR sharing is one-way: the sender displays the QR and the receiver scans it. Camera scanning requires permission.</li>
          <li>Share links and codes are for a live session, not offline delivery. Keep the sender connected until the transfer completes.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate("/nearby")} className="inline-flex items-center gap-2 rounded-lg border border-grid px-4 py-2.5 text-sm text-primary-ink">
          <Radar className="h-4 w-4" /> Find devices
        </button>
        <button onClick={() => navigate("/send")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink">
          <Link2 className="h-4 w-4" /> Start sharing
        </button>
      </div>
    </div>
  );
}
