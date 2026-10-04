import { createFileRoute } from "@tanstack/react-router";
import menuBg from "@/assets/menu-bg.jpg.asset.json";

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

// Hotspots alinhados aos botões desenhados na imagem de referência (em % da imagem)
const buttons = [
  { label: "JOGAR", left: 35.8, top: 43.6, width: 28.5, height: 14.7 },
  { label: "CONFIGURAÇÕES", left: 36.8, top: 61.5, width: 26.2, height: 12.1 },
  { label: "SAIR", left: 36.8, top: 76.4, width: 26.2, height: 12.1 },
];

function MainMenu() {
  return (
    <main className="game-root" lang="pt-BR">
      <div className="game-stage">
        <img src={menuBg.url} alt="Perdidos no Horror" className="game-bg" draggable={false} />
        <h1 className="sr-only">PERDIDOS NO HORROR</h1>
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            className="menu-hotspot"
            style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` }}
          />
        ))}
      </div>

      <div className="rotate-overlay" role="alert">
        <div className="rotate-phone" aria-hidden="true" />
        <p>VIRE O CELULAR PARA JOGAR</p>
      </div>
    </main>
  );
}
