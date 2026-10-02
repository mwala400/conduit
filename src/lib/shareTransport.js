import { Capacitor, registerPlugin } from "@capacitor/core";

const CHUNK_SIZE = 64 * 1024;
const BUFFER_LIMIT = 1024 * 1024;
const DEFAULT_STUN_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];
/** @typedef {{state: string, error?: string, transferred?: number, totalSize?: number, fileName?: string, completedFiles?: number, message?: object}} ShareStatus */
/** @typedef {(status: ShareStatus) => void} StatusCallback */
const pendingFiles = [];
const activeHosts = new Map();
const nativeDownloads = registerPlugin("NativeDownloads");
const peerPresenceSubscribers = new Set();
let peerPresenceSocket = null;
let peerPresenceRetry = null;
let peerPresenceSnapshot = { state: "disconnected", peers: [] };
const buildSignalingUrl = /** @type {ImportMeta & {env?: {VITE_SIGNALING_URL?: string}}} */ (import.meta).env
  ?.VITE_SIGNALING_URL;

const signalingUrl = () => {
  const configured = localStorage.getItem("conduit.signaling_url") || buildSignalingUrl;
  if (configured) {
    const url = new URL(configured);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    if (!url.pathname || url.pathname === "/") url.pathname = "/signal";
    return url.toString();
  }
  if (Capacitor.isNativePlatform()) {
    throw new Error("Set your public Conduit server address in Settings before sharing.");
  }
  return `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/signal`;
};

const signalingHttpOrigin = () => {
  const url = new URL(signalingUrl());
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/";
  return url;
};

const getIceServers = async () => {
  try {
    const response = await fetch(new URL("/api/ice-servers", signalingHttpOrigin()), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`ICE configuration returned HTTP ${response.status}`);
    const servers = await response.json();
    return Array.isArray(servers) && servers.length ? servers : DEFAULT_STUN_SERVERS;
  } catch (error) {
    console.warn("Using public STUN servers; TURN fallback is not configured.", error);
    return DEFAULT_STUN_SERVERS;
  }
};

const connectSignaling = (room, role, onMessage, onStatus) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(signalingUrl());
    let joined = false;
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Could not reach the sharing server."));
    }, 15000);

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "join", room, role }));
    });
    socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        onStatus({ state: "error", error: "Invalid message from sharing server." });
        return;
      }
      if (message.type === "joined") {
        joined = true;
        clearTimeout(timeout);
        resolve(socket);
        onStatus({ state: "connected-to-server" });
      }
      Promise.resolve(onMessage(message)).catch((error) => {
        onStatus({ state: "error", error: error.message || "The sharing connection failed." });
      });
    });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Could not reach the sharing server. Check your connection and try again."));
    });
    socket.addEventListener("close", (event) => {
      clearTimeout(timeout);
      if (!joined) {
        reject(new Error(event.reason || "The sharing server rejected this link."));
      }
      if (event.code !== 1000) {
        onStatus({ state: "disconnected", error: event.reason || "Sharing connection closed." });
      }
    });
  });

const sendSignal = (socket, type, payload = {}) => {
  if (socket.readyState !== WebSocket.OPEN) throw new Error("The sharing connection is no longer active.");
  socket.send(JSON.stringify({ type, ...payload }));
};

const waitForBuffer = (channel) => {
  if (channel.bufferedAmount <= BUFFER_LIMIT) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      channel.removeEventListener("bufferedamountlow", onLow);
      reject(new Error("Transfer paused because the receiver is not keeping up."));
    }, 30000);
    const onLow = () => {
      clearTimeout(timeout);
      resolve();
    };
    channel.addEventListener("bufferedamountlow", onLow, { once: true });
  });
};

const sendFiles = async (channel, files, onProgress) => {
  let transferred = 0;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  channel.bufferedAmountLowThreshold = BUFFER_LIMIT / 2;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    channel.send(JSON.stringify({
      type: "file-start",
      index,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    }));
    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      await waitForBuffer(channel);
      const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
      channel.send(chunk);
      transferred += chunk.byteLength;
      onProgress({ transferred, totalSize, fileName: file.name });
    }
    channel.send(JSON.stringify({ type: "file-end", index }));
  }
  channel.send(JSON.stringify({ type: "transfer-complete" }));
};

