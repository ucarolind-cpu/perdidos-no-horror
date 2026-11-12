import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { closeRemoteRoom, useRoomActions, useRoomState } from "./rooms";
import { playOneShotSfx } from "./audio";

/** Data-free Realtime doorbells on an unguessable capability topic.
 * All actual reads remain credential/membership-checked server calls. */
export function RoomLiveSync() {
  const { saved } = useRoomState();
  const { refresh } = useRoomActions();
  const navigate = useNavigate();
  const topic = saved?.room.realtime_topic;
  useEffect(() => {
    const onPlayerJoined = () => playOneShotSfx("/378558__cawawac__asoada-impact-low-tube.wav");
    window.addEventListener("pnh:room-player-joined", onPlayerJoined);
    return () => window.removeEventListener("pnh:room-player-joined", onPlayerJoined);
  }, []);
  useEffect(() => {
    if (!topic) return;
    let active = true;
    let checking = false;
    let again = false;
    const check = async () => {
      if (checking) { again = true; return; }
      checking = true;
      try {
        if (!await refresh() && active) {
          active = false;
          closeRemoteRoom(); await navigate({ to: "/multijogador" });
        }
      } catch { /* heartbeat retries transient network failures */ }
      finally { checking = false; if (again && active) { again = false; void check(); } }
    };
    const channel = supabase.channel(`room:${topic}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "changed" }, () => { void check(); })
      .on("broadcast", { event: "closed" }, () => { void check(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void check(); });
    const timer = window.setInterval(() => { void check(); }, 25000);
    const focus = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", focus);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", focus); void supabase.removeChannel(channel); };
  }, [topic]);
  return null;
}