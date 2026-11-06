import { createFileRoute, Link } from "@tanstack/react-router";
import bg from "@/assets/multijogador-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { FadeInFromBlack } from "@/game/DoorTransition";
import { FadeToBlack } from "@/game/FadeTransition";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/multijogador")({
  head: () => ({
    meta: [
      { title: "Sala Multijogador — Perdidos no Horror" },
      { name: "description", content: "Crie uma sala ou entre com um código em Perdidos no Horror." },
      { property: "og:title", content: "Sala Multijogador — Perdidos no Horror" },
      { property: "og:description", content: "Crie uma sala ou entre com um código." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Multijogador,
});

const pos = (left: number, top: number, width: number, height: number) => ({
  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
});
const tap = () => { playClick(); vibrate(20); };

function Multijogador() {
  const [busy, setBusy] = useState(false);
  const end = useCallback(() => setBusy(false), []);
  const [creating, setCreating] = useState(false);
  const endCreate = useCallback(() => setCreating(false), []);
  return (
    <GameShell>
      <div className="game-stage">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">SALA MULTIJOGADOR</h1>
        <Link to="/sala-espera" aria-label="CRIAR SALA" className="menu-hotspot" style={pos(33.2, 28.3, 33.8, 14.5)}
          onClick={(e) => { e.preventDefault(); if (busy || creating) return; tap(); setCreating(true); }} />
        <Link to="/entrar-codigo" aria-label="ENTRAR COM CÓDIGO" className="menu-hotspot" style={pos(33.2, 47.5, 33.8, 14.5)}
          onClick={(e) => { e.preventDefault(); if (busy) return; tap(); setBusy(true); }} />
        <Link to="/jogadores" aria-label="VOLTAR" className="menu-hotspot" style={pos(3.2, 87, 15.9, 9.3)} onClick={tap} />
        <FadeInFromBlack />
        {busy && <FadeToBlack to="/entrar-codigo" onDone={end} />}
        {creating && <FadeToBlack to="/sala-espera" onDone={endCreate} holdMs={3000} safetyMs={5000} />}
      </div>
    </GameShell>
  );
}
