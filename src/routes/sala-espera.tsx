import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, User } from "lucide-react";
import bg from "@/assets/espera-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { vibrate } from "@/game/settings";
import { randomRoomCode } from "@/game/session";

export const Route = createFileRoute("/sala-espera")({
  head: () => ({
    meta: [
      { title: "Sala de Espera — Perdidos no Horror" },
      { name: "description", content: "Aguarde os jogadores entrarem na sua sala em Perdidos no Horror." },
      { property: "og:title", content: "Sala de Espera — Perdidos no Horror" },
      { property: "og:description", content: "Aguarde os jogadores entrarem na sala." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SalaEspera,
});

const tap = () => { playClick(); vibrate(20); };

function SalaEspera() {
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => setCode(randomRoomCode()), []);

  return (
    <GameShell>
      <div className="game-stage lobby">
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="wood-plank lobby-title">SALA DE JOGADOR</h1>
        <div className="lobby-code-row">
          <div className="wood-plank lobby-code">CÓDIGO DA SALA: {show ? code : "••••"}</div>
          <button type="button" className="lobby-eye" aria-label={show ? "OCULTAR CÓDIGO" : "MOSTRAR CÓDIGO"}
            onClick={() => { tap(); setShow((s) => !s); }}>
            {show ? <Eye /> : <EyeOff />}
          </button>
        </div>
        <button type="button" className="wood-plank lobby-btn" style={{ top: "40.5%" }} onClick={tap}>Iniciar jogo</button>
        <Link to="/multijogador" className="wood-plank lobby-btn" style={{ top: "53%" }} onClick={tap}>Sair da sala</Link>
        <section className="wood-plank lobby-panel" aria-label="JOGADORES">
          <h2>JOGADORES</h2>
          <ul>
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i}>
                <span className="lobby-avatar"><User /></span>
                <span>[player]</span><span className="lobby-wait">&nbsp;- Aguardando...</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </GameShell>
  );
}
