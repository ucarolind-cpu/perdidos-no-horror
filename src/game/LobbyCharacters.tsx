import { useRoomState } from "./rooms";

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
  // room RPC, so platform assignment is independent of their display names.
  const guests = saved?.players.filter((player) => !player.is_host).slice(0, 4) ?? [];

  return (
    <div className="lobby-characters" aria-hidden="true">
      {guests.map((player, index) => {
        const slot = guestSlots[index];
        if (!slot) return null;
        return (
          <div
            key={player.player_id}
            className="lobby-character"
            style={{
              left: slot.left,
              bottom: slot.bottom,
              height: slot.height,
              zIndex: slot.zIndex,
              backgroundPosition: `${index * (100 / 3)}% bottom`,
            }}
          />
        );
      })}
    </div>
  );
}