const downloadFile = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const stageFilesForSend = (files) => {
  pendingFiles.splice(0, pendingFiles.length, ...files);
};

export const takeStagedFiles = () => pendingFiles.splice(0, pendingFiles.length);

export const getSignalingServerAddress = () => {
  const configured = localStorage.getItem("conduit.signaling_url") || buildSignalingUrl;
  if (!configured) return "";
  const url = new URL(configured);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.origin;
};

const peerIdentity = () => {
  let peerId = localStorage.getItem("conduit.peer_id");
  if (!/^[a-f0-9]{32}$/i.test(peerId || "")) {
    peerId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("conduit.peer_id", peerId);
  }
  const platform = Capacitor.isNativePlatform()
    ? (Capacitor.getPlatform() === "android" ? "Android" : "iOS")
    : (/Windows/i.test(navigator.userAgent) ? "Windows"
      : /Macintosh|Mac OS/i.test(navigator.userAgent) ? "macOS"
        : /Linux/i.test(navigator.userAgent) ? "Linux" : "Web");
  const name = localStorage.getItem("conduit.device_name") || `${platform} · ${peerId.slice(0, 4).toUpperCase()}`;
  return { peerId, name, platform };
};

const notifyPeerPresence = (event = {}) => {
  for (const subscriber of peerPresenceSubscribers) subscriber({ ...peerPresenceSnapshot, ...event });
};

const setPeerPresence = (update) => {
  peerPresenceSnapshot = { ...peerPresenceSnapshot, ...update };
  notifyPeerPresence();
};

const connectPeerPresence = () => {
  if (!peerPresenceSubscribers.size || peerPresenceSocket?.readyState === WebSocket.CONNECTING ||
    peerPresenceSocket?.readyState === WebSocket.OPEN) return;
  const socket = new WebSocket(signalingUrl());
  peerPresenceSocket = socket;
  setPeerPresence({ state: "connecting", peers: [] });

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "register-peer", ...peerIdentity() }));
  });
  socket.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      notifyPeerPresence({ error: "The sharing server sent an invalid peer message." });
      return;
    }
    if (message.type === "peer-list" && Array.isArray(message.peers)) {
      setPeerPresence({ state: "connected", peers: message.peers });
    } else if (message.type === "incoming-invite") {
      notifyPeerPresence({ incomingInvite: message });
    } else if (message.type === "invite-declined") {
      notifyPeerPresence({ message });
    } else if (message.type === "error") {
      notifyPeerPresence({ error: message.message || "The sharing server rejected the request." });
    }
  });
  socket.addEventListener("error", () => {
    if (peerPresenceSocket === socket) setPeerPresence({ state: "disconnected", peers: [] });
  });
  socket.addEventListener("close", () => {
    if (peerPresenceSocket !== socket) return;
    peerPresenceSocket = null;
    setPeerPresence({ state: "disconnected", peers: [] });
    if (peerPresenceSubscribers.size) {
      peerPresenceRetry = setTimeout(connectPeerPresence, 3000);
    }
  });
};

/**
 * @param {(snapshot: {state: string, peers: Array<{peerId: string, name: string, platform: string}>, incomingInvite?: object, message?: object, error?: string}) => void} listener
 */
export const subscribeToPeerPresence = (listener) => {
  peerPresenceSubscribers.add(listener);
  listener(peerPresenceSnapshot);
  if (peerPresenceRetry) clearTimeout(peerPresenceRetry);
  connectPeerPresence();
  return () => {
    peerPresenceSubscribers.delete(listener);
    if (peerPresenceSubscribers.size) return;
    if (peerPresenceRetry) clearTimeout(peerPresenceRetry);
    peerPresenceRetry = null;
    const socket = peerPresenceSocket;
    peerPresenceSocket = null;
    peerPresenceSnapshot = { state: "disconnected", peers: [] };
    socket?.close(1000, "No active Conduit screens");
  };
};

