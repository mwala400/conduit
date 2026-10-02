# Conduit

Conduit is a local-first file-sharing app. File contents use an encrypted WebRTC connection between sender and receiver when the network allows it. A small Node.js service provides temporary device discovery and connection setup; it does not store transferred files and does not need a database.

## Run Conduit on a local Wi-Fi network

1. Install Node.js 20.19+ (Node 22 is recommended).
2. From the project folder, install dependencies with `npm ci`.
3. Start the app and sharing service with `npm run dev`.
4. Open the URL Vite prints. It normally uses `http://localhost:5173`; if that port is busy, Vite prints the next available port.
5. On another computer or phone on the same Wi-Fi, open the printed **Network** URL.

Vite and the signaling service listen on all interfaces. Allow the displayed web port and port `8787` through the host computer's firewall. For an installed Android client, open **Settings → File sharing server** and enter the host computer's address, for example `http://192.168.1.20:8787`.

### Send without copying a link

Keep Conduit open on both devices and connect them to the same Conduit server. The Send page lists online devices. Choose one; the receiver gets an invitation in the app and can review and accept the files. Device presence and invitations are held in server memory only while connected.

If the receiver is not already online, create a share link instead. The sender can show its QR code and the receiver scans it, or the sender can copy the link. These are live sessions: keep the sender online until the transfer is complete.

## Run the production server

Build the web client and then start the combined web/signaling server:

```sh
npm run build
npm start
```

The server listens on port `8787` by default and serves both the web app and WebSocket signaling. Set `PORT` or `HOST` to change the bind address. Put a public deployment behind HTTPS and a reverse proxy that supports WebSocket upgrades. GitHub Pages alone cannot run the signaling service.

For internet transfers, both devices need a reachable public server address. Set that address in Android **Settings → File sharing server**. Some carrier, office, or home networks block direct peer connections; configure a TURN service using `TURN_URLS` and `TURN_SHARED_SECRET` on the Node server. TURN relays may incur bandwidth costs.

## Platform support

- **Android:** install the APK attached to a GitHub Release. The APK is a debug-signed sideload build; new CI builds use a new debug signing key, so upgrading may require uninstalling the previous build first. A stable release signing key must be configured before seamless updates or Play Store publication.
- **iPhone/iPad:** use the web app in Safari. A native iOS app is not currently built; that requires the Capacitor iOS target, macOS/Xcode, and Apple signing.
- **Windows, macOS, and Linux:** use the web app in a current browser. This project does not currently package native desktop installers.

Any sending and receiving device can use the browser client; both people do not have to install the Android app. Link-free device discovery requires both clients to connect to the same running Conduit server.

## GitHub releases

The public repository is `https://github.com/mwala400/conduit`. Pushing a version tag such as `v0.1.0` runs `.github/workflows/android-release.yml`. GitHub Actions builds the Android APK and a web/server ZIP, then publishes both as release assets. The app's Install page links to the latest APK at:

`https://github.com/mwala400/conduit/releases/latest/download/Conduit-Android-debug.apk`

The workflow publishes Android and web/server artifacts only. It does not produce iOS, Windows, macOS, or Linux native installers.

## Checks

```sh
npm run build
npm run test:sharing
```

No account or database is required. Browser history remains on that browser; Android saves received files under `Downloads/Conduit`.
