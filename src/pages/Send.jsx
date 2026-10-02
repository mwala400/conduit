import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/pages/Devices";
import { formatBytes } from "@/lib/format";
import { createShareRoom, inviteNearbyPeer, stageFilesForSend, subscribeToPeerPresence, takeStagedFiles } from "@/lib/shareTransport";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, File as FileIcon, Folder, Link as LinkIcon, Send as SendIcon, Upload, X, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Send() {
  const [selectedFiles, setSelectedFiles] = useState(() => takeStagedFiles());
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);
  const [share, setShare] = useState(null);
  const [status, setStatus] = useState({ state: "idle" });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [directPeer, setDirectPeer] = useState(null);
  const [presence, setPresence] = useState({ state: "connecting", peers: [] });
  const shareRoom = useRef(null);

  const totalSize = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0),
    [selectedFiles],
  );

  const onPickFiles = (fileList) => {
    setSelectedFiles((current) => [...current, ...Array.from(fileList || [])]);
    setShare(null);
    setError("");
  };

  const createLink = async () => {
    if (!selectedFiles.length || creating) return;
    setCreating(true);
    setError("");
    try {
      const session = await createShareRoom(selectedFiles, setStatus);
      setShare(session);
      await navigator.clipboard?.writeText(session.url).catch(() => {});
    } catch (err) {
      setError(err.message || "Could not create a share link.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy was blocked. Select and copy the link shown below.");
    }
  };

  const closeShare = () => {
    share?.close();
    setShare(null);
    setStatus({ state: "idle" });
  };

  useEffect(() => () => share?.close(), [share]);

  useEffect(() => {
    stageFilesForSend(selectedFiles);
  }, [selectedFiles]);

  useEffect(() => subscribeToPeerPresence((snapshot) => {
    setPresence(snapshot);
    if (snapshot.error) setError(snapshot.error);
    if (snapshot.message?.room === shareRoom.current && snapshot.message.type === "invite-declined") {
      setStatus({ state: "declined" });
    }
  }), []);

  useEffect(() => {
    shareRoom.current = share?.room || null;
  }, [share]);

  const sendToPeer = async (peer) => {
    if (!selectedFiles.length || creating) return;
    setCreating(true);
    setError("");
    let session;
    try {
      session = await createShareRoom(selectedFiles, setStatus);
      inviteNearbyPeer(peer.peerId, session.room);
      setShare(session);
      setDirectPeer(peer.name);
      setStatus({ state: "waiting-for-peer" });
    } catch (sendError) {
      session?.close();
      setError(sendError.message || "Could not invite this device.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader
        title="Send files"
        subtitle="Create a private link. The recipient opens it and accepts before any file is sent."
        icon={SendIcon}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => { event.preventDefault(); setDragOver(false); onPickFiles(event.dataTransfer.files); }}
            className={cn(
              "bento-cell p-8 flex flex-col items-center justify-center text-center min-h-[200px] transition-colors",
              dragOver && "border-primary glow-primary bg-primary/5",
            )}
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div className="font-display font-bold text-primary-ink mb-1">Select files to send</div>
            <p className="text-sm text-secondary-ink mb-4">Choose files, or drop them here. They travel directly between devices when the network permits.</p>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-ink font-semibold text-sm cursor-pointer hover:opacity-90">
                <FileIcon className="w-4 h-4" /> Browse files
                <input type="file" multiple className="hidden" onChange={(event) => onPickFiles(event.target.files)} />
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-grid text-sm text-primary-ink cursor-pointer hover:bg-white/10">
                <Folder className="w-4 h-4" /> Choose folder
                <input type="file" webkitdirectory="" multiple className="hidden" onChange={(event) => onPickFiles(event.target.files)} />
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bento-cell p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">
                  {selectedFiles.length} file(s) · {formatBytes(totalSize)}
                </span>
                <button onClick={() => { setSelectedFiles([]); closeShare(); }} className="text-xs text-secondary-ink hover:text-destructive">
                  Clear files
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-border">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-3 py-2">
                    <FileIcon className="w-4 h-4 text-secondary-ink shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-primary-ink truncate">{file.name}</div>
                      <div className="text-xs font-mono text-secondary-ink">{formatBytes(file.size)} · {file.type || "file"}</div>
                    </div>
                    <button
                      aria-label={`Remove ${file.name}`}
                      onClick={() => { setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); closeShare(); }}
                      className="text-secondary-ink hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bento-cell p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Send without a link</span>
            </div>
            <p className="text-sm text-secondary-ink">
              Both devices must be online in Conduit and connected to the same sharing server.
            </p>
            {presence.state !== "connected" ? (
              <p className="text-xs text-secondary-ink" role="status">Connecting to the sharing server… Check Settings if this takes too long.</p>
            ) : presence.peers.length ? (
              <div className="space-y-2">
                {presence.peers.map((peer) => (
                  <button
                    key={peer.peerId}
                    onClick={() => sendToPeer(peer)}
                    disabled={!selectedFiles.length || creating || Boolean(share)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg border border-grid bg-white/5 px-3 py-2.5 text-left hover:bg-white/10 disabled:opacity-40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-primary-ink">{peer.name}</span>
                      <span className="text-xs text-secondary-ink">{peer.platform} · online</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-primary">{creating ? "Inviting…" : "Send"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-secondary-ink" role="status">No other Conduit devices are online on this server yet.</p>
            )}
            {!selectedFiles.length && <p className="text-xs text-secondary-ink">Choose files first to send directly.</p>}
          </div>

          <div className="bento-cell p-5 space-y-3">
            <div className="font-mono text-xs text-secondary-ink uppercase tracking-wider">Share by link or QR</div>
            {!share ? (
              <>
                <p className="text-sm text-secondary-ink">Keep this page open while the other person opens your link and accepts the transfer.</p>
                <button
                  onClick={createLink}
                  disabled={!selectedFiles.length || creating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-ink font-semibold text-sm hover:opacity-90 disabled:opacity-40"
                >
                  <LinkIcon className="w-4 h-4" /> {creating ? "Connecting…" : "Create secure link"}
                </button>
              </>
            ) : directPeer ? (
              <>
                <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary-ink" role="status">
                  Invitation sent to {directPeer}. Waiting for them to review and accept.
                </div>
                {status.state === "transferring" && (
                  <p className="text-sm text-secondary-ink">Sending {status.fileName || "file"} · {formatBytes(status.transferred || 0)} / {formatBytes(status.totalSize || totalSize)}</p>
                )}
                {status.state === "complete" && <p className="text-sm text-success">Transfer complete.</p>}
                {status.state === "declined" && <p className="text-sm text-secondary-ink">The recipient declined this share.</p>}
                <button onClick={closeShare} className="w-full px-4 py-2 rounded-lg border border-grid text-sm text-secondary-ink hover:text-destructive">
                  Stop sharing
                </button>
              </>
            ) : (
              <>
                <input
                  aria-label="Share link"
                  readOnly
                  value={share.url}
                  onFocus={(event) => event.target.select()}
                  className="w-full rounded-lg bg-white/5 border border-grid px-3 py-2 text-xs font-mono text-primary-ink"
                />
                <button onClick={copyLink} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-ink font-semibold text-sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
                <div className="flex justify-center rounded-lg bg-white p-3">
                  <QRCodeSVG value={share.url} size={208} level="M" marginSize={2} title="Scan to open this Conduit share" />
                </div>
                <p className="text-center text-xs text-secondary-ink">Scan this QR on the receiving device, or copy the link.</p>
                <div className="text-sm text-secondary-ink" role="status">
                  {status.state === "receiver-connected" && "Recipient opened the link. Waiting for them to accept…"}
                  {status.state === "connecting-to-device" && "Connecting securely to the recipient…"}
                  {status.state === "transferring" && `Sending ${status.fileName || "file"} · ${formatBytes(status.transferred || 0)} / ${formatBytes(status.totalSize || totalSize)}`}
                  {status.state === "complete" && "Transfer complete."}
                  {status.state === "connected-to-server" && "Link ready. Waiting for the recipient…"}
                  {status.state === "connecting" && "Connecting…"}
                  {status.state === "connectionState" && status.connectionState}
                </div>
                <button onClick={closeShare} className="w-full px-4 py-2 rounded-lg border border-grid text-sm text-secondary-ink hover:text-destructive">
                  Stop sharing
                </button>
              </>
            )}
            {error && <div className="text-sm text-destructive" role="alert">{error}</div>}
            {status.error && <div className="text-sm text-destructive" role="alert">{status.error}</div>}
          </div>

          <div className="bento-cell p-4 text-sm text-secondary-ink space-y-2">
            <p><strong className="text-primary-ink">Nearby:</strong> choose an online Conduit device above to send without copying a link.</p>
            <p><strong className="text-primary-ink">Far away:</strong> the sharing server must be hosted on a public HTTPS address. TURN configuration is needed for some restrictive networks.</p>
            <p>The receiver must open the link while this page is still open. The sharing server forwards connection setup only, not the file bytes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
