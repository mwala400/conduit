import { Download, Github, Globe, Laptop, QrCode, Server, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { PageHeader } from "@/pages/Devices";

const REPOSITORY = "https://github.com/mwala400/conduit";
const RELEASES = `${REPOSITORY}/releases`;
const ANDROID_APK = `${RELEASES}/latest/download/Conduit-Android-debug.apk`;

const CLIENTS = [
  {
    name: "Android",
    icon: Smartphone,
    status: "APK build",
    description: "Install the Android APK to share installed apps (APKs), photos, and files via Native Bluetooth, Wi-Fi Direct, or WebRTC.",
  },
  {
    name: "iPhone and iPad",
    icon: Smartphone,
    status: "Use a browser",
    description: "Open the Conduit web address in Safari. A native iOS app is not published; installing one requires an Apple-signed iOS build.",
  },
  {
    name: "Windows, macOS, and Linux",
    icon: Laptop,
    status: "Use a browser",
    description: "Open the Conduit web address in a current browser. Native desktop installers are not built by this project yet.",
  },
];

export default function Install() {
  return (
    <div className="max-w-5xl space-y-4 p-4 lg:p-6">
      <PageHeader title="Install and connect" subtitle="Use the Android app or open Conduit in a browser on any device" icon={Download} />

      <section className="bento-cell space-y-3 border-primary/20 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" />
          <h2 className="text-carved text-primary-ink text-xl">Which devices need Conduit?</h2>
        </div>
        <p className="text-sm text-secondary-ink">
          Both people need Conduit open, but they do not both need an installed app. Android can use the APK; iPhone, Windows,
          macOS, and Linux can use the web app in a browser. For link-free nearby sending, both devices must be online on the same
          Conduit sharing server.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {CLIENTS.map(({ name, icon: Icon, status, description }) => (
          <article key={name} className="bento-cell space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="text-primary-ink font-semibold">{name}</h3>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-primary">{status}</div>
            <p className="text-sm text-secondary-ink">{description}</p>
          </article>
        ))}
      </section>

      <section className="bento-cell space-y-3 p-5">
        <h2 className="text-carved text-primary-ink text-xl">Android download</h2>
        <p className="text-sm text-secondary-ink">
          The Android debug APK is attached to GitHub Releases by the release workflow. Android accepts APK installs when you allow
          installation from the browser or file manager that opened the APK.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={ANDROID_APK}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink"
          >
            <Download className="h-4 w-4" /> Download latest Android APK
          </a>
          <a href={RELEASES} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-grid px-4 py-2.5 text-sm text-primary-ink">
            View all releases
          </a>
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-grid px-4 py-2.5 text-sm text-primary-ink">
            <Github className="h-4 w-4" /> Source code
          </a>
        </div>
        <p className="text-xs text-secondary-ink">
          This is a sideloadable debug APK, not a Play Store release. Later builds need a stable signing key to install as in-place
          updates over earlier releases.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="bento-cell space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            <h2 className="text-carved text-primary-ink text-xl">Send without a link</h2>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-sm text-secondary-ink">
            <li>Run the Conduit server on a computer or server device on the Wi-Fi network.</li>
            <li>Connect every device to that same server; on Android set its address in Settings.</li>
            <li>Choose files, select an online device, then have the receiver accept.</li>
          </ol>
          <p className="text-xs text-secondary-ink">Conduit keeps the online-device list temporarily in server memory; it does not need a database.</p>
        </article>

        <article className="bento-cell space-y-3 p-5">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <h2 className="text-carved text-primary-ink text-xl">Share by QR or link</h2>
          </div>
          <p className="text-sm text-secondary-ink">
            For a person who is not already online in Conduit, the sender can show a QR code or copy a live share link. Only the
            receiving device scans the QR. The sender must stay connected until the transfer finishes.
          </p>
          <p className="text-xs text-secondary-ink">QR camera scanning needs camera permission and a secure page (HTTPS, or the installed Android app).</p>
        </article>
      </section>

      <section className="bento-cell space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h2 className="text-carved text-primary-ink text-xl">The server and network requirement</h2>
        </div>
        <p className="text-sm text-secondary-ink">
          GitHub stores the source code and downloadable releases; it is not the file-sharing server. For nearby use, one computer
          on the Wi-Fi must run Conduit and stay on. For sharing over the internet, host Conduit behind a public HTTPS address.
          A TURN relay may be needed on networks that block direct device connections.
        </p>
        <div className="rounded-lg bg-black/30 p-3 font-mono text-xs text-primary-ink">
          Build once: <code>npm run build</code> · Start the server: <code>npm start</code> · Default server port: <code>8787</code>
        </div>
        <p className="text-xs text-secondary-ink">
          Files travel over the encrypted device-to-device connection when possible. The server handles device discovery and connection
          setup; it does not store uploaded files or provide offline delivery.
        </p>
        <div className="flex items-center gap-2 text-xs text-secondary-ink">
          <Globe className="h-4 w-4 text-primary" /> If a device is not online on the shared server, use a QR/link while the sender is online.
        </div>
      </section>
    </div>
  );
}
