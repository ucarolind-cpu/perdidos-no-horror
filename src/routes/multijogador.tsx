import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { consumeDoorFadeIn } from "@/game/doorFade";
import bg from "@/assets/multijogador-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";

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
  const [fadeIn] = useState(consumeDoorFadeIn);
  const [showVeil, setShowVeil] = useState(fadeIn);
  return (
    <GameShell>
      <div className="game-stage">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">SALA MULTIJOGADOR</h1>
        {showVeil && (
          <motion.div aria-hidden="true"
            style={{ position: "fixed", inset: 0, background: "black", zIndex: 9998 }}
            initial={{ opacity: 1 }} animate={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            onAnimationComplete={() => setShowVeil(false)} />
        )}
        <Link to="/sala-espera" aria-label="CRIAR SALA" className="menu-hotspot" style={pos(33.2, 28.3, 33.8, 14.5)} onClick={tap} />
        <Link to="/entrar-codigo" aria-label="ENTRAR COM CÓDIGO" className="menu-hotspot" style={pos(33.2, 47.5, 33.8, 14.5)} onClick={tap} />
        <Link to="/jogadores" aria-label="VOLTAR" className="menu-hotspot" style={pos(3.2, 87, 15.9, 9.3)} onClick={tap} />
      </div>
    </GameShell>
  );
}
