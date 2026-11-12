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
import { preloadAudio } from "@/game/preload";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import { vibrate } from "@/game/settings";
import { useRoomActions, useRoomState } from "@/game/rooms";
import { RoomOwner } from "@/game/RoomOwner";
import { LobbyCharacters } from "@/game/LobbyCharacters";
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
  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    const onStart = (event: Event) => {
      const startsAt = (event as CustomEvent<{ startsAt: number }>).detail?.startsAt;
      if (typeof startsAt !== "number") return;
      const update = () => {
        const next = Math.max(0, Math.ceil((startsAt + 10000 - Date.now()) / 1000));
        setCountdown(next);
        if (next === 0) window.clearInterval(timer);
      };
      update();
      const timer = window.setInterval(update, 100);
    };
    window.addEventListener("pnh:room-countdown-start", onStart);
    window.addEventListener("pnh:room-countdown-started", onStart);
    return () => {
      window.removeEventListener("pnh:room-countdown-start", onStart);
      window.removeEventListener("pnh:room-countdown-started", onStart);
    };
  }, []);
  const navigate = useNavigate();
  useEffect(() => { restore(); }, []);
  useEffect(() => {
    preloadAudio("/378558__cawawac__asoada-impact-low-tube.wav");
    return playScreenMusic(lobbyMusic.url);
  }, []);

  if (countdown === 0) {
    return (
      <GameShell>
        <ColorSelection />
      </GameShell>
    );
  }

  return (
    <GameShell>
      <div className="game-stage lobby">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <RoomOwner />
        <LobbyCharacters />
        <RoomLiveSync />
        <h1 className="wood-plank lobby-skin lobby-title" style={skin(skinTitle.url)}>SALA DE ESPERA</h1>
        <LobbyCode retry={retry} />
        <HostStart started={countdown !== null} />
        {countdown !== null && <div className="lobby-countdown" aria-live="off">{countdown}</div>}
        <Link to="/multijogador" className="wood-plank lobby-skin lobby-btn" style={{ top: "53%", ...skin(skinBtn2.url) }} onClick={async (e) => { e.preventDefault(); tap(); if (await leave()) await navigate({ to: "/multijogador" }); }}>Sair da sala</Link>
        <LobbyPlayers />
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}


const colorOptions = [
  { id: "white", label: "Branco", position: "0%", left: "77.5%", top: "44.5%", width: "18.8%", height: "10.8%" },
  { id: "green", label: "Verde", position: "25%", left: "3.7%", top: "40.1%", width: "19.2%", height: "10.5%" },
  { id: "pink", label: "Rosa", position: "50%", left: "3.7%", top: "52.4%", width: "19.2%", height: "10.5%" },
  { id: "orange", label: "Laranja", position: "75%", left: "23.7%", top: "44.5%", width: "18.2%", height: "10.8%" },
  { id: "blue", label: "Azul", position: "100%", left: "58.5%", top: "44.5%", width: "18.2%", height: "10.8%" },
] as const;

function ColorSelection() {
  const [selected, setSelected] = useState("white");
  const chosen = colorOptions.find((option) => option.id === selected) ?? colorOptions[0];
  return (
    <div className="game-stage color-select-screen">
      <img src="/color-select-bg.webp" alt="" className="game-bg" draggable={false} />
      <div
        className="color-character-preview"
        style={{ backgroundPosition: `${chosen.position} center` }}
        role="img"
        aria-label={`Personagem na cor ${chosen.label}`}
      />
      <div className="color-options">
        {colorOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`color-option${selected === option.id ? " is-selected" : ""}`}
            style={{ left: option.left, top: option.top, width: option.width, height: option.height }}
            onClick={() => { tap(); setSelected(option.id); }}
            aria-label={option.label}
            aria-pressed={selected === option.id}
          />
        ))}
      </div>
      <button type="button" className="color-confirm" onClick={tap} aria-label="Confirmar cor" />
    </div>
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
function HostStart({ started }: { started: boolean }) {
  const { saved } = useRoomState();
  if (saved?.isHost === false) return null;
  return <button type="button" className="wood-plank lobby-skin lobby-btn" style={{ top: "40.5%", ...skin(skinBtn1.url) }} disabled={started}
    onClick={() => {
      if (started || !saved?.isHost) return;
      tap();
      window.dispatchEvent(new CustomEvent("pnh:room-countdown-start", { detail: { startsAt: Date.now() } }));
    }}>Iniciar jogo</button>;
}
