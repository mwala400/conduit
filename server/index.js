import { createHmac, randomUUID } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import WebSocket, { WebSocketServer } from "ws";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8787);
const publicRoot = resolve("dist");
const rooms = new Map();
const peers = new Map();
const peerIdPattern = /^[a-f0-9]{32}$/i;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

const iceServers = () => {
  const servers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const urls = (process.env.TURN_URLS || "").split(",").map((url) => url.trim()).filter(Boolean);
  const secret = process.env.TURN_SHARED_SECRET;

  if (urls.length && secret) {
    const expires = Math.floor(Date.now() / 1000) + 5 * 60;
    const username = `${expires}:${randomUUID()}`;
    const credential = createHmac("sha1", secret).update(username).digest("base64");
    servers.push({ urls, username, credential });
  }

  return servers;
};

const broadcastPeerLists = () => {
  const connectedPeers = [...peers.values()].map(({ peerId, name, platform }) => ({ peerId, name, platform }));
  for (const peer of peers.values()) {
    if (peer.socket.readyState === WebSocket.OPEN) {
      peer.socket.send(JSON.stringify({
        type: "peer-list",
        peers: connectedPeers.filter((connectedPeer) => connectedPeer.peerId !== peer.peerId),
      }));
    }
  }
};

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && requestUrl.pathname === "/api/ice-servers") {
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify(iceServers()));
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  if (!existsSync(publicRoot)) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build the frontend with npm run build before starting the production server.");
    return;
  }

  const requestedPath = decodeURIComponent(requestUrl.pathname);
  let filePath = resolve(publicRoot, `.${requestedPath}`);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${sep}`)) {
    response.writeHead(400);
    response.end();
    return;
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = resolve(filePath, "index.html");
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = resolve(publicRoot, "index.html");
  }
  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end();
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(filePath).pipe(response);
  }
});

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname;
  if (pathname !== "/signal") {
    socket.destroy();
    return;
  }
  webSockets.handleUpgrade(request, socket, head, (webSocket) => {
    webSockets.emit("connection", webSocket, request);
  });
});

webSockets.on("connection", (webSocket) => {
  let participant;

  webSocket.on("message", (buffer) => {
    let message;
    try {
      message = JSON.parse(buffer.toString());
    } catch {
      webSocket.close(1007, "Invalid message");
      return;
    }

    if (!participant && message.type === "register-peer") {
      if (!peerIdPattern.test(message.peerId || "")) {
        webSocket.close(1008, "Invalid peer identity");
        return;
      }
      const peerId = message.peerId.toLowerCase();
      const name = typeof message.name === "string"
        ? message.name.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 48) || "Conduit device"
        : "Conduit device";
      const platform = ["Android", "iOS", "Windows", "macOS", "Linux", "Web"].includes(message.platform)
        ? message.platform
        : "Web";
      const previousPeer = peers.get(peerId);
      if (previousPeer && previousPeer.socket !== webSocket) {
        previousPeer.socket.close(4001, "This device connected in another app window.");
      }
      participant = { kind: "presence", peerId };
      peers.set(peerId, { peerId, name, platform, socket: webSocket });
      webSocket.send(JSON.stringify({ type: "peer-registered", peerId }));
      broadcastPeerLists();
      return;
    }

    if (!participant) {
      if (
        message.type !== "join" ||
        !/^[a-f0-9-]{20,64}$/i.test(message.room || "") ||
        !["sender", "receiver"].includes(message.role)
      ) {
        webSocket.close(1008, "Invalid room invitation");
        return;
      }
      const room = rooms.get(message.room) || new Map();
      const slot = message.role === "sender" ? "sender" : "receiver";
      if (room.has(slot)) {
        webSocket.close(1008, "Room is already in use");
        return;
      }

      participant = { kind: "room", roomId: message.room, slot };
      room.set(slot, webSocket);
      rooms.set(message.room, room);
      webSocket.send(JSON.stringify({ type: "joined", role: message.role }));

      const otherSlot = slot === "sender" ? "receiver" : "sender";
      const other = room.get(otherSlot);
      if (other?.readyState === WebSocket.OPEN) {
        other.send(JSON.stringify({ type: "peer-joined", role: message.role }));
        webSocket.send(JSON.stringify({ type: "peer-joined", role: otherSlot }));
      }
      return;
    }

    if (participant.kind === "presence") {
      if (message.type === "invite-peer") {
        if (!peerIdPattern.test(message.targetPeerId || "") || !/^[a-f0-9-]{20,64}$/i.test(message.room || "")) {
          webSocket.send(JSON.stringify({ type: "error", message: "Invalid direct-share invitation." }));
          return;
        }
        const sender = peers.get(participant.peerId);
        const receiver = peers.get(message.targetPeerId.toLowerCase());
        if (!sender || !receiver || receiver.socket.readyState !== WebSocket.OPEN) {
          webSocket.send(JSON.stringify({ type: "error", message: "That device is no longer online." }));
          return;
        }
        receiver.socket.send(JSON.stringify({
          type: "incoming-invite",
          room: message.room,
          sender: { peerId: sender.peerId, name: sender.name, platform: sender.platform },
        }));
        webSocket.send(JSON.stringify({ type: "invite-sent", room: message.room, peerId: receiver.peerId }));
        return;
      }
      if (message.type === "decline-invite") {
        if (!peerIdPattern.test(message.senderPeerId || "") || !/^[a-f0-9-]{20,64}$/i.test(message.room || "")) {
          webSocket.send(JSON.stringify({ type: "error", message: "Invalid declined invitation." }));
          return;
        }
        const sender = peers.get(message.senderPeerId.toLowerCase());
        if (sender?.socket.readyState === WebSocket.OPEN) {
          sender.socket.send(JSON.stringify({ type: "invite-declined", room: message.room }));
        }
        return;
      }
      webSocket.send(JSON.stringify({ type: "error", message: "Unsupported device message." }));
      return;
    }

    const room = rooms.get(participant.roomId);
    const otherSlot = participant.slot === "sender" ? "receiver" : "sender";
    const other = room?.get(otherSlot);
    if (other?.readyState === WebSocket.OPEN) {
      other.send(buffer);
    }
  });

  webSocket.on("close", () => {
    if (!participant) return;
    if (participant.kind === "presence") {
      if (peers.get(participant.peerId)?.socket === webSocket) {
        peers.delete(participant.peerId);
        broadcastPeerLists();
      }
      return;
    }
    const room = rooms.get(participant.roomId);
    room?.delete(participant.slot);
    const otherSlot = participant.slot === "sender" ? "receiver" : "sender";
    const other = room?.get(otherSlot);
    if (other?.readyState === WebSocket.OPEN) {
      other.send(JSON.stringify({ type: "peer-left" }));
    }
    if (!room?.size) rooms.delete(participant.roomId);
  });
});

server.listen(port, host, () => {
  console.log(`Conduit server listening on http://${host}:${port}`);
});
