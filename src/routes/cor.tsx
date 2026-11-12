import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/game/GameShell";
import { ColorSelection } from "@/game/ColorSelection";

export const Route = createFileRoute("/cor")({
  head: () => ({
    meta: [
      { title: "Seleção de Cor — Perdidos no Horror" },
      { name: "description", content: "Escolha a cor do seu personagem." },
    ],
  }),
  component: () => (
    <GameShell>
      <ColorSelection />
    </GameShell>
  ),
});
