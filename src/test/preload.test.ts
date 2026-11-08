import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import door from "@/assets/door-scene.jpg.asset.json";
import matchstick from "@/assets/matchstick_strike.mp3.asset.json";
import background from "@/assets/espera-bg.jpg.asset.json";
import music from "@/assets/sala-espera-musica.mp3.asset.json";
import owner from "@/assets/dono-sala.webp.asset.json";

describe("Carregamento gradual dos menus", () => {
  const images: Array<{ src: string; onerror?: () => void }> = [];
  const sounds: Array<{ src: string; load: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; onerror?: (() => void) | null }> = [];
  beforeEach(() => {
    vi.resetModules(); images.length = 0; sounds.length = 0;
    vi.stubGlobal("Image", class { src = ""; constructor() { images.push(this); } });
    vi.stubGlobal("Audio", class {
      src: string; load = vi.fn(); play = vi.fn();
      constructor(url = "") { this.src = url; sounds.push(this); }
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("não carrega arquivos de telas futuras ao importar o sistema", async () => {
    await import("@/game/preload");
    expect(images).toHaveLength(0);
    expect(sounds).toHaveLength(0);
  });
  it("ao escolher jogadores carrega somente porta, fósforo e cenário da sala, silenciosamente", async () => {
    const preload = await import("@/game/preload");
    preload.preloadPlayerMenuAssets();
    preload.preloadPlayerMenuAssets();
    expect(images.map(x => x.src)).toEqual([door.url, background.url]);
    expect(sounds.map(x => x.src)).toEqual([matchstick.url]);
    expect(sounds[0]?.load).toHaveBeenCalledTimes(1);
    expect(sounds[0]?.play).not.toHaveBeenCalled();
  });
  it("ao entrar no menu criar sala prepara personagem e música sem reproduzir áudio", async () => {
    const preload = await import("@/game/preload");
    preload.preloadCreateRoomAssets();
    expect(images.map(x => x.src)).toEqual([owner.url]);
    expect(sounds.map(x => x.src)).toEqual([music.url]);
    expect(preload.acquireAudio(music.url)).toBe(sounds[0]);
    expect(sounds[0]?.play).not.toHaveBeenCalled();
  });
  it("falhas de carregamento permitem carregar normalmente depois", async () => {
    const preload = await import("@/game/preload");
    preload.preloadPlayerMenuAssets();
    images[0]?.onerror?.();
    sounds[0]?.onerror?.();
    const normal = preload.acquireAudio(matchstick.url);
    expect(normal).not.toBe(sounds[0]);
    expect(normal.src).toBe(matchstick.url);
    preload.preloadImage(door.url);
    expect(images.filter(x => x.src === door.url)).toHaveLength(2);
  });
});