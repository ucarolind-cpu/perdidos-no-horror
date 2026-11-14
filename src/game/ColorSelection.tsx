// Lovable deploy refresh marker: verify room_players.player_color persistence in the latest preview.
// Deploy trigger: verify the latest player_color persistence code in Lovable Preview.
import { useCallback, useEffect, useRef, useState } from "react";
import { FadeInFromBlack } from "@/game/DoorTransition";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { getPlayerColor, setPlayerColor, type PlayerColor } from "@/game/session";
import { preloadImage } from "@/game/preload";
import { useServerFn } from "@tanstack/react-start";
import { roomColorAction } from "@/game/rooms.functions";

const colorImages: Record<PlayerColor, string> = {
  white: "/1791172108155.jpg",
  blue: "/1794455675741.jpg",
  orange: "/1794455682141.jpg",
  green: "/1794455689137.jpg",
  pink: "/1794455727314.jpg",
};

const colorButtons: { id: PlayerColor; className: string; label: string }[] = [
  { id: "green", className: "color-option-green", label: "Verde" },
  { id: "pink", className: "color-option-pink", label: "Rosa" },
  { id: "orange", className: "color-option-orange", label: "Laranja" },
  { id: "blue", className: "color-option-blue", label: "Azul" },
  { id: "white", className: "color-option-white", label: "Branco" },
];

type RoomColorPlayer = {
  player_id: string;
  player_color: PlayerColor | null;
  color_confirmed: boolean;
};

type RoomColorResult = {
  players: RoomColorPlayer[];
  player_color: PlayerColor | null;
  color_confirmed: boolean;
  error?: string;
};

