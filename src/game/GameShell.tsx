import { useEffect, useRef, type ReactNode } from "react";
import { initAudio } from "./audio";
import { useSettings } from "./settings";
import { FadeOverlay } from "./transition";

/** Envolve todas as telas: áudio, brilho e aviso de orientação. */
export function GameShell({ children }: { children: ReactNode }) {
  const { brightness } = useSettings();
  const rootRef = useRef<HTMLElement>(null);

  // Preenche as laterais com o próprio cenário (ampliado e cortado), sem faixas pretas.
  useEffect(() => {
    const root = rootRef.current;
    const img = root?.querySelector<HTMLImageElement>(".game-bg");
    if (root && img) root.style.setProperty("--fill-bg", `url("${img.src}")`);
  });

  useEffect(() => {
    const start = async () => {
      initAudio();
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape");
      } catch {
        /* sem suporte: o aviso de girar cobre esse caso */
      }
    };
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, []);

  const dark = brightness < 50 ? ((50 - brightness) / 50) * 0.7 : 0;
  const light = brightness > 50 ? ((brightness - 50) / 50) * 0.35 : 0;

  return (
    <main ref={rootRef} className="game-root" lang="pt-BR">
      {children}
      <div className="brightness-dark" style={{ opacity: dark }} aria-hidden="true" />
      <div className="brightness-light" style={{ opacity: light }} aria-hidden="true" />
      <FadeOverlay />
      <div className="rotate-overlay" role="alert">
        <div className="rotate-phone" aria-hidden="true" />
        <p>Vire o celular para jogar.</p>
      </div>
    </main>
  );
}
