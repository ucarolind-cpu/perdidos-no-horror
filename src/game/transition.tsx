import { motion } from "framer-motion";
import { useEffect, useSyncExternalStore } from "react";

/** Fade para preto entre telas (usado só por JOGAR e CONFIGURAÇÕES no menu). */
type Phase = "idle" | "out" | "in";
const FADE_S = 0.7; // por fase (máx. 2s)
const SAFETY_MS = 5000;

let phase: Phase = "idle";
let onBlack: (() => void) | null = null;
let safety: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();
const set = (p: Phase) => { phase = p; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

function finish() {
  if (safety) clearTimeout(safety);
  safety = null;
  onBlack = null;
  set("idle");
}

export function fadeTo(go: () => void) {
  if (phase !== "idle") return;
  onBlack = go;
  safety = setTimeout(() => { const g = onBlack; finish(); g?.(); }, SAFETY_MS);
  set("out");
}

export function FadeOverlay() {
  const p = useSyncExternalStore(subscribe, () => phase, () => "idle" as Phase);
  useEffect(() => () => { /* desmontagem de tela não cancela a transição global */ }, []);
  if (p === "idle") return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, background: "black", zIndex: 9999, pointerEvents: "auto", willChange: "opacity" }}
      initial={{ opacity: p === "out" ? 0 : 1 }}
      animate={{ opacity: p === "out" ? 1 : 0 }}
      transition={{ duration: FADE_S, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (phase === "out") { const g = onBlack; onBlack = null; set("in"); g?.(); }
        else if (phase === "in") finish();
      }}
    />
  );
}
