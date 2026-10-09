import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import bg from "@/assets/codigo-bg.jpg.asset.json";
import { GameShell } from "@/game/GameShell";
import { playClick } from "@/game/audio";
import { FadeInFromBlack } from "@/game/DoorTransition";
import { vibrate } from "@/game/settings";

export const Route = createFileRoute("/entrar-codigo")({
  head: () => ({
    meta: [
      { title: "Entrar na Sala — Perdidos no Horror" },
      { name: "description", content: "Digite o código de 4 caracteres para entrar em uma sala de Perdidos no Horror." },
      { property: "og:title", content: "Entrar na Sala — Perdidos no Horror" },
      { property: "og:description", content: "Digite o código da sala." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarCodigo,
});

const pos = (left: number, top: number, width: number, height: number) => ({
  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
});
const tap = () => { playClick(); vibrate(20); };
const lefts = [33.4, 42.0, 50.5, 58.9];

function EntrarCodigo() {
  const [chars, setChars] = useState(["", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  // Sobe a tela quando o teclado cobre o botão inferior.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const keyboard = window.innerHeight - vv.height > 80;
      if (!keyboard) return setShift(0);
      const el = btnRef.current;
      if (!el) return;
      const bottom = el.getBoundingClientRect().bottom - shift;
      const limit = vv.height + vv.offsetTop - 6;
      setShift(bottom > limit ? limit - bottom : 0);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, [shift]);

  const setAt = (i: number, v: string) => setChars((c) => c.map((x, j) => (j === i ? v : x)));

  const onInput = (i: number, raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) return setAt(i, "");
    const next = [...chars];
    let k = i;
    for (const ch of clean) { if (k > 3) break; next[k++] = ch; }
    setChars(next);
    refs.current[Math.min(k, 3)]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    if (chars[i]) { setAt(i, ""); return; }
    if (i > 0) { setAt(i - 1, ""); refs.current[i - 1]?.focus(); }
  };

  return (
    <GameShell>
      <div className="game-stage code-stage" style={{ transform: `translateY(${shift}px)` }}>
        <img src={bg.url} alt="" className="game-bg" draggable={false} />
        <h1 className="sr-only">ENTRAR NA SALA</h1>
        {lefts.map((l, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }}
            className="code-box" style={{ left: `${l}%` }}
            value={chars[i]} inputMode="text" autoCapitalize="characters" autoComplete="off"
            autoCorrect="off" spellCheck={false} enterKeyHint="go"
            aria-label={`Caractere ${i + 1} do código da sala`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => { if (chars[i] && e.target.value.length > 1 && chars.every(Boolean)) return; onInput(i, e.target.value.replace(chars[i] ?? "", "") || e.target.value); }}
            onKeyDown={(e) => onKey(i, e)} />
        ))}
        <button ref={btnRef} type="button" aria-label="ENTRAR NA SALA" className="menu-hotspot"
          style={pos(34.7, 69, 30.9, 13.5)} onClick={tap} />
        <Link to="/multijogador" aria-label="VOLTAR" className="menu-hotspot"
          style={pos(3.3, 87, 15.8, 9.4)} onClick={tap} />
        <FadeInFromBlack />
      </div>
    </GameShell>
  );
}
