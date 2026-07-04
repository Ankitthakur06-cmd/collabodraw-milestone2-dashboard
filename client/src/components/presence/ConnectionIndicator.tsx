import { usePresenceStore } from "../../store/presenceStore";

// Milestone 5: bare connection status only — no user list, no cursors,
// no collaboration UI. That's all deferred to later phases.

export default function ConnectionIndicator() {
  const connected = usePresenceStore((s) => s.connected);

  return (
    <span className="text-xs font-medium text-slate-500">
      {connected ? "🟢 Connected" : "🔴 Disconnected"}
    </span>
  );
}
