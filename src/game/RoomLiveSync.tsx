import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { closeRemoteRoom, useRoomActions, useRoomState } from "./rooms";
import { playOneShotSfx } from "./audio";

/** Realtime notifica a mudança; a lista completa continua vindo da RPC autenticada. */
export function RoomLiveSync() {
  const { saved } = useRoomState();
  const { refresh } = useRoomActions();
  const navigate = useNavigate();
  const refreshRef = useRef(refresh);
  const navigateRef = useRef(navigate);
  refreshRef.current = refresh;
  navigateRef.current = navigate;
  const topic = saved?.room.realtime_topic;
  const roomId = saved?.room.id;
  const playersRef = useRef(saved?.players ?? []);
  playersRef.current = saved?.players ?? [];

  useEffect(() => {
    const onPlayerJoined = () => playOneShotSfx("/378558__cawawac__asoada-impact-low-tube.wav");
    window.addEventListener("pnh:room-player-joined", onPlayerJoined);
    return () => window.removeEventListener("pnh:room-player-joined", onPlayerJoined);
  }, []);

  useEffect(() => {
    if (!topic || !roomId) return;
    let active = true;
    let checking = false;
    let again = false;
    const check = async () => {
      if (checking) { again = true; return; }
      checking = true;
      try {
        if (!await refreshRef.current() && active) {
          active = false;
          closeRemoteRoom();
          await navigateRef.current({ to: "/multijogador" });
        }
      } catch {
        // The periodic heartbeat retries transient network failures.
      } finally {
        checking = false;
        if (again && active) { again = false; void check(); }
      }
    };

    const onCountdownStart = (event: Event) => {
      const startsAt = (event as CustomEvent<{ startsAt: number }>).detail?.startsAt;
      if (typeof startsAt !== "number") return;
      void channel.send({ type: "broadcast", event: "countdown-start", payload: { startsAt } });
    };

    const channel = supabase.channel(`room:${topic}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "countdown-start" }, ({ payload }) => {
        if (typeof payload?.startsAt === "number") {
          window.dispatchEvent(new CustomEvent("pnh:room-countdown-started", { detail: { startsAt: payload.startsAt } }));
        }
      })
      .on("broadcast", { event: "changed" }, () => { void check(); })
      .on("broadcast", { event: "closed" }, () => { void check(); })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "room_players",
        filter: `room_id=eq.${roomId}`,
      }, ({ new: row }) => {
        if (row.room_id === roomId) void check();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "room_players",
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const row = payload.new as typeof payload.new & {
          room_id: string;
          player_id: string;
          player_name: string;
          is_host: boolean;
          player_color?: string | null;
          color_confirmed?: boolean | null;
        };
        const current = playersRef.current.find((player) => player.player_id === row.player_id);

        // Heartbeats update only last_seen_at. Ignore those UPDATEs to avoid a
        // refresh -> heartbeat -> UPDATE loop; color/name changes still refresh.
        const visibleFieldsChanged = !current ||
          current.player_name !== row.player_name ||
          current.is_host !== row.is_host ||
          (current.player_color ?? null) !== (row.player_color ?? null) ||
          (current.color_confirmed ?? null) !== (row.color_confirmed ?? null);

        if (row.room_id === roomId && visibleFieldsChanged) void check();
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "room_players",
      }, ({ old: row }) => {
        // DELETE filters require REPLICA IDENTITY FULL. This table currently
        // uses its composite primary key, which includes room_id, so scope the
        // delete notification by that old primary-key value on the client.
        if (row.room_id === roomId) void check();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void check();
      });

    window.addEventListener("pnh:room-countdown-start", onCountdownStart);
    const timer = window.setInterval(() => { void check(); }, 25000);
    const focus = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", focus);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("pnh:room-countdown-start", onCountdownStart);
      document.removeEventListener("visibilitychange", focus);
      void supabase.removeChannel(channel);
    };
  }, [topic, roomId]);

  return null;
}
