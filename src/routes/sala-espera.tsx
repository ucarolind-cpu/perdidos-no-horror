import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import bg from "@/assets/espera-bg.jpg.asset.json";
import skinTitle from "@/assets/lobby-title.png.asset.json";
import skinCode from "@/assets/lobby-code.png.asset.json";
import skinEye from "@/assets/lobby-eye.png.asset.json";
import skinBtn1 from "@/assets/lobby-btn1.png.asset.json";
import skinBtn2 from "@/assets/lobby-btn2.png.asset.json";
import { LobbyPlayers } from "@/game/LobbyPlayers";
import { RoomLiveSync } from "@/game/RoomLiveSync";
import { GameShell } from "@/game/GameShell";
import { playClick, playScreenMusic } from "@/game/audio";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import { vibrate } from "@/game/settings";
import { useRoomActions, useRoomState } from "@/game/rooms";
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
  const { restore, leave, retry } = useRoomActions();
  const navigate = useNavigate();
  useEffect(() => { restore(); }, []);
  useEffect(() => playScreenMusic(lobbyMusic.url), []);

  return (
    <GameShell>
      <div className="game-stage lobby">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <RoomOwner />
        <RoomLiveSync />
        <h1 className="wood-plank lobby-skin lobby-title" style={skin(skinTitle.url)}>SALA DE ESPERA</h1>
        <LobbyCode retry={retry} />
        <HostStart />
        <Link to="/multijogador" className="wood-plank lobby-skin lobby-btn" style={{ top: "53%", ...skin(skinBtn2.url) }} onClick={async (e) => { e.preventDefault(); tap(); if (await leave()) await navigate({ to: "/multijogador" }); }}>Sair da sala</Link>
        <LobbyPlayers />
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}

function LobbyCode({ retry }: { retry: () => void }) {
  const { saved, error } = useRoomState();
  const [show, setShow] = useState(false);
  return <div className="lobby-code-row">
    <div className="wood-plank lobby-skin lobby-code" style={skin(skinCode.url)} title={error ?? undefined} aria-live="polite">CÓDIGO DA SALA: {error ? "ERRO" : show ? saved?.room.code ?? "••••" : "••••"}</div>
    <button type="button" className="lobby-eye lobby-skin" style={skin(skinEye.url)} aria-label={show ? "OCULTAR CÓDIGO" : "MOSTRAR CÓDIGO"}
      onClick={() => { tap(); if (error) retry(); else setShow((s) => !s); }}>{show ? <Eye /> : <EyeOff />}</button>
  </div>;
}
function HostStart() {
  const { saved } = useRoomState();
  if (saved?.isHost === false) return null;
  return <button type="button" className="wood-plank lobby-skin lobby-btn" style={{ top: "40.5%", ...skin(skinBtn1.url) }} onClick={tap}>Iniciar jogo</button>;
}
