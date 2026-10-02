import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
// App pages
import Home from '@/pages/Home';
import Devices from '@/pages/Devices';
import Nearby from '@/pages/Nearby';
import Send from '@/pages/Send';
import Receive from '@/pages/Receive';
import Transfers from '@/pages/Transfers';
import History from '@/pages/History';
import Storage from '@/pages/Storage';
import Security from '@/pages/Security';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import Reports from '@/pages/Reports';
import Guide from '@/pages/Guide';
import Install from '@/pages/Install';
import Bulk from '@/pages/Bulk';
import Status from '@/pages/Status';
import Sync from '@/pages/Sync';
import Scheduled from '@/pages/Scheduled';
import ShareLink from '@/pages/ShareLink';
import PeerMap from '@/pages/PeerMap';
import Audit from '@/pages/Audit';
import NetworkRadar from '@/pages/NetworkRadar';
import Features from '@/pages/Features';
import BuildCenter from '@/pages/BuildCenter';
import SpeedTest from '@/pages/SpeedTest';
import Pairing from '@/pages/Pairing';
import Receipts from '@/pages/Receipts';
import Functions from '@/pages/Functions';
import Servers from '@/pages/Servers';
import Packets from '@/pages/Packets';
import Templates from '@/pages/Templates';

const nativeShare = registerPlugin("NativeShare");

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/nearby" element={<Nearby />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/history" element={<History />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/security" element={<Security />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/install" element={<Install />} />
        <Route path="/bulk" element={<Bulk />} />
        <Route path="/status" element={<Status />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="/scheduled" element={<Scheduled />} />
        <Route path="/share-link" element={<ShareLink />} />
        <Route path="/peer-map" element={<PeerMap />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/network-radar" element={<NetworkRadar />} />
        <Route path="/features" element={<Features />} />
        <Route path="/functions" element={<Functions />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/packets" element={<Packets />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/build" element={<BuildCenter />} />
        <Route path="/speed-test" element={<SpeedTest />} />
        <Route path="/pairing" element={<Pairing />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const NativeIncomingShareHandler = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return undefined;

    let mounted = true;
    let processing = false;
    let pendingImport = false;
    let listenerHandle;
    const processIncomingShare = async () => {
      if (processing) {
        pendingImport = true;
        return;
      }
      processing = true;
      do {
        pendingImport = false;
        try {
          const result = await nativeShare.receiveSharedFiles();
          if (mounted && result.files?.length) {
            const names = result.files.map((file) => file.name).join(", ");
            toast.success(`Received ${result.files.length} file(s). Saved in Downloads/Conduit: ${names}`);
          }
        } catch (error) {
          if (mounted) toast.error(error.message || "Could not save the shared files.");
        }
      } while (mounted && pendingImport);
      processing = false;
    };

    nativeShare.addListener("shareReceived", processIncomingShare).then((handle) => {
      listenerHandle = handle;
      if (!mounted) handle.remove();
    }).catch((error) => {
      if (mounted) toast.error(error.message || "Could not listen for incoming shared files.");
    });
    processIncomingShare();

    return () => {
      mounted = false;
      listenerHandle?.remove();
    };
  }, []);

  return null;
};


function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <NativeIncomingShareHandler />
        <ScrollToTop />
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App