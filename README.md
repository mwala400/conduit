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

## Deploy the web app and sharing backend

The Vercel project hosts the Vite frontend. The persistent Node/WebSocket signaling service runs separately on Render using the included `render.yaml` Blueprint. Connect this repository to Vercel and Render, deploy the Render Blueprint, then configure:

- **Vercel `VITE_SIGNALING_URL`:** the Render service's HTTPS URL ending in `/signal`. Set it for Production and Preview, then redeploy.
- **Render `CORS_ORIGINS`:** the Vercel production origin (for example `https://conduit.example.com`), plus `https://localhost` and `capacitor://localhost` for Android.
- **Android builds:** add the same public `VITE_SIGNALING_URL` as a GitHub Actions repository variable so release APKs use the deployed signaling service by default. Android users can also enter the Render URL under Settings.
- **TURN configuration:** set `TURN_URLS` and either `TURN_SHARED_SECRET` (for TURN REST credentials) or `TURN_USERNAME` plus `TURN_CREDENTIAL` (for static provider credentials). TURN is needed for networks that block direct WebRTC connections.

The free Render service may sleep when idle; the first connection can be delayed, and active sessions can end when the service restarts. Upgrade the Render plan for an always-on service. Vercel serves the frontend only. The Neon integration is not currently used by this app; `DATABASE_URL` alone does not provide signaling, TURN relay, or file storage. Do not commit `.env` files or put server secrets in Vercel's `VITE_` variables. Use `.env.example` as a variable-name template and set production values in each provider's environment-variable settings.

## Platform support

- **Android:** install the APK attached to a GitHub Release. The APK is a debug-signed sideload build; new CI builds use a new debug signing key, so upgrading may require uninstalling the previous build first. A stable release signing key must be configured before seamless updates or Play Store publication.
- **iPhone/iPad:** use the web app in Safari. A native iOS app is not currently built; that requires the Capacitor iOS target, macOS/Xcode, and Apple signing.
- **Windows, macOS, and Linux:** use the web app in a current browser. This project does not currently package native desktop installers.

Any sending and receiving device can use the browser client; both people do not have to install the Android app. Link-free device discovery requires both clients to connect to the same running Conduit server.

On Android, select files in Send and choose **Share via Quick Share / Bluetooth** to use Android's system sharing sheet. The receiving phone accepts with Quick Share; Android saves the files to its chosen destination (usually Downloads). This does not require a Conduit server. Availability and transport (Wi-Fi or Bluetooth) depend on the phones and Android version. Conduit also appears as a target when another Android app shares files; files shared directly to Conduit are copied to Downloads/Conduit.

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
