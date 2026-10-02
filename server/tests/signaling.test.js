import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { after, before, test } from "node:test";
import WebSocket from "ws";

let serverProcess;
let origin;

const freePort = async () => {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
};

const openSocket = async (room, role) => {
  const socket = new WebSocket(`${origin.replace("http", "ws")}/signal`);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  socket.send(JSON.stringify({ type: "join", room, role }));
  const joined = await nextMessage(socket, (message) => message.type === "joined");
  return { socket, joined };
};

const openPeer = async (peerId, name, platform = "Web") => {
  const socket = new WebSocket(`${origin.replace("http", "ws")}/signal`);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  socket.send(JSON.stringify({ type: "register-peer", peerId, name, platform }));
  const registered = await nextMessage(socket, (message) => message.type === "peer-registered");
  return { socket, registered };
};

const nextMessage = (socket, predicate) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("Timed out waiting for a signaling message."));
    }, 3000);
    const onMessage = (buffer) => {
      const message = JSON.parse(buffer.toString());
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.off("message", onMessage);
      resolve(message);
    };
    socket.on("message", onMessage);
  });

before(async () => {
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["server/index.js"], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: "ignore",
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (serverProcess.exitCode !== null) throw new Error("Signaling server exited before it became ready.");
    try {
      const response = await fetch(`${origin}/api/ice-servers`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Signaling server did not become ready.");
});

after(() => {
  serverProcess?.kill();
});

test("publishes STUN configuration without requiring a database", async () => {
  const response = await fetch(`${origin}/api/ice-servers`);
  assert.equal(response.status, 200);
  const servers = await response.json();
  assert.ok(servers.some((server) => server.urls.includes("stun:stun.l.google.com:19302")));
});

test("forwards an invitation manifest between sender and receiver", async () => {
  const room = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
  const sender = await openSocket(room, "sender");
  const senderPeerJoined = nextMessage(sender.socket, (message) => message.type === "peer-joined");
  const receiver = await openSocket(room, "receiver");
  try {
    assert.equal(sender.joined.role, "sender");
    assert.equal(receiver.joined.role, "receiver");

    await senderPeerJoined;

    const manifest = { type: "manifest", files: [{ name: "test.txt", size: 4, type: "text/plain" }] };
    const receivedManifest = nextMessage(receiver.socket, (message) => message.type === "manifest");
    sender.socket.send(JSON.stringify(manifest));
    assert.deepEqual(await receivedManifest, manifest);
  } finally {
    sender.socket.close();
    receiver.socket.close();
  }
});

test("discovers online peers and delivers an app-to-app invitation without a link", async () => {
  const senderId = "11111111111111111111111111111111";
  const receiverId = "22222222222222222222222222222222";
  const room = "c1d2e3f4a5b60718293a4b5c6d7e8f90";
  const sender = await openPeer(senderId, "Android · 1111", "Android");
  const senderPeerList = nextMessage(
    sender.socket,
    (message) => message.type === "peer-list" && message.peers.some((peer) => peer.peerId === receiverId),
  );
  const receiver = await openPeer(receiverId, "Windows · 2222", "Windows");
  try {
    await senderPeerList;

    const invitation = nextMessage(receiver.socket, (message) => message.type === "incoming-invite");
    const sent = nextMessage(sender.socket, (message) => message.type === "invite-sent");
    sender.socket.send(JSON.stringify({ type: "invite-peer", targetPeerId: receiverId, room }));

    assert.deepEqual(await invitation, {
      type: "incoming-invite",
      room,
      sender: { peerId: senderId, name: "Android · 1111", platform: "Android" },
    });
    assert.equal((await sent).peerId, receiverId);

    const receiverPeerList = nextMessage(
      sender.socket,
      (message) => message.type === "peer-list" && !message.peers.some((peer) => peer.peerId === receiverId),
    );
    receiver.socket.close();
    await receiverPeerList;
  } finally {
    sender.socket.close();
    receiver.socket.close();
  }
});
