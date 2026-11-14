import { useEffect, useState } from "react";
import { FadeInFromBlack } from "@/game/DoorTransition";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { getPlayerColor, setPlayerColor, type PlayerColor } from "@/game/session";
import { preloadImage } from "@/game/preload";

const colorImages: Record<PlayerColor, string> = {
  white: "/1791172108155.jpg",
  blue: "/1794455675741.jpg",
  orange: "/1794455682141.jpg",
  green: "/1794455689137.jpg",
  pink: "/1794455727314.jpg",
};

const colorButtons: { id: PlayerColor; className: string; label: string }[] = [
  { id: "green", className: "color-option-green", label: "Verde" },
  { id: "pink", className: "color-option-pink", label: "Rosa" },
  { id: "orange", className: "color-option-orange", label: "Laranja" },
  { id: "blue", className: "color-option-blue", label: "Azul" },
  { id: "white", className: "color-option-white", label: "Branco" },
];

export function ColorSelection() {
  const [selected, setSelected] = useState<PlayerColor>(() => getPlayerColor());
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    for (const image of Object.values(colorImages)) {
      void preloadImage(image);
    }
  }, []);

  const choose = (color: PlayerColor) => {
    if (confirmed || selected === color) return;
    playClick();
    vibrate(20);
    setSelected(color);
    setFeedback("");
  };

  const confirm = () => {
    if (confirmed) return;
    playClick();
    vibrate(25);
    setPlayerColor(selected);
    setConfirmed(true);
    setFeedback("Cor selecionada!");
  };

  return (
    <div className="game-stage color-select-screen">
      <img
        key={selected}
        src={colorImages[selected]}
        alt={`Seleção de cor: ${selected}`}
        className="game-bg color-selection-art"
        draggable={false}
      />

      <div className="color-options">
        {colorButtons.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-label={`Selecionar cor ${color.label}`}
            aria-pressed={selected === color.id}
            disabled={confirmed}
            className={`color-option ${color.className}${selected === color.id ? " is-selected" : ""}`}
            onClick={() => choose(color.id)}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Confirmar cor"
        className={`color-confirm${confirmed ? " is-activated" : ""}`}
        onClick={confirm}
        disabled={confirmed}
      />

      {feedback && (
        <div
          role="status"
          style={{
            position: "absolute",
            zIndex: 6,
            top: "78%",
            left: "0",
            width: "100%",
            textAlign: "center",
            color: "#ffe5b3",
            fontWeight: 800,
            fontSize: "clamp(14px, 3.2cqh, 24px)",
            textShadow: "0 2px 5px #000, 0 0 10px #000",
            pointerEvents: "none",
          }}
        >
          {feedback}
        </div>
      )}

      <FadeInFromBlack />
    </div>
  );
}
