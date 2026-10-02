import { PageHeader } from "@/pages/Devices";
import { Download, Github, Hammer, Smartphone, Globe, Server, ExternalLink } from "lucide-react";

const REPOSITORY = "https://github.com/mwala400/conduit";
const RELEASES = `${REPOSITORY}/releases`;
const APK = `${RELEASES}/latest/download/Conduit-Android-debug.apk`;

export default function BuildCenter() {
  return (
    <div className="max-w-4xl space-y-4 p-4 lg:p-6">
      <PageHeader title="Build and releases" subtitle="Actual artifacts produced by the GitHub Actions workflow" icon={Hammer} />

      <section className="bento-cell space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Github className="h-5 w-5 text-primary" />
          <h2 className="text-carved text-primary-ink text-xl">Automatic Android release</h2>
        </div>
        <p className="text-sm text-secondary-ink">
          Pushing a version tag that starts with <code>v</code> runs the Android release workflow. It tests signaling, builds the web app,
          creates the universal Android APK, and attaches the APK and a web/server ZIP to a GitHub Release.
        </p>
        <div className="rounded-lg bg-black/30 p-3 font-mono text-xs text-primary-ink">
          <div>git tag v0.1.0</div>
          <div>git push origin v0.1.0</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={APK} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink">
            <Download className="h-4 w-4" /> Latest Android APK
          </a>
          <a href={RELEASES} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-grid px-4 py-2.5 text-sm text-primary-ink">
            <ExternalLink className="h-4 w-4" /> GitHub Releases
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="bento-cell space-y-2 p-4">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-primary-ink">Android</h3>
          <p className="text-xs text-secondary-ink">A debug-signed APK is built on each release tag. CI debug keys change between runs, so installing an update may require uninstalling the prior build.</p>
        </article>
        <article className="bento-cell space-y-2 p-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-primary-ink">Web app</h3>
          <p className="text-xs text-secondary-ink">The release includes production web assets and the Node signaling server for self-hosting.</p>
        </article>
        <article className="bento-cell space-y-2 p-4">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-primary-ink">Other native packages</h3>
          <p className="text-xs text-secondary-ink">iOS, Windows, macOS, and Linux native installers are not configured. Those require platform-specific wrappers and signing.</p>
        </article>
      </section>

      <p className="bento-cell p-4 text-xs text-secondary-ink">
        GitHub Releases distribute builds; they do not host the live sharing/signaling service. Keep a Conduit server running on the same Wi-Fi for nearby device discovery, or deploy it behind public HTTPS for internet use.
      </p>
    </div>
  );
}
