import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { transition } from "@/game/transition";

type To = "/configuracoes" | "/jogadores" | "/entrar-codigo" | "/sala-espera";

/** Fade rápido para preto (0,3s), espera opcional no preto, troca de tela e fade-in de 0,3s na próxima. */
export function FadeToBlack({ to, onDone, holdMs = 0, safetyMs = 2000 }: {
  to: To; onDone: () => void; holdMs?: number; safetyMs?: number;
}) {
  const navigate = useNavigate();
  const [on, setOn] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      transition.fadeInNext = true;
      transition.fadeInMs = 300;
      onDone();
      navigate({ to });
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    const t1 = window.setTimeout(finish, 320 + holdMs);
    const t2 = window.setTimeout(finish, safetyMs); // segurança
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, [navigate, onDone, to, holdMs, safetyMs]);

  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, zIndex: 50, background: "#000", pointerEvents: "auto",
      opacity: on ? 1 : 0, transition: "opacity 0.3s linear",
    }} />
  );
}
