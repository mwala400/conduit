import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TopBar } from "@/components/TopBar";
import { CommandPalette } from "@/components/CommandPalette";
import { declinePeerInvite, subscribeToPeerPresence } from "@/lib/shareTransport";

export default function Layout() {
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);

  useEffect(
    () => subscribeToPeerPresence((snapshot) => {
      if (snapshot.incomingInvite) setInvitation(snapshot.incomingInvite);
    }),
    [],
  );

  const acceptInvitation = () => {
    if (!invitation?.room) return;
    const room = invitation.room;
    setInvitation(null);
    navigate(`/receive?room=${encodeURIComponent(room)}`);
  };

  const declineInvitation = () => {
    if (invitation?.room && invitation.sender?.peerId) {
      declinePeerInvite(invitation.sender.peerId, invitation.room);
    }
    setInvitation(null);
  };

  return (
    <div className="flex h-full min-h-0 bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      {invitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section className="bento-cell w-full max-w-md space-y-4 p-5" role="alertdialog" aria-modal="true" aria-labelledby="incoming-share-title">
            <div>
              <h2 id="incoming-share-title" className="text-carved text-primary-ink text-xl">Incoming file share</h2>
              <p className="mt-2 text-sm text-secondary-ink">
                {invitation.sender?.name || "A Conduit device"} wants to send files directly to this device.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={declineInvitation} className="flex-1 rounded-lg border border-grid bg-white/5 px-4 py-2.5 text-sm text-primary-ink">
                Decline
              </button>
              <button onClick={acceptInvitation} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink">
                Review files
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}