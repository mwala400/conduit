import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/pages/Devices";
import { acceptShareRoom, joinShareRoom } from "@/lib/shareTransport";
import { formatBytes } from "@/lib/format";
import { localApi } from "@/api/localData";
import { Camera, Check, Download, File, QrCode, ShieldCheck, X } from "lucide-react";

export default function Receive() {
  const [searchParams, setSearchParams] = useSearchParams();
  const room = searchParams.get("room");
  const [session, setSession] = useState(null);
  const [files, setFiles] = useState([]);
  const [shareLink, setShareLink] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [status, setStatus] = useState(
    /** @type {{state: string, error?: string, fileName?: string, transferred?: number, totalSize?: number, completedFiles?: number}} */
    ({ state: "connecting-to-server" }),
  );
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [receiverConnection, setReceiverConnection] = useState(null);
  const transferLogged = useRef(false);
  const videoRef = useRef(null);
  const scanResult = useRef(null);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + (file.size || 0), 0),
    [files],
  );

  useEffect(() => {
    let active = true;
    let joinedSession;

    if (!room) {
      setStatus({ state: "waiting-for-link" });
      return undefined;
    }

    setError("");
    joinShareRoom(room, (update) => {
      if (!active) return;
      if (update.message?.type === "manifest" && Array.isArray(update.message.files)) {
        joinedSession.files = update.message.files;
        setFiles(update.message.files);
        setStatus({ state: "ready" });
      } else {
        setStatus((current) => update.message ? current : update);
        if (update.error) setError(update.error);
      }
    })
      .then((joined) => {
        joinedSession = joined;
        if (!active) joined.close();
        else setSession(joined);
      })
      .catch((joinError) => {
        if (active) {
          setError(joinError.message || "Could not connect to the sender.");
          setStatus({ state: "error" });
        }
      });

    return () => {
      active = false;
      joinedSession?.close();
    };
  }, [room]);

  useEffect(() => () => receiverConnection?.close(), [receiverConnection]);

  useEffect(() => {
    if (!scanning) return undefined;
    let active = true;
    let controls;
    if (!videoRef.current) return undefined;

    const startScanner = async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (!active) return;
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result || !active) return;
          active = false;
          controls?.stop();
          scanResult.current?.(result.getText());
        });
        if (!active) controls.stop();
      } catch (scanError) {
        if (!active) return;
        setScannerError(scanError.message || "Could not access the camera. Paste the share link instead.");
        setScanning(false);
      }
    };
    startScanner();

    return () => {
      active = false;
      controls?.stop();
    };
  }, [scanning]);

  useEffect(() => {
    if (status.state !== "complete" || transferLogged.current) return;
    transferLogged.current = true;
    localApi.entities.Transfer.create({
      name: files.length === 1 ? files[0].name : `${files.length} files`,
      direction: "receive",
      status: "completed",
      total_size: totalSize,
      transferred_size: totalSize,
      file_count: files.length,
      transport: "webrtc",
      encrypted: true,
      integrity_verified: false,
      completed_at: new Date().toISOString(),
    }).catch((logError) => {
      setError(logError.message || "Files arrived, but the local history could not be saved.");
    });
  }, [files, status.state, totalSize]);

  const accept = async () => {
    if (!session || accepted || !files.length) return;
    setAccepted(true);
    setError("");
    try {
      setReceiverConnection(await acceptShareRoom(session, setStatus));
    } catch (acceptError) {
      setAccepted(false);
      setError(acceptError.message || "Could not accept this transfer.");
    }
  };

  const reject = () => {
    receiverConnection?.close();
    session?.close();
    setSession(null);
    setStatus({ state: "rejected" });
  };

  const connectFromLink = () => {
    try {
      const value = shareLink.trim();
      const pastedUrl = /^[a-f0-9-]{20,64}$/i.test(value)
        ? null
        : new URL(value, location.origin);
      const roomCode = pastedUrl?.searchParams.get("room") || value;
      if (!/^[a-f0-9-]{20,64}$/i.test(roomCode)) {
        throw new Error("Paste a valid Conduit sharing link or transfer code.");
      }
      setError("");
      setSearchParams({ room: roomCode });
    } catch (linkError) {
      setError(linkError.message || "Paste a valid Conduit sharing link or transfer code.");
    }
  };

  scanResult.current = (value) => {
    setScanning(false);
    setScannerError("");
    setShareLink(value);
    try {
      const scannedUrl = new URL(value, location.origin);
      const roomCode = /^[a-f0-9-]{20,64}$/i.test(value) ? value : scannedUrl.searchParams.get("room");
      if (!roomCode || !/^[a-f0-9-]{20,64}$/i.test(roomCode)) {
        throw new Error("This QR code is not a Conduit share link.");
      }
      setError("");
      setSearchParams({ room: roomCode });
    } catch (scanError) {
      setError(scanError.message || "This QR code is not a Conduit share link.");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <PageHeader
        title="Receive files"
        subtitle="Review the files before accepting. Downloads start after you accept."
        icon={Download}
      />

      <section className="bento-cell p-5 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" />
          <h2 className="text-carved text-primary-ink text-xl">Private transfer request</h2>
        </div>

        {!room && (
          <div className="space-y-3">
            <p className="text-sm text-secondary-ink">Paste the sharing link or transfer code from the sender.</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setScannerError(""); setScanning(true); }}
                className="inline-flex items-center gap-2 rounded-lg border border-grid bg-white/5 px-3 py-2 text-sm text-primary-ink"
              >
                <Camera className="h-4 w-4" /> Scan QR on this device
              </button>
              <span className="self-center text-xs text-secondary-ink">The sender shows the QR; only the receiver scans it.</span>
            </div>
            {scanning && (
              <div className="space-y-2">
                <video ref={videoRef} className="w-full max-h-72 rounded-lg bg-black" muted playsInline />
                <button onClick={() => setScanning(false)} className="inline-flex items-center gap-2 rounded-lg border border-grid px-3 py-2 text-sm text-secondary-ink">
                  <X className="h-4 w-4" /> Stop camera
                </button>
              </div>
            )}
            {scannerError && <p className="text-sm text-destructive" role="alert">{scannerError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={shareLink}
                onChange={(event) => setShareLink(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") connectFromLink(); }}
                placeholder="Paste a Conduit link"
                aria-label="Conduit sharing link"
                className="flex-1 rounded-lg bg-white/5 border border-grid px-3 py-2 text-sm text-primary-ink"
              />
              <button onClick={connectFromLink} className="px-4 py-2 rounded-lg bg-success text-white font-semibold text-sm">
                <QrCode className="mr-1 inline h-4 w-4" /> Connect
              </button>
            </div>
          </div>
        )}

        {files.length ? (
          <>
            <div className="text-sm text-secondary-ink">{files.length} file(s) · {formatBytes(totalSize)}</div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-3 py-3">
                  <File className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-primary-ink break-all">{file.name}</div>
                    <div className="text-xs font-mono text-secondary-ink">{formatBytes(file.size)}</div>
                  </div>
                </div>
              ))}
            </div>
            {!accepted && status.state !== "rejected" && (
              <div className="flex gap-3 pt-2">
                <button onClick={accept} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-success text-white font-semibold text-sm">
                  <Check className="w-4 h-4" /> Accept and download
                </button>
                <button onClick={reject} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-grid text-secondary-ink font-semibold text-sm">
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-secondary-ink" role="status">
            {status.state === "rejected" ? "You declined this request." : room ? "Waiting for the sender to connect and list the files…" : "No active transfer yet."}
          </p>
        )}

        {accepted && status.state !== "complete" && (
          <div className="text-sm text-secondary-ink" role="status">
            {status.state === "connecting-to-sender" && "Connecting securely to the sender…"}
            {status.state === "transferring" && `Receiving ${status.fileName || "file"} · ${formatBytes(status.transferred || 0)} / ${formatBytes(status.totalSize || totalSize)}`}
            {status.state === "connected" && "Connected. Preparing the transfer…"}
            {status.state === "connecting" && "Connecting…"}
            {status.state === "file-saved" && `Saved ${status.fileName}.`}
            {status.state === "sender-disconnected" && "The sender disconnected. Ask them to make a new link."}
          </div>
        )}
        {status.state === "complete" && <div className="text-sm text-success" role="status">Transfer complete. Check your downloads folder.</div>}
        {status.error && <div className="text-sm text-destructive" role="alert">{status.error}</div>}
        {error && <div className="text-sm text-destructive" role="alert">{error}</div>}
      </section>

      <p className="max-w-3xl text-xs text-secondary-ink">
        The file data goes through an encrypted direct device connection when possible. If the network blocks that connection, the sender may need a configured TURN relay.
      </p>
    </div>
  );
}
