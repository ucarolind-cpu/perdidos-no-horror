import door from "@/assets/door-scene.jpg.asset.json";
import matchstick from "@/assets/matchstick_strike.mp3.asset.json";
import lobbyBackground from "@/assets/espera-bg.jpg.asset.json";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import ownerSprite from "@/assets/room-owner.webp.asset.json";

const images = new Map<string, HTMLImageElement>();
const audio = new Map<string, HTMLAudioElement>();
const imageLoads = new Map<string, Promise<HTMLImageElement | null>>();

export function preloadImage(url: string) {
  if (typeof window === "undefined") return Promise.resolve(null);
  const cached = imageLoads.get(url);
  if (cached) return cached;
  let settle: (image: HTMLImageElement | null) => void = () => {};
  const pending = new Promise<HTMLImageElement | null>((resolve) => { settle = resolve; });
  imageLoads.set(url, pending);
  try {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* loaded image remains usable */ }
      image.onload = null;
      image.onerror = null;
      settle(image);
    };
    image.onerror = () => {
      images.delete(url);
      imageLoads.delete(url);
      settle(null);
    };
    images.set(url, image);
    image.src = url;
  } catch { images.delete(url); imageLoads.delete(url); settle(null); }
  return pending;
}

/** Retains the decoded element across room visits, not only its URL. */
export function prepareRoomOwnerImage() {
  return preloadImage(ownerSprite.url);
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
  void prepareRoomOwnerImage();
}