export const inviteNearbyPeer = (peerId, room) => {
  if (!peerPresenceSocket || peerPresenceSocket.readyState !== WebSocket.OPEN) {
    throw new Error("Connect this device to the sharing server before sending directly.");
  }
  peerPresenceSocket.send(JSON.stringify({ type: "invite-peer", targetPeerId: peerId, room }));
};

export const declinePeerInvite = (senderPeerId, room) => {
  if (peerPresenceSocket?.readyState !== WebSocket.OPEN) return;
  peerPresenceSocket.send(JSON.stringify({ type: "decline-invite", senderPeerId, room }));
};

/**
 * @param {File[]} files
 * @param {StatusCallback} onStatus
 */
export async function createShareRoom(files, onStatus = () => {}) {
  if (!files.length) throw new Error("Choose at least one file first.");
  const random = crypto.getRandomValues(new Uint8Array(16));
  const room = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
  let peerConnection;
  let dataChannel;
  let remoteDescriptionSet = false;
  const candidates = [];
  let closed = false;

  const socket = await connectSignaling(
    room,
    "sender",
    async (message) => {
      if (message.type === "peer-joined") {
        sendSignal(socket, "manifest", {
          files: files.map(({ name, size, type }) => ({
            name,
            size,
            type: type || "application/octet-stream",
          })),
        });
        onStatus({ state: "receiver-connected" });
      }
      if (message.type === "accept") {
        try {
          const iceServers = await getIceServers();
          peerConnection = new RTCPeerConnection({ iceServers });
          peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) sendSignal(socket, "signal", { signal: { candidate } });
          };
          peerConnection.onconnectionstatechange = () => {
            onStatus({ state: peerConnection.connectionState });
          };
          dataChannel = peerConnection.createDataChannel("conduit-files", { ordered: true });
          dataChannel.onopen = () => {
            onStatus({ state: "transferring" });
            sendFiles(dataChannel, files, (progress) => onStatus({ state: "transferring", ...progress }))
              .then(() => onStatus({ state: "complete", transferred: files.reduce((sum, file) => sum + file.size, 0) }))
              .catch((error) => onStatus({ state: "error", error: error.message }));
          };
          dataChannel.onerror = () => onStatus({ state: "error", error: "The file connection failed." });
          await peerConnection.setLocalDescription(await peerConnection.createOffer());
          sendSignal(socket, "signal", { signal: { description: peerConnection.localDescription } });
          onStatus({ state: "connecting-to-device" });
        } catch (error) {
          onStatus({ state: "error", error: error.message });
        }
      }
      if (message.type === "signal" && peerConnection) {
        if (message.signal.description) {
          await peerConnection.setRemoteDescription(message.signal.description);
          remoteDescriptionSet = true;
          for (const candidate of candidates.splice(0)) await peerConnection.addIceCandidate(candidate);
        }
        if (message.signal.candidate) {
          if (remoteDescriptionSet) await peerConnection.addIceCandidate(message.signal.candidate);
          else candidates.push(message.signal.candidate);
        }
      }
      if (message.type === "peer-left") onStatus({ state: "receiver-disconnected" });
      if (message.type === "error") onStatus({ state: "error", error: message.message });
    },
    onStatus,
  );

  const session = {
    room,
    url: `${getSignalingServerAddress() || location.origin}/receive?room=${encodeURIComponent(room)}`,
    close() {
      if (closed) return;
      closed = true;
      peerConnection?.close();
      dataChannel?.close();
      socket.close(1000, "Sender ended the share");
      activeHosts.delete(room);
    },
  };
  activeHosts.set(room, session);
  return session;
}

/**
 * @param {string} room
 * @param {StatusCallback} onStatus
 */
export async function joinShareRoom(room, onStatus = () => {}) {
  if (!/^[a-f0-9-]{20,64}$/i.test(room)) throw new Error("This share link is invalid.");
  const socket = await connectSignaling(
    room,
    "receiver",
    (message) => {
      if (message.type === "peer-left") onStatus({ state: "sender-disconnected" });
      if (message.type === "error") onStatus({ state: "error", error: message.message });
      onStatus({ state: "message", message });
    },
    onStatus,
  );
  return {
    socket,
    room,
    close() {
      socket.close(1000, "Receiver left the share");
    },
  };
}

