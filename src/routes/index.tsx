import { createFileRoute, Link } from "@tanstack/react-router";
import menuBg from "@/assets/menu-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { useCallback, useState, type MouseEvent } from "react";
import { FadeToBlack } from "@/game/FadeTransition";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perdidos no Horror — Menu Principal" },
      { name: "description", content: "Perdidos no Horror: um jogo de terror para celular. Entre se tiver coragem." },
      { property: "og:title", content: "Perdidos no Horror" },
      { property: "og:description", content: "Um jogo de terror para celular. Entre se tiver coragem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MainMenu,
});

const pos = (left: number, top: number, width: number, height: number) => ({
  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
});
const tap = () => { playClick(); vibrate(20); };

function MainMenu() {
  const [to, setTo] = useState<"/jogadores" | "/configuracoes" | null>(null);
  const end = useCallback(() => setTo(null), []);
  const go = (t: "/jogadores" | "/configuracoes") => (e: MouseEvent) => {
    e.preventDefault();
    if (to) return;
    tap();
    setTo(t);
  };
  return (
    <GameShell>
      <div className="game-stage">
        <img src={menuBg.url} alt="Perdidos no Horror" className="game-bg" draggable={false} />
        <h1 className="sr-only">PERDIDOS NO HORROR</h1>
        <Link to="/jogadores" aria-label="JOGAR" className="menu-hotspot" style={pos(35.8, 43.6, 28.5, 14.7)} onClick={go("/jogadores")} />
        <Link to="/configuracoes" aria-label="CONFIGURAÇÕES" className="menu-hotspot" style={pos(36.8, 61.5, 26.2, 12.1)} onClick={go("/configuracoes")} />
        <button type="button" aria-label="SAIR" className="menu-hotspot" style={pos(36.8, 76.4, 26.2, 12.1)} onClick={tap} />
        {to && <FadeToBlack to={to} onDone={end} />}
      </div>
    </GameShell>
  );
}
