import { useEffect, useState } from "react";
import { generateNodeId } from "@/lib/format";

// Generates and persists a local node identity in localStorage.
// In a native build this would come from the platform keystore; here it is
// an honest browser-local identity used for display and pairing flows.
export function useLocalNode() {
  const [node, setNode] = useState(null);

  useEffect(() => {
    let id = localStorage.getItem("conduit.node_id");
    let name = localStorage.getItem("conduit.node_name");
    if (!id) {
      id = generateNodeId();
      name = `${detectPlatformLabel()}-${randomTag()}`;
      localStorage.setItem("conduit.node_id", id);
      localStorage.setItem("conduit.node_name", name);
    }
    setNode({ id, name });
  }, []);

  return node;
}

function detectPlatformLabel() {
  const ua = navigator.userAgent;
  if (/Mac/.test(ua)) return "MacBook";
  if (/Win/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "WebNode";
}

function randomTag() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}