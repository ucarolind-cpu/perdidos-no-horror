import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roomActionSchema, savedRoomSchema } from "@/game/room-contract";

const mocks = vi.hoisted(() => ({ register: vi.fn(), action: vi.fn() }));
vi.mock("@/game/rooms.functions", () => ({ registerPlayerDevice: mocks.register, roomAction: mocks.action }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
const id = "a54f70e5-8304-4d33-9dad-df9154e3d201";
const credentials = { id, secret: "a".repeat(64) };
const input = { device: credentials, action: "create", roomId: id, hostName: "ANA", maxPlayers: 4 };
const saved = {
  room: { id, code: "A2Z9", host_player_id: id, host_name: "ANA", max_players: 4, status: "aguardando", created_at: "2026-11-09T01:00:00Z" },
  players: [{ room_id: id, player_id: id, player_name: "ANA", is_host: true, joined_at: "2026-11-09T01:00:00Z" }],
};
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); localStorage.clear(); mocks.register.mockResolvedValue(credentials); mocks.action.mockResolvedValue(saved); });
afterEach(cleanup);

describe("Regras das salas reais", () => {
  it("aceita somente modos de 2 a 5 jogadores", () => {
    for (const maxPlayers of [2, 3, 4, 5]) expect(roomActionSchema.safeParse({ ...input, maxPlayers }).success).toBe(true);
    for (const maxPlayers of [1, 6, 2.5]) expect(roomActionSchema.safeParse({ ...input, maxPlayers }).success).toBe(false);
  });
  it("código salvo tem quatro caracteres sem O, 0, I ou 1", () => {
    expect(savedRoomSchema.safeParse(saved).success).toBe(true);
    for (const code of ["O2Z9", "A0Z9", "A2I9", "A2Z1", "A2Z", "A2Z99", "a2Z9"]) {
      expect(savedRoomSchema.safeParse({ ...saved, room: { ...saved.room, code } }).success).toBe(false);
    }
  });
  it("não autoriza um aparelho com apenas o identificador", () => {
    expect(roomActionSchema.safeParse({ ...input, device: { id } }).success).toBe(false);
  });
  it("somente cria com nome e quantidade definidos", () => {
    expect(roomActionSchema.safeParse({ ...input, hostName: undefined }).success).toBe(false);
    expect(roomActionSchema.safeParse({ ...input, maxPlayers: undefined }).success).toBe(false);
  });
  it("retém o aparelho local e usa o nome das Configurações e o modo selecionado", async () => {
    const { updateSettings } = await import("@/game/settings");
    const { setPlayerCount } = await import("@/game/session");
    updateSettings({ playerName: "ANA" }); setPlayerCount(4);
    const { useRoomActions, useRoomState } = await import("@/game/rooms");
    const { result } = renderHook(() => ({ ...useRoomActions(), state: useRoomState() }));
    await act(async () => { result.current.create(); });
    expect(mocks.action).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "create", hostName: "ANA", maxPlayers: 4, device: credentials }) });
    expect(result.current.state.saved?.players[0]).toMatchObject({ player_name: "ANA", is_host: true });
    expect(JSON.parse(localStorage.getItem("pnh-player-device-v1") ?? "null").id).toBe(id);
    await act(async () => { await result.current.leave(); result.current.create(); });
    expect(mocks.register).toHaveBeenCalledTimes(1);
  });
  it("retorna imediatamente e espera o salvamento antes de excluir ao sair", async () => {
    let finish: ((value: typeof saved) => void) | undefined;
    mocks.action.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; })).mockResolvedValueOnce(null);
    const { useRoomActions, useRoomState } = await import("@/game/rooms");
    const { result } = renderHook(() => ({ ...useRoomActions(), state: useRoomState() }));
    await act(async () => { expect(result.current.create()).toBeUndefined(); result.current.create(); });
    expect(result.current.state.pending).toBe(true);
    expect(mocks.action).toHaveBeenCalledTimes(1);
    let leaving: Promise<boolean> | undefined;
    await act(async () => { leaving = result.current.leave(); });
    expect(mocks.action).toHaveBeenCalledTimes(1);
    await act(async () => { finish?.(saved); expect(await leaving).toBe(true); });
    expect(mocks.action).toHaveBeenLastCalledWith({ data: expect.objectContaining({ action: "delete", roomId: expect.any(String) }) });
    expect(result.current.state.saved).toBeNull();
    expect(localStorage.getItem("pnh-active-room-v1")).toBeNull();
  });
  it("repete a mesma criação após falha sem gerar outra sala ou mudar o modo", async () => {
    mocks.action.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(saved);
    const { setPlayerCount } = await import("@/game/session");
    setPlayerCount(5);
    const { useRoomActions, useRoomState } = await import("@/game/rooms");
    const { result } = renderHook(() => ({ ...useRoomActions(), state: useRoomState() }));
    await act(async () => { result.current.create(); });
    expect(result.current.state.error).not.toBeNull();
    setPlayerCount(2);
    await act(async () => { result.current.retry(); });
    expect(mocks.action.mock.calls[1]?.[0]).toEqual(mocks.action.mock.calls[0]?.[0]);
    expect(result.current.state.error).toBeNull();
  });
});