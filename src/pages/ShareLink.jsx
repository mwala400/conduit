import { Link } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { ArrowRight, Link as LinkIcon, ShieldCheck } from "lucide-react";

export default function ShareLink() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader
        title="Share by link"
        subtitle="Share a live transfer invitation with someone on the same Wi-Fi or far away."
        icon={LinkIcon}
      />
      <section className="bento-cell p-5 max-w-2xl space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <p className="text-sm text-secondary-ink">
            The link connects the recipient to your open sender page. The recipient can review the filenames and accept before anything is sent.
          </p>
        </div>
        <Link
          to="/send"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-ink hover:opacity-90"
        >
          Choose files and create link <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-secondary-ink">
          This is a live link, not cloud storage: the sender must stay online until the transfer finishes.
        </p>
      </section>
    </div>
  );
}