export function ColorSelection() {
  const invokeRoomColorAction = useServerFn(roomColorAction);
  const callRoomColorAction = useCallback(async (action: "get" | "confirm", color?: PlayerColor) => {
    const roomId = localStorage.getItem("pnh-active-room-v1");
    const rawDevice = localStorage.getItem("pnh-player-device-v1");
    if (!roomId || !rawDevice) {
      throw new Error("Entre em uma sala multiplayer antes de confirmar sua cor.");
    }

    let device: { id: string; secret: string };
    try {
      device = JSON.parse(rawDevice);
    } catch {
      throw new Error("Não foi possível identificar seu jogador. Entre novamente na sala.");
    }
    if (!device?.id || !device?.secret) {
      throw new Error("Identificação do jogador inválida. Entre novamente na sala.");
    }

    const data = await invokeRoomColorAction({
      data: { device, roomId, action, ...(color ? { color } : {}) },
    });
    return { result: data as RoomColorResult, playerId: device.id };
  }, [invokeRoomColorAction]);

  const [selected, setSelected] = useState<PlayerColor>(() => getPlayerColor());
  const [players, setPlayers] = useState<RoomColorPlayer[]>([]);
  const [ownPlayerId, setOwnPlayerId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const requestInFlight = useRef(false);
  const initialColorLoaded = useRef(false);

  useEffect(() => {
    for (const image of Object.values(colorImages)) void preloadImage(image);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (requestInFlight.current) return;
      requestInFlight.current = true;
      try {
        const { result, playerId } = await callRoomColorAction("get");
        if (!active) return;
        setOwnPlayerId(playerId);
        setPlayers(result.players ?? []);
        setReady(true);
        setErrorMessage("");

        // Only a confirmation returned by the server may lock this screen.
        if (!initialColorLoaded.current) {
          initialColorLoaded.current = true;
          if (result.color_confirmed && result.player_color) {
            setSelected(result.player_color);
            setPlayerColor(result.player_color);
            setConfirmed(true);
            setFeedback("Aguardando jogadores...");
          }
        } else if (!confirmed) {
          const selectedIsTaken = (result.players ?? []).some(
            (player) => player.color_confirmed && player.player_color === selected && player.player_id !== playerId,
          );
          if (selectedIsTaken) {
            const available = colorButtons.find((option) =>
              !(result.players ?? []).some((player) =>
                player.color_confirmed && player.player_color === option.id && player.player_id !== playerId,
              ),
            );
            if (available) setSelected(available.id);
          }
        }
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar as cores.");
      } finally {
        requestInFlight.current = false;
      }
    };

    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 1800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selected, confirmed, callRoomColorAction]);

  const choose = (color: PlayerColor) => {
    if (confirmed || submitting) return;
    const taken = players.some(
      (player) => player.color_confirmed && player.player_color === color && player.player_id !== ownPlayerId,
    );
    if (taken || selected === color) return;
    playClick();
    vibrate(20);
    setSelected(color);
    setFeedback("");
    setErrorMessage("");
  };

  const confirm = async () => {
    if (confirmed || submitting || !ready || requestInFlight.current) return;
    const colorToConfirm = selected;
    const taken = players.some(
      (player) => player.color_confirmed && player.player_color === colorToConfirm && player.player_id !== ownPlayerId,
    );
    if (taken) return;

    playClick();
    vibrate(25);
    setSubmitting(true);
    requestInFlight.current = true;
    setErrorMessage("");
    try {
      const { result, playerId } = await callRoomColorAction("confirm", colorToConfirm);
      setOwnPlayerId(playerId);
      setPlayers(result.players ?? []);
      if (!result.color_confirmed || result.player_color !== colorToConfirm) {
        throw new Error("O Supabase não confirmou a cor selecionada.");
      }
      setPlayerColor(colorToConfirm);
      setConfirmed(true);
      setFeedback("Aguardando jogadores...");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível confirmar sua cor.");
    } finally {
      requestInFlight.current = false;
      setSubmitting(false);
    }
  };

  const selectedTaken = players.some(
    (player) => player.color_confirmed && player.player_color === selected && player.player_id !== ownPlayerId,
  );

  return (
    <div className="game-stage color-select-screen">
      <img
        key={selected}
        src={colorImages[selected]}
        alt={`Seleção de cor: ${selected}`}
        className="game-bg color-selection-art"
        draggable={false}
      />
      <div className="color-options">
        {colorButtons.map((color) => {
          const taken = players.some(
            (player) => player.color_confirmed && player.player_color === color.id && player.player_id !== ownPlayerId,
          );
          // Before confirmation, color choices stay clickable even while the first
          // room check is loading. Confirmation itself waits for the server check.
          const disabled = confirmed || submitting || taken;
          return (
            <button
              key={color.id}
              type="button"
              aria-label={`Selecionar cor ${color.label}`}
              aria-pressed={selected === color.id}
              aria-disabled={disabled}
              disabled={disabled}
              className={`color-option ${color.className}${selected === color.id ? " is-selected" : ""}`}
              style={taken ? { opacity: 0.78, background: "rgba(95, 95, 95, 0.78)", cursor: "not-allowed" } : undefined}
              onClick={() => choose(color.id)}
            />
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Confirmar cor"
        className={`color-confirm${confirmed ? " is-activated" : ""}`}
        onClick={confirm}
        disabled={!ready || submitting || confirmed || selectedTaken}
        style={!ready || submitting || confirmed || selectedTaken ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
      />
      {feedback && (
        <div role="status" style={{
          position: "absolute", zIndex: 6, top: "78%", left: "0", width: "100%",
          textAlign: "center", color: "#ffe5b3", fontWeight: 800, fontSize: "clamp(14px, 3.2cqh, 24px)",
          textShadow: "0 2px 5px #000, 0 0 10px #000", pointerEvents: "none",
        }}>{feedback}</div>
      )}
      {errorMessage && (
        <div role="alert" style={{
          position: "absolute", zIndex: 6, top: "7%", left: "8%", width: "84%",
          padding: "8px 12px", borderRadius: "6px", background: "#241714e8",
          color: "#ffd5c8", textAlign: "center", fontSize: "clamp(11px, 2.2cqh, 17px)",
          textShadow: "0 1px 2px #000", pointerEvents: "none",
        }}>{errorMessage}</div>
      )}
      <FadeInFromBlack />
    </div>
  );
}
