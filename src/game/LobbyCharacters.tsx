import { useRoomState } from "./rooms";

type PlayerColor = "green" | "pink" | "orange" | "blue" | "white";

const colorGlow: Record<PlayerColor, string> = {
  green: "#65df91",
  pink: "#f18ac1",
  orange: "#ffad60",
  blue: "#70b4ff",
  white: "#f5f1df",
};

// Anchors are measured against the 16:9 lobby artwork. Each character is
// bottom-aligned to the center of its own floor platform.
const guestSlots = [
  { left: "57.1%", bottom: "30.2%", height: "33.2%", zIndex: 2 },
  { left: "42.9%", bottom: "30.2%", height: "33.2%", zIndex: 2 },
  { left: "63.1%", bottom: "39.2%", height: "22.2%", zIndex: 1 },
  { left: "35.2%", bottom: "39.2%", height: "22.2%", zIndex: 1 },
];

export function LobbyCharacters() {
  const { saved } = useRoomState();
  // The host already has RoomOwner. Guests are ordered by joined_at by the
  // room RPC, so platform assignment stays independent of their display names.
  const guests = saved?.players.filter((player) => !player.is_host).slice(0, 4) ?? [];

  return (
    <div className="lobby-characters" aria-hidden="true">
      {guests.map((player, index) => {
        const slot = guestSlots[index];
        if (!slot) return null;

        const color = player.player_color as PlayerColor | null | undefined;
        const colorShadow = color ? `drop-shadow(0 0 0.85cqh ${colorGlow[color]}) ` : "";

        return (
          <div
            key={player.player_id}
            className="lobby-character"
            data-player-color={color ?? "unselected"}
            style={{
              left: slot.left,
              bottom: slot.bottom,
              height: slot.height,
              zIndex: slot.zIndex,
              backgroundPosition: `${index * (100 / 3)}% bottom`,
              filter: `${colorShadow}drop-shadow(0 0.25cqh 0.45cqh oklch(0 0 0 / .55))`,
            }}
          />
        );
      })}
    </div>
  );
}
