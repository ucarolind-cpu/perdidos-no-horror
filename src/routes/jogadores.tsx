import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import bg from "@/assets/jogadores-bg.jpg.asset.json";
import door from "@/assets/corridor_door.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { setPlayerCount } from "@/game/session";
import { requestDoorFadeIn } from "@/game/doorFade";

export const Route = createFileRoute("/jogadores")({
  head: () => ({
    meta: [
      { title: "Quantidade de Jogadores — Perdidos no Horror" },
      { name: "description", content: "Escolha de 1 a 5 jogadores para entrar em Perdidos no Horror." },
      { property: "og:title", content: "Quantidade de Jogadores — Perdidos no Horror" },
      { property: "og:description", content: "Escolha de 1 a 5 jogadores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayerCount,
});

const pos = (left: number, top: number, width: number, height: number) => ({
  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
});
const tap = () => { playClick(); vibrate(20); };
const options = [
  { n: 1, label: "1 JOGADOR", top: 22.8 },
  { n: 2, label: "2 JOGADORES", top: 37.0 },
  { n: 3, label: "3 JOGADORES", top: 51.3 },
  { n: 4, label: "4 JOGADORES", top: 65.5 },
  { n: 5, label: "5 JOGADORES", top: 79.7 },
];

type Phase = "idle" | "fadeout" | "zoom" | "hold";
const EASE = [0.4, 0, 0.2, 1] as const;

function PlayerCount() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);

  useEffect(() => {
    const img = new Image();
    img.src = door.url;
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  const go = () => {
    if (done.current) return;
    done.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    requestDoorFadeIn();
    navigate({ to: "/multijogador" });
  };

  const start = (n: number) => {
    if (phase !== "idle") return;
    tap();
    setPlayerCount(n);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("fadeout");
    const t = (ms: number, f: () => void) => timers.current.push(setTimeout(f, ms));
    t(10000, go); // segurança
    if (reduced) { t(1000, go); return; }
    t(1000, () => setPhase("zoom"));
    t(4000, () => setPhase("hold"));
    t(5000, go);
  };

  const busy = phase !== "idle";
  const zooming = phase === "zoom" || phase === "hold";

  return (
    <GameShell>
      <motion.div className="game-stage"
        style={{ pointerEvents: busy ? "none" : undefined }}
        animate={{ opacity: busy ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}>
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">QUANTIDADE DE JOGADORES</h1>
        {options.map((o) =>
          o.n === 1 ? (
            <button type="button" key={o.n} aria-label={o.label}
              className="menu-hotspot" style={pos(36.9, o.top, 26.3, 11.2)} onClick={tap} />
          ) : (
            <button type="button" key={o.n} aria-label={o.label} disabled={busy}
              className="menu-hotspot" style={pos(36.9, o.top, 26.3, 11.2)} onClick={() => start(o.n)} />
          ),
        )}
        <Link to="/" aria-label="VOLTAR" className="menu-hotspot" style={pos(3.3, 87, 15.8, 9.1)} onClick={tap} />
      </motion.div>
      {busy && (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 9000, background: "black", overflow: "hidden", pointerEvents: "auto" }}>
          {zooming && (
            <motion.img src={door.url} alt="" draggable={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                transformOrigin: "51% 48%", willChange: phase === "zoom" ? "transform" : "auto" }}
              initial={{ scale: 1 }} animate={{ scale: 2.5 }}
              transition={{ duration: 3, ease: EASE }} />
          )}
          {zooming && (
            <motion.div style={{ position: "absolute", inset: 0, background: "black" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.4, ease: "easeInOut" }} />
          )}
        </div>
      )}
    </GameShell>
  );
}
