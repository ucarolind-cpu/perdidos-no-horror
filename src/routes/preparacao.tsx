import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import bg from "@/assets/jogadores-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { useSettings, vibrate } from "@/game/settings";

export const Route = createFileRoute("/preparacao")({
  validateSearch: (s) => z.object({ jogadores: z.coerce.number().int().min(1).max(5).catch(1) }).parse(s),
  head: () => ({
    meta: [
      { title: "Preparando Partida — Perdidos no Horror" },
      { name: "description", content: "Preparando a partida de Perdidos no Horror." },
      { property: "og:title", content: "Preparando Partida — Perdidos no Horror" },
      { property: "og:description", content: "Preparando a partida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prep,
});

const tap = () => { playClick(); vibrate(20); };

// Ponto de entrada da próxima etapa (sala/partida) — conteúdo será definido depois.
function Prep() {
  const { jogadores } = Route.useSearch();
  const { playerName } = useSettings();
  return (
    <GameShell>
      <div className="game-stage">
        <img src={bg.url} alt="" className="game-bg prep-dim" draggable={false} />
        <div className="prep-panel">
          <h1 className="wood-sign">{jogadores} {jogadores === 1 ? "JOGADOR" : "JOGADORES"}</h1>
          <p>{playerName}, a partida está sendo preparada...</p>
          <Link to="/jogadores" className="wood-sign wood-sign-sm" onClick={tap}>VOLTAR</Link>
        </div>
      </div>
    </GameShell>
  );
}
