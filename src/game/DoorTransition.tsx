import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import door from "@/assets/door-scene.jpg.asset.json";
import { transition } from "@/game/transition";

type Phase = "fadeOut" | "scene" | "zoom" | "hold";

const full: React.CSSProperties = { position: "absolute", inset: 0, zIndex: 50 };

export function DoorTransition({ onDone, to = "/multijogador" }: { onDone: () => void; to?: "/multijogador" | "/cor" }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("fadeOut");
  const [blackOn, setBlackOn] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const finish = () => {
      if (done.current) return;
      done.current = true;
      transition.fadeInNext = true;
      // Do not clear the transition component before navigation: doing so
      // reveals the previous screen for a frame while the next route mounts.
      void navigate({ to }).then(onDone);
    };
    const raf = requestAnimationFrame(() => setBlackOn(true)); // fade to black 0.5s
    at(520, () => { setPhase("scene"); setBlackOn(false); }); // fade in door scene 0.5s
    at(1040, () => setPhase("zoom")); // door grows 0.9s
    at(1960, () => { setPhase("hold"); setBlackOn(true); }); // fully black, hold 0.5s
    at(2460, finish);
    at(6000, finish); // safety
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [navigate, onDone]);

  const showScene = phase !== "fadeOut";
  return (
    <div style={{ ...full, pointerEvents: "auto", overflow: "hidden" }} aria-hidden>
      {showScene && (
        <div style={full}>
          <img src={door.url} alt="" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", top: "34.1%", left: "48.6%", width: "7%", height: "34%",
            background: "#000", transformOrigin: "52% 51%",
            transform: phase === "zoom" || phase === "hold" ? "scale(20)" : "scale(1)",
            transition: phase === "zoom" ? "transform 0.9s ease-in" : "none",
            willChange: "transform",
          }} />
        </div>
      )}
      <div style={{
        ...full, zIndex: 51, background: "#000", pointerEvents: "none",
        opacity: blackOn ? 1 : 0,
        transition: phase === "hold" ? "none" : "opacity 0.5s linear",
      }} />
    </div>
  );
}

export function FadeInFromBlack() {
  const [active] = useState(() => {
    const v = transition.fadeInNext;
    transition.fadeInNext = false;
    return v;
  });
  const [ms] = useState(() => {
    const m = transition.fadeInMs;
    transition.fadeInMs = 500;
    return m;
  });
  const [visible, setVisible] = useState(active);
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(false)));
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return (
    <div aria-hidden style={{
      ...full, background: "#000", pointerEvents: "none",
      opacity: visible ? 1 : 0, transition: `opacity ${ms / 1000}s linear`,
    }} />
  );
}
