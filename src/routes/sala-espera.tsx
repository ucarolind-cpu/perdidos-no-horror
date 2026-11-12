import { useEffect, useRef, useState } from "react";
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
import { ColorSelection } from "@/game/ColorSelection";

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
  const [showColorSelection, setShowColorSelection] = useState(false);
  const [flashBlack, setFlashBlack] = useState(false);
  const countdownTimer = useRef<number | null>(null);
  const impactAudio = useRef<HTMLAudioElement | null>(null);
  const impactStarted = useRef(false);
  useEffect(() => {
    const onStart = (event: Event) => {
      const startsAt = (event as CustomEvent<{ startsAt: number }>).detail?.startsAt;
      if (typeof startsAt !== "number") return;
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
      const update = () => {
        const next = Math.max(0, Math.ceil((startsAt + 10000 - Date.now()) / 1000));
        setCountdown(next);
        if (next === 0 && countdownTimer.current !== null) {
          window.clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
      };
      update();
      if (Date.now() < startsAt + 10000) countdownTimer.current = window.setInterval(update, 100);
    };
    window.addEventListener("pnh:room-countdown-start", onStart);
    window.addEventListener("pnh:room-countdown-started", onStart);
    return () => {
      window.removeEventListener("pnh:room-countdown-start", onStart);
      window.removeEventListener("pnh:room-countdown-started", onStart);
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    };
  }, []);
  useEffect(() => {
    if (countdown !== 0 || impactStarted.current) return;
    impactStarted.current = true;
    const root = document.querySelector(".game-root");
    root?.classList.add("screen-shake");
    setFlashBlack(true);
    const audio = new Audio("/audio/boom_3_muffled.mp3");
    audio.volume = 1;
    audio.loop = false;
    impactAudio.current = audio;
    void audio.play().catch(() => {});
    const revealTimer = window.setTimeout(() => {
      setFlashBlack(false);
      setShowColorSelection(true);
      root?.classList.remove("screen-shake");
    }, 200);
    const shakeTimer = window.setTimeout(() => root?.classList.remove("screen-shake"), 500);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(shakeTimer);
      root?.classList.remove("screen-shake");
      audio.pause();
      audio.currentTime = 0;
      impactAudio.current = null;
    };
  }, [countdown]);

  const navigate = useNavigate();
  useEffect(() => { restore(); }, []);
  useEffect(() => {
    preloadAudio("/378558__cawawac__asoada-impact-low-tube.wav");
    return playScreenMusic(lobbyMusic.url);
  }, []);

  if (showColorSelection) {
    return (
      <GameShell>
        <ColorSelection />
      </GameShell>
    );
  }

  return (
    <GameShell>
      <div className={`game-stage lobby${flashBlack ? " countdown-blackout" : ""}`}>
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



function LobbyCode({ retry }: { retry: () => void }) {
  const { saved, error } = useRoomState();
  const [show, setShow] = useState(false);
  return <>
    <div className="lobby-code-row">
      <div className="wood-plank lobby-skin lobby-code" style={skin(skinCode.url)} title={error ?? undefined} aria-live="polite">CÓDIGO DA SALA: {error ? "ERRO" : show ? saved?.room.code ?? "••••" : "••••"}</div>
      <button type="button" className="lobby-eye lobby-skin" style={skin(skinEye.url)} aria-label={show ? "OCULTAR CÓDIGO" : "MOSTRAR CÓDIGO"}
        onClick={() => { tap(); if (error) retry(); else setShow((s) => !s); }}>{show ? <Eye /> : <EyeOff />}</button>
    </div>
    {error && <div className="lobby-error-detail" role="alert">{error}</div>}
  </>;
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
