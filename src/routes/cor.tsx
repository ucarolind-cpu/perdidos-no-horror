import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { GameShell } from "@/game/GameShell";
import { DoorTransition, FadeInFromBlack } from "@/game/DoorTransition";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { getPlayerColor, setPlayerColor, type PlayerColor } from "@/game/session";
import { preloadImage } from "@/game/preload";

export const Route = createFileRoute("/cor")({
  head: () => ({
    meta: [
      { title: "Seleção de Cor — Perdidos no Horror" },
      { name: "description", content: "Escolha a cor do seu personagem." },
    ],
  }),
  component: ColorSelection,
});

const colors: { id: PlayerColor; label: string; sprite: number }[] = [
  { id: "green", label: "Verde", sprite: 0 },
  { id: "orange", label: "Laranja", sprite: 25 },
  { id: "blue", label: "Azul", sprite: 50 },
  { id: "white", label: "Branco", sprite: 75 },
  { id: "pink", label: "Rosa", sprite: 100 },
];

const positions: Record<PlayerColor, string> = {
  green: "color-option-green",
  orange: "color-option-orange",
  blue: "color-option-blue",
  white: "color-option-white",
  pink: "color-option-pink",
};

function ColorSelection() {
  const [selected, setSelected] = useState<PlayerColor>(() => getPlayerColor());
  const [busy, setBusy] = useState(false);
  const end = useCallback(() => setBusy(false), []);

  useEffect(() => {
    void preloadImage("/color-select-bg.webp");
    void preloadImage("/color-characters.png");
  }, []);

  const choose = (color: PlayerColor) => {
    if (busy || selected === color) return;
    playClick();
    vibrate(20);
    setSelected(color);
    setPlayerColor(color);
  };

  const confirm = () => {
    if (busy) return;
    playClick();
    vibrate(25);
    setPlayerColor(selected);
    setBusy(true);
  };

  const spritePosition = colors.find((color) => color.id === selected)?.sprite ?? 50;

  return (
    <GameShell>
      <div className="game-stage color-stage">
        <img src="/color-select-bg.webp" alt="" className="game-bg color-bg" draggable={false} />
        <div
          className="color-player"
          style={{ backgroundPositionX: `${spritePosition}%` }}
          aria-hidden="true"
        />
        <div className="color-blue-board" aria-hidden="true">Azul</div>
        {colors.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-label={`Selecionar cor ${color.label}`}
            aria-pressed={selected === color.id}
            className={`color-option ${positions[color.id]} ${selected === color.id ? "is-selected" : ""}`}
            onClick={() => choose(color.id)}
          />
        ))}
        <button
          type="button"
          aria-label="Confirmar cor"
          className="color-option color-confirm"
          onClick={confirm}
          disabled={busy}
        />
        {busy && <DoorTransition onDone={end} />}
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}
