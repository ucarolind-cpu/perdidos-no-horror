import { useRoomState } from "./rooms";

const guestSlots = [
  { left: "51.8%", bottom: "26%", width: "7.2%", height: "19.4%" },
  { left: "40.2%", bottom: "26%", width: "7.2%", height: "19.4%" },
  { left: "62.1%", bottom: "32.5%", width: "5.2%", height: "14%" },
  { left: "32.7%", bottom: "32.5%", width: "5.2%", height: "14%" },
];

/** Guests use their stable join order, never their display name, to select a platform. */
export function LobbyCharacters() {
  const { saved } = useRoomState();
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
              ...slot,
              backgroundPosition: `${index * (100 / 3)}% bottom`,
            }}
          />
        );
      })}
    </div>
  );
}
