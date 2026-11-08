import door from "@/assets/door-scene.jpg.asset.json";
import matchstick from "@/assets/matchstick_strike.mp3.asset.json";
import lobbyBackground from "@/assets/espera-bg.jpg.asset.json";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import { prepareOwnerSprite } from "./ownerSprite";

const images = new Map<string, HTMLImageElement>();
const audio = new Map<string, HTMLAudioElement>();

export function preloadImage(url: string) {
  if (typeof window === "undefined" || images.has(url)) return;
  try {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => { void image.decode?.().catch(() => {}); };
    image.onerror = () => { images.delete(url); };
    images.set(url, image);
    image.src = url;
  } catch { images.delete(url); }
}

export function preloadAudio(url: string) {
  if (typeof window === "undefined" || audio.has(url)) return;
  try {
    const element = new Audio();
    element.preload = "auto";
    element.onerror = () => { audio.delete(url); };
    audio.set(url, element);
    element.src = url;
    element.load();
  } catch { audio.delete(url); }
}

/** Reuses the silently loaded element; failed/missing preloads load normally. */
export function acquireAudio(url: string): HTMLAudioElement {
  const element = audio.get(url);
  if (!element) return new Audio(url);
  audio.delete(url);
  element.onerror = null;
  return element;
}

export function preloadPlayerMenuAssets() {
  preloadImage(door.url);
  preloadAudio(matchstick.url);
  preloadImage(lobbyBackground.url);
}

export function preloadCreateRoomAssets() {
  preloadAudio(lobbyMusic.url);
  void prepareOwnerSprite();
}