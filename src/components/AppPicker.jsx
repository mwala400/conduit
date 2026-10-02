import { useEffect, useState } from "react";
import { getInstalledApps, getSelfApk, shareViaBluetooth, shareViaWifiDirect } from "@/lib/nativeShare";
import { formatBytes } from "@/lib/format";
import { Bluetooth, Wifi, Smartphone, Search, Send, Loader2 } from "lucide-react";

export default function AppPicker({ onStageApkFile }) {
  const [apps, setApps] = useState([]);
  const [selfApk, setSelfApk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sharingApp, setSharingApp] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [installed, selfInfo] = await Promise.all([
        getInstalledApps(),
        getSelfApk(),
      ]);
      if (mounted) {
        setApps(installed);
        setSelfApk(selfInfo);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const handleBluetoothShare = async (apkPath, appName) => {
    try {
      setSharingApp(appName);
      setStatusMsg(`Choose Bluetooth or another nearby sharing option for ${appName}…`);
      await shareViaBluetooth(apkPath);
      setStatusMsg(`Android's sharing sheet opened for ${appName}. Choose a nearby device to continue.`);
    } catch (err) {
      setStatusMsg(`Error: ${err.message || "Bluetooth share failed"}`);
    } finally {
      setSharingApp(null);
    }
  };

  const handleWifiShare = async (apkPath, appName) => {
    try {
      setSharingApp(appName);
      setStatusMsg(`Choose Quick Share or another nearby sharing option for ${appName}…`);
      await shareViaWifiDirect(apkPath);
      setStatusMsg(`Android's sharing sheet opened for ${appName}. Choose a nearby device to continue.`);
    } catch (err) {
      setStatusMsg(`Error: ${err.message || "Wi-Fi Direct share failed"}`);
    } finally {
      setSharingApp(null);
    }
  };

  const handleStageForConduit = (app) => {
    if (onStageApkFile && app.apkPath) {
      // Create a virtual file object representation for Conduit WebRTC send
      const virtualFile = {
        name: `${app.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${app.version || "1.0"}.apk`,
        size: app.size,
        type: "application/vnd.android.package-archive",
        apkPath: app.apkPath,
      };
      onStageApkFile(virtualFile);
      setStatusMsg(`Added ${app.name} APK to Conduit send list!`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Self Share Banner */}
      {selfApk && (
        <div className="bento-cell p-4 bg-primary/10 border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-primary-ink text-sm">Share Conduit App Itself</div>
              <div className="text-xs text-secondary-ink">
                Send this app to another phone nearby ({formatBytes(selfApk.size)})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleBluetoothShare(selfApk.apkPath, "Conduit App")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
            >
              <Bluetooth className="w-3.5 h-3.5" /> Bluetooth
            </button>
            <button
              onClick={() => handleWifiShare(selfApk.apkPath, "Conduit App")}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
            >
              <Wifi className="w-3.5 h-3.5" /> Quick Share / Wi-Fi
            </button>
          </div>
        </div>
      )}

      {/* App Search and Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary-ink text-base">Installed Apps (APKs)</h3>
          <span className="text-xs font-mono text-secondary-ink">({apps.length} apps)</span>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-secondary-ink absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search installed apps…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-grid rounded-lg text-primary-ink focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {statusMsg && (
        <div className="text-xs font-mono p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-ink">
          {statusMsg}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-secondary-ink text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Scanning installed apps on device…
        </div>
      ) : apps.length === 0 ? (
        <div className="py-6 text-center text-secondary-ink text-sm bento-cell p-4">
          No apps detected or browsing in a desktop browser. Install the Conduit Android APK to scan and share apps!
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-border bento-cell p-2">
          {filteredApps.map((app) => (
            <div key={app.packageName} className="flex items-center justify-between gap-3 p-2.5 hover:bg-white/5 rounded-lg transition-colors">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-primary-ink truncate">{app.name}</div>
                <div className="text-xs font-mono text-secondary-ink truncate">
                  {app.packageName} · {formatBytes(app.size)} · v{app.version}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  title="Share via Bluetooth"
                  onClick={() => handleBluetoothShare(app.apkPath, app.name)}
                  disabled={sharingApp === app.name}
                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">BT</span>
                </button>

                <button
                  title="Share via Wi-Fi Direct"
                  onClick={() => handleWifiShare(app.apkPath, app.name)}
                  disabled={sharingApp === app.name}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Wi-Fi</span>
                </button>

                {onStageApkFile && (
                  <button
                    title="Send via Conduit WebRTC"
                    onClick={() => handleStageForConduit(app)}
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Conduit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
