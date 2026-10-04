import { useSyncExternalStore } from "react";

export type ControlType = "joystick" | "direcional";

export interface GameSettings {
  masterVolume: number; // 0–100
  musicVolume: number; // 0–100
  sfxVolume: number; // 0–100
  vibration: boolean;
  brightness: number; // 0–100 (50 = neutro)
  controlType: ControlType;
  playerName: string;
  sensitivity: number; // 0–100
  subtitles: boolean;
  gore: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 75,
  musicVolume: 60,
  sfxVolume: 90,
  vibration: true,
  brightness: 50,
  controlType: "joystick",
  playerName: "CAPITÃO JOSÉ",
  sensitivity: 50,
  subtitles: true,
  gore: true,
};

export const PLAYER_NAME_MAX = 16;
const KEY = "pnh-settings-v1";
const listeners = new Set<() => void>();
let state: GameSettings = DEFAULT_SETTINGS;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* armazenamento indisponível */
  }
}

export function getSettings(): GameSettings {
  load();
  return state;
}

export function updateSettings(patch: Partial<GameSettings>) {
  load();
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignora */
  }
  listeners.forEach((l) => l());
}

export function subscribeSettings(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSettings(): GameSettings {
  return useSyncExternalStore(subscribeSettings, getSettings, () => DEFAULT_SETTINGS);
}

/** Multiplicador de entrada para movimento/câmera (0.25x – 2x). */
export function getSensitivityMultiplier(s = getSettings()) {
  return 0.25 + (s.sensitivity / 100) * 1.75;
}

/** Vibra o aparelho se a opção estiver ativa e houver suporte. */
export function vibrate(pattern: number | number[] = 30) {
  if (!getSettings().vibration) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}
