import { getSettings, subscribeSettings } from "./settings";

/**
 * Sistema de áudio: master -> (música | efeitos).
 * Para usar uma faixa própria (livre de direitos), coloque o arquivo em
 * public/audio/ e defina MUSIC_URL, ex: "/audio/tema-menu.mp3".
 * Sem arquivo, toca uma ambientação sombria gerada em tempo real (leve).
 */
export const MUSIC_URL: string | null = null;

let ctx: AudioContext | null = null;
let master: GainNode, music: GainNode, sfx: GainNode, drone: GainNode;
let screenTracks = 0;

function applyVolumes() {
  if (!ctx) return;
  const s = getSettings();
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(s.masterVolume / 100, t, 0.05);
  music.gain.setTargetAtTime((s.musicVolume / 100) * 0.35, t, 0.05);
  sfx.gain.setTargetAtTime(s.sfxVolume / 100, t, 0.05);
}

function startProceduralMusic() {
  if (!ctx) return;
  const c = ctx;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.connect(drone);
  // Drone grave levemente desafinado
  [55, 55.6, 82.4].forEach((f) => {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = 0.12;
    o.connect(g).connect(filter);
    o.start();
  });
  // Oscilação lenta do filtro para dar inquietação
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  // Notas esparsas e tensas
  const notes = [220, 233.1, 207.7, 174.6, 246.9];
  const pluck = () => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = notes[Math.floor(Math.random() * notes.length)] ?? 220;
    const t = c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    o.connect(g).connect(drone);
    o.start(t);
    o.stop(t + 6.2);
    setTimeout(pluck, 5000 + Math.random() * 6000);
  };
  setTimeout(pluck, 2500);
}

/** Inicia o áudio no primeiro toque (exigência dos navegadores). */
export function initAudio() {
  if (ctx || typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  music = ctx.createGain();
  sfx = ctx.createGain();
  music.connect(master);
  sfx.connect(master);
  drone = ctx.createGain();
  drone.connect(music);
  master.connect(ctx.destination);
  applyVolumes();
  subscribeSettings(applyVolumes);
  if (MUSIC_URL) {
    const el = new Audio(MUSIC_URL);
    el.loop = true;
    ctx.createMediaElementSource(el).connect(music);
    void el.play().catch(() => {});
  } else {
    startProceduralMusic();
  }
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

/** Som curto de madeira para toques na interface (canal de efeitos). */
export function playClick() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g).connect(sfx);
  o.start(t);
  o.stop(t + 0.12);
}

/** Saída de efeitos para sistemas futuros de jogabilidade. */
export function getSfxBus() {
  return ctx ? { ctx, bus: sfx } : null;
}

/**
 * Toca uma música em loop exclusiva de uma tela (canal de música),
 * silenciando a ambientação padrão. Retorna a função que para a música.
 */
export function playScreenMusic(url: string): () => void {
  if (typeof window === "undefined") return () => {};
  const el = new Audio(url);
  el.loop = true;
  el.preload = "auto";
  let node: MediaElementAudioSourceNode | null = null;
  let stopped = false;
  let ducked = false;
  const start = () => {
    if (stopped) return;
    initAudio();
    if (!ctx) return;
    if (!node) {
      node = ctx.createMediaElementSource(el);
      node.connect(music);
      screenTracks++;
      ducked = true;
      drone.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    }
    void ctx.resume();
    void el.play().catch(() => {});
  };
  start();
  // Se o navegador bloquear, começa no próximo toque.
  const retry = () => { if (el.paused) start(); };
  document.addEventListener("pointerdown", retry);
  return () => {
    stopped = true;
    document.removeEventListener("pointerdown", retry);
    el.pause();
    el.removeAttribute("src");
    el.load();
    node?.disconnect();
    if (ducked && ctx) {
      screenTracks--;
      if (screenTracks <= 0) drone.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    }
  };
}
