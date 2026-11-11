import { User } from "lucide-react";
import panel from "@/assets/lobby-panel.png.asset.json";
import { useRoomState } from "./rooms";

export function LobbyPlayers() {
  const { saved } = useRoomState();
  return <section className="wood-plank lobby-skin lobby-panel" style={{ backgroundImage: `url(${panel.url})` }} aria-label="JOGADORES">
    <h2>JOGADORES</h2>
    <ul>{[0, 1, 2, 3, 4].map((i) => {
      const player = saved?.players[i];
      return <li key={i}>
        <span className="lobby-avatar"><User /></span>
        {player ? <span className="lobby-owner-identity"><span className="lobby-owner-name">{player.player_name}</span></span>
          : <><span>[player]</span><span className="lobby-wait">&nbsp;- Aguardando...</span></>}
      </li>;
    })}</ul>
  </section>;
}