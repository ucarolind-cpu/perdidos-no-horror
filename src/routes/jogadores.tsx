import { createFileRoute, Link } from "@tanstack/react-router";
import bg from "@/assets/jogadores-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { setPlayerCount } from "@/game/session";

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

function PlayerCount() {
  return (
    <GameShell>
      <div className="game-stage">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">QUANTIDADE DE JOGADORES</h1>
        {options.map((o) =>
          o.n === 1 ? (
            <button type="button" key={o.n} aria-label={o.label}
              className="menu-hotspot" style={pos(36.9, o.top, 26.3, 11.2)} onClick={tap} />
          ) : (
            <Link to="/multijogador" key={o.n} aria-label={o.label}
              className="menu-hotspot" style={pos(36.9, o.top, 26.3, 11.2)} onClick={() => { tap(); setPlayerCount(o.n); }} />
          ),
        )}
        <Link to="/" aria-label="VOLTAR" className="menu-hotspot" style={pos(3.3, 87, 15.8, 9.1)} onClick={tap} />
      </div>
    </GameShell>
  );
}
