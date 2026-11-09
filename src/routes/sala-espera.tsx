import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, User } from "lucide-react";
import bg from "@/assets/espera-bg.jpg.asset.json";
import skinTitle from "@/assets/lobby-title.png.asset.json";
import skinCode from "@/assets/lobby-code.png.asset.json";
import skinEye from "@/assets/lobby-eye.png.asset.json";
import skinBtn1 from "@/assets/lobby-btn1.png.asset.json";
import skinBtn2 from "@/assets/lobby-btn2.png.asset.json";
import skinPanel from "@/assets/lobby-panel.png.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick, playScreenMusic } from "@/game/audio";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import { vibrate, useSettings } from "@/game/settings";
import { randomRoomCode, session } from "@/game/session";
import { RoomOwner } from "@/game/RoomOwner";
import { FadeInFromBlack } from "@/game/DoorTransition";

export const Route = createFileRoute("/sala-espera")({
  head: () => ({
    meta: [
      { title: "Sala de Espera — Perdidos no Horror" },
      { name: "description", content: "Aguarde os jogadores entrarem na sua sala em Perdidos no Horror." },
      { property: "og:title", content: "Sala de Espera — Perdidos no Horror" },
      { property: "og:description", content: "Aguarde os jogadores entrarem na sala." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalaEspera,
});

const skin = (u: string) => ({ backgroundImage: `url(${u})` });
const tap = () => { playClick(); vibrate(20); };

function SalaEspera() {
  const { playerName } = useSettings();
  const ownerName = session.owner?.name ?? playerName;
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => setCode(randomRoomCode()), []);
  useEffect(() => playScreenMusic(lobbyMusic.url), []);

  return (
    <GameShell>
      <div className="game-stage lobby">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <RoomOwner />
        <h1 className="wood-plank lobby-skin lobby-title" style={skin(skinTitle.url)}>SALA DE ESPERA</h1>
        <div className="lobby-code-row">
          <div className="wood-plank lobby-skin lobby-code" style={skin(skinCode.url)}>CÓDIGO DA SALA: {show ? code : "••••"}</div>
          <button type="button" className="lobby-eye lobby-skin" style={skin(skinEye.url)} aria-label={show ? "OCULTAR CÓDIGO" : "MOSTRAR CÓDIGO"}
            onClick={() => { tap(); setShow((s) => !s); }}>
            {show ? <Eye /> : <EyeOff />}
          </button>
        </div>
        <button type="button" className="wood-plank lobby-skin lobby-btn" style={{ top: "40.5%", ...skin(skinBtn1.url) }} onClick={tap}>Iniciar jogo</button>
        <Link to="/multijogador" className="wood-plank lobby-skin lobby-btn" style={{ top: "53%", ...skin(skinBtn2.url) }} onClick={tap}>Sair da sala</Link>
        <section className="wood-plank lobby-skin lobby-panel" style={skin(skinPanel.url)} aria-label="JOGADORES">
          <h2>JOGADORES</h2>
          <ul>
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i}>
                <span className="lobby-avatar"><User /></span>
                <span className={i === 0 ? "lobby-owner-name" : undefined} title={i === 0 ? ownerName : undefined}>{i === 0 ? ownerName : "[player]"}</span><span className="lobby-wait">&nbsp;- Aguardando...</span>
              </li>
            ))}
          </ul>
        </section>
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}
