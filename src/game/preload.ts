import door from "@/assets/door-scene.jpg.asset.json";
import matchstick from "@/assets/matchstick_strike.mp3.asset.json";
import menuBackground from "@/assets/menu-bg.jpg.asset.json";
import playersBackground from "@/assets/jogadores-bg.jpg.asset.json";
import multiplayerBackground from "@/assets/multijogador-bg.jpg.asset.json";
import codeBackground from "@/assets/codigo-bg.jpg.asset.json";
import settingsBackground from "@/assets/settings-bg.jpg.asset.json";
import lobbyBackground from "@/assets/espera-bg.jpg.asset.json";
import lobbyTitle from "@/assets/lobby-title.png.asset.json";
import lobbyCode from "@/assets/lobby-code.png.asset.json";
import lobbyEye from "@/assets/lobby-eye.png.asset.json";
import lobbyButton1 from "@/assets/lobby-btn1.png.asset.json";
import lobbyButton2 from "@/assets/lobby-btn2.png.asset.json";
import lobbyMusic from "@/assets/sala-espera-musica.mp3.asset.json";
import ownerSprite from "@/assets/room-owner.webp.asset.json";

const images = new Map<string, HTMLImageElement>();
const audio = new Map<string, HTMLAudioElement>();
const imageLoads = new Map<string, Promise<HTMLImageElement | null>>();
const readyImages = new Map<string, HTMLImageElement>();

// Screen art is warmed gradually in the background, never as a burst of requests.
const screenImageUrls = [
  menuBackground.url,
  playersBackground.url,
  multiplayerBackground.url,
  codeBackground.url,
  settingsBackground.url,
  door.url,
  lobbyBackground.url,
  lobbyTitle.url,
  lobbyCode.url,
  lobbyEye.url,
  lobbyButton1.url,
  lobbyButton2.url,
  ownerSprite.url,
];
let screenPreloadStarted = false;
let screenPreloadIndex = 0;

function scheduleIdle(task: () => void) {
  if (typeof window === "undefined") return;
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(task, { timeout: 2500 });
  } else {
    window.setTimeout(task, 900);
  }
}

/** Loads every screen's visual assets one by one during idle time to avoid mobile jank. */
export function preloadAllScreenImages() {
  if (typeof window === "undefined" || screenPreloadStarted) return;
  screenPreloadStarted = true;

  const loadNext = () => {
    if (screenPreloadIndex >= screenImageUrls.length) return;
    if (document.visibilityState === "hidden") {
      document.addEventListener("visibilitychange", loadNext, { once: true });
      return;
    }

    const url = screenImageUrls[screenPreloadIndex++];
    void preloadImage(url).finally(() => {
      // Yield between images so rendering and touch input keep priority on phones.
      window.setTimeout(() => scheduleIdle(loadNext), 180);
    });
  };

  scheduleIdle(loadNext);
}

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
    image.fetchPriority = "low";
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* loaded image remains usable */ }
      image.onload = null;
      image.onerror = null;
      readyImages.set(url, image);
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

export function getReadyRoomOwnerImage() {
  return readyImages.get(ownerSprite.url) ?? null;
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