/**
 * @param {{socket: WebSocket, files?: Array<{size: number}> , close: () => void}} session
 * @param {StatusCallback} onStatus
 */
export async function acceptShareRoom(session, onStatus = () => {}) {
  const iceServers = await getIceServers();
  const peerConnection = new RTCPeerConnection({ iceServers });
  /** @type {{name: string, mimeType: string, size: number, received: number, chunks: ArrayBuffer[], nativeId?: string} | null} */
  let receivingFile = null;
  let completedFiles = 0;
  let receivedBytes = 0;
  let totalSize = 0;
  let remoteDescriptionSet = false;
  const candidates = [];

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) sendSignal(session.socket, "signal", { signal: { candidate } });
  };
  peerConnection.onconnectionstatechange = () => {
    onStatus({ state: peerConnection.connectionState });
  };
  peerConnection.ondatachannel = ({ channel }) => {
    channel.binaryType = "arraybuffer";
    let messageQueue = Promise.resolve();
    channel.onmessage = ({ data }) => {
      messageQueue = messageQueue.then(async () => {
      if (typeof data !== "string") {
        if (!receivingFile) return;
        if (Capacitor.getPlatform() === "android") {
          const bytes = new Uint8Array(data);
          let binary = "";
          for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
          await nativeDownloads.appendFile({
            id: receivingFile.nativeId,
            data: btoa(binary),
          });
        } else {
          receivingFile.chunks.push(data);
        }
        receivingFile.received += data.byteLength;
        receivedBytes += data.byteLength;
        onStatus({
          state: "transferring",
          transferred: receivedBytes,
          totalSize,
          fileName: receivingFile.name,
        });
        return;
      }

      let message;
      try {
        message = JSON.parse(data);
      } catch {
        onStatus({ state: "error", error: "The sender sent an invalid file record." });
        return;
      }
      if (message.type === "file-start") {
        receivingFile = { name: message.name, mimeType: message.mimeType, size: message.size, received: 0, chunks: [] };
        if (Capacitor.getPlatform() === "android") {
          const created = await nativeDownloads.startFile({
            name: message.name,
            mimeType: message.mimeType,
          });
          receivingFile.nativeId = created.id;
        }
        totalSize = session.files?.reduce((sum, file) => sum + file.size, 0) || message.size;
        onStatus({ state: "transferring", fileName: message.name, transferred: receivedBytes, totalSize });
      }
      if (message.type === "file-end" && receivingFile) {
        if (Capacitor.getPlatform() === "android") {
          await nativeDownloads.finishFile({ id: receivingFile.nativeId });
        } else {
          downloadFile(new Blob(receivingFile.chunks, { type: receivingFile.mimeType }), receivingFile.name);
        }
        completedFiles += 1;
        onStatus({ state: "file-saved", fileName: receivingFile.name, completedFiles });
        receivingFile = null;
      }
      if (message.type === "transfer-complete") onStatus({ state: "complete", transferred: receivedBytes, totalSize });
      }).catch((error) => {
        onStatus({ state: "error", error: error.message || "Could not save the received file." });
      });
    };
    channel.onerror = () => onStatus({ state: "error", error: "Receiving the file failed." });
  };

  session.socket.addEventListener("message", async (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type !== "signal") return;
    try {
      if (message.signal.description) {
        await peerConnection.setRemoteDescription(message.signal.description);
        remoteDescriptionSet = true;
        for (const candidate of candidates.splice(0)) await peerConnection.addIceCandidate(candidate);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal(session.socket, "signal", { signal: { description: peerConnection.localDescription } });
      }
      if (message.signal.candidate) {
        if (remoteDescriptionSet) await peerConnection.addIceCandidate(message.signal.candidate);
        else candidates.push(message.signal.candidate);
      }
    } catch (error) {
      onStatus({ state: "error", error: `Could not connect to sender: ${error.message}` });
    }
  });

  sendSignal(session.socket, "accept");
  onStatus({ state: "connecting-to-sender" });
  return {
    close() {
      peerConnection.close();
      session.close();
    },
  };
}
