import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sprite from "@/assets/dono-sala.webp.asset.json";

describe("Personagem preparado do dono", () => {
  const images: HTMLImageElement[] = [];
  const decode = vi.fn(() => Promise.resolve());
  beforeEach(() => {
    vi.resetModules();
    images.length = 0;
    decode.mockClear();
    vi.stubGlobal("Image", class {
      constructor() {
        const image = document.createElement("img");
        image.decode = decode;
        images.push(image);
        return image;
      }
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("prepara uma única imagem e reutiliza o mesmo elemento decodificado ao reabrir", async () => {
    const cache = await import("@/game/ownerSprite");
    expect(images).toHaveLength(0);
    const pending = cache.prepareOwnerSprite();
    expect(cache.prepareOwnerSprite()).toBe(pending);
    const image = images[0];
    if (!image) throw new Error("Imagem não preparada");
    expect(image.getAttribute("src")).toBe(sprite.url);
    expect(image.decoding).toBe("async");
    image.dispatchEvent(new Event("load"));
    await pending;
    const { OwnerCharacter } = await import("@/game/OwnerCharacter");
    const first = render(<OwnerCharacter />);
    expect(first.container.querySelector("img")).toBe(image);
    first.unmount();
    const reopened = render(<OwnerCharacter />);
    expect(reopened.container.querySelector("img")).toBe(image);
    expect(await cache.prepareOwnerSprite()).toBe(image);
    expect(images).toHaveLength(1);
    expect(decode).toHaveBeenCalledTimes(1);
    reopened.unmount();
  });

  it("não exibe imagem quebrada e permite nova tentativa após falha", async () => {
    const cache = await import("@/game/ownerSprite");
    const first = cache.prepareOwnerSprite();
    images[0]?.dispatchEvent(new Event("error"));
    expect(await first).toBeNull();
    expect(cache.getOwnerSprite()).toBeNull();
    const { OwnerCharacter } = await import("@/game/OwnerCharacter");
    const view = render(<OwnerCharacter />);
    expect(view.container.querySelector("img")).toBeNull();
    await act(async () => {
      images[1]?.dispatchEvent(new Event("load"));
      await cache.prepareOwnerSprite();
    });
    expect(view.container.querySelector("img")).toBe(images[1]);
    view.unmount();
  });

  it("não anexa a imagem se o jogador sair enquanto ela é preparada", async () => {
    const cache = await import("@/game/ownerSprite");
    const { OwnerCharacter } = await import("@/game/OwnerCharacter");
    const view = render(<OwnerCharacter />);
    view.unmount();
    images[0]?.dispatchEvent(new Event("load"));
    await cache.prepareOwnerSprite();
    expect(images[0]?.isConnected).toBe(false);
    expect(cache.getOwnerSprite()).toBe(images[0]);
  });
});

it("usa o nome configurado para identificar o dono sem alterar a quantidade escolhida", async () => {
  const { updateSettings, getSettings } = await import("@/game/settings");
  const { setRoomOwner, setPlayerCount, session } = await import("@/game/session");
  updateSettings({ playerName: "MARIA" });
  setPlayerCount(3);
  setRoomOwner(getSettings().playerName);
  expect(session.roomOwner?.playerName).toBe("MARIA");
  expect(session.playerCount).toBe(3);
});