import { useEffect, type ReactNode } from "react";
import { initAudio } from "./audio";
import { useSettings } from "./settings";

/** Envolve todas as telas: áudio, brilho e aviso de orientação. */
export function GameShell({ children }: { children: ReactNode }) {
  const { brightness } = useSettings();
  useEffect(() => {
    initAudio();
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
    <main className="game-root" lang="pt-BR">
      {children}
      <div className="brightness-dark" style={{ opacity: dark }} aria-hidden="true" />
      <div className="brightness-light" style={{ opacity: light }} aria-hidden="true" />
      <div className="rotate-overlay" role="alert">
        <div className="rotate-phone" aria-hidden="true" />
        <p>Vire o celular para jogar.</p>
      </div>
    </main>
  );
}
