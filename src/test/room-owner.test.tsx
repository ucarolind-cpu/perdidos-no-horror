import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import owner from "@/assets/room-owner.webp.asset.json";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Preparação do dono da sala", () => {
  it("reutiliza o mesmo elemento e decodifica apenas uma vez entre visitas", async () => {
    vi.resetModules();
    const loaded: HTMLImageElement[] = [];
    const decode = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("Image", class {
      constructor() {
        const image = document.createElement("img");
        image.decode = decode;
        loaded.push(image);
        return image;
      }
    });
    const { preloadCreateRoomAssets, prepareRoomOwnerImage } = await import("@/game/preload");
    preloadCreateRoomAssets();
    const pending = prepareRoomOwnerImage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.getAttribute("src")).toBe(owner.url);
    expect(loaded[0]?.decoding).toBe("async");
    loaded[0]?.dispatchEvent(new Event("load"));
    const image = await pending;
    const { RoomOwner } = await import("@/game/RoomOwner");
    const first = render(<RoomOwner />);
    await act(async () => {});
    expect(first.container.querySelector("img")).toBe(image);
    first.unmount();
    const second = render(<RoomOwner />);
    await act(async () => {});
    expect(second.container.querySelector("img")).toBe(image);
    expect(loaded).toHaveLength(1);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("falha sem imagem quebrada e permite uma nova tentativa", async () => {
    vi.resetModules();
    const loaded: HTMLImageElement[] = [];
    vi.stubGlobal("Image", class {
      constructor() { const image = document.createElement("img"); loaded.push(image); return image; }
    });
    const { prepareRoomOwnerImage } = await import("@/game/preload");
    const pending = prepareRoomOwnerImage();
    loaded[0]?.dispatchEvent(new Event("error"));
    expect(await pending).toBeNull();
    void prepareRoomOwnerImage();
    expect(loaded).toHaveLength(2);
  });

  it("identifica o dono local pelo nome configurado no momento da criação", async () => {
    const { updateSettings } = await import("@/game/settings");
    const { session, setRoomOwner } = await import("@/game/session");
    updateSettings({ playerName: "ANA" });
    setRoomOwner();
    expect(session.owner).toEqual({ id: "local-owner", name: "ANA" });
    updateSettings({ playerName: "JOSÉ" });
    setRoomOwner();
    expect(session.owner?.name).toBe("JOSÉ");
  });
});