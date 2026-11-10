import { useSyncExternalStore } from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerPlayerDevice, roomAction } from "./rooms.functions";
import { deviceSchema, type DeviceIdentity, type SavedRoom } from "./room-contract";
import { getSettings } from "./settings";
import { session, setRoomOwner } from "./session";

const DEVICE_KEY = "pnh-player-device-v1";
const ROOM_KEY = "pnh-active-room-v1";
type RoomState = { saved: SavedRoom | null; pending: boolean; error: string | null };
const EMPTY: RoomState = { saved: null, pending: false, error: null };
let state = EMPTY;
const listeners = new Set<() => void>();
let device: DeviceIdentity | null = null;
let devicePending: Promise<DeviceIdentity> | null = null;
let pending: Promise<void> | null = null;
let activeId: string | null = null;
let loaded = false;
let exiting = false;
let creationInput: { roomId: string; hostName: string; maxPlayers: number } | null = null;
const publish = (patch: Partial<RoomState>) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const storage = {
  read(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* memória durante esta visita */ } },
  remove(key: string) { try { localStorage.removeItem(key); } catch { /* memória durante esta visita */ } },
};

export function useRoomState() { return useSyncExternalStore(subscribe, () => state, () => EMPTY); }

function storedDevice() {
  try { return deviceSchema.safeParse(JSON.parse(storage.read(DEVICE_KEY) ?? "null")); }
  catch { return deviceSchema.safeParse(null); }
}

export function useRoomActions() {
  const register = useServerFn(registerPlayerDevice);
  const action = useServerFn(roomAction);
  const identify = (): Promise<DeviceIdentity> => {
    if (device) return Promise.resolve(device);
    if (devicePending) return devicePending;
    const saved = storedDevice();
    if (saved.success) { device = saved.data; return Promise.resolve(device); }
    devicePending = register().then((value) => {
      device = value; storage.write(DEVICE_KEY, JSON.stringify(value)); return value;
    }).finally(() => { devicePending = null; });
    return devicePending;
  };
  const create = (retrying = false) => {
    if (pending || exiting) return;
    loaded = true;
    if (!retrying || !creationInput) {
      creationInput = { roomId: crypto.randomUUID(), hostName: getSettings().playerName, maxPlayers: session.playerCount };
    }
    activeId = creationInput.roomId;
    storage.write(ROOM_KEY, activeId);
    const { roomId, hostName, maxPlayers } = creationInput;
    setRoomOwner();
    publish({ saved: null, pending: true, error: null });
    // Microtask keeps credential/network work out of the animation click handler.
    pending = Promise.resolve().then(identify).then(async (identity) => {
      session.owner = { id: identity.id, name: hostName };
      const saved = await action({ data: { device: identity, action: "create", roomId, hostName, maxPlayers } });
      publish({ saved, pending: false });
    }).catch(() => publish({ pending: false, error: "Não foi possível criar a sala. Toque no olho para tentar novamente." }))
      .finally(() => { pending = null; });
  };
  const restore = () => {
    if (loaded || pending) return;
    loaded = true;
    activeId = storage.read(ROOM_KEY);
    if (!activeId || !storedDevice().success) return;
    const roomId = activeId;
    publish({ pending: true });
    pending = identify().then(async (identity) => {
      const saved = await action({ data: { device: identity, action: "read", roomId } });
      publish({ saved, pending: false });
      if (!saved) { activeId = null; storage.remove(ROOM_KEY); }
    }).catch(() => publish({ pending: false, error: "Não foi possível consultar a sala. Toque no olho para tentar novamente." }))
      .finally(() => { pending = null; });
  };
  const leave = async () => {
    if (exiting) return false;
    exiting = true;
    try {
      await pending;
      if (activeId) {
        await action({ data: { device: await identify(), action: "delete", roomId: activeId } });
      }
      activeId = null; storage.remove(ROOM_KEY); loaded = false; creationInput = null;
      publish({ saved: null, pending: false, error: null });
      session.owner = null;
      return true;
    } catch {
      publish({ error: "Não foi possível sair da sala. Tente novamente." });
      return false;
    } finally { exiting = false; }
  };
  const retry = () => { if (state.error && !pending) { if (state.saved || !creationInput) { loaded = false; restore(); } else create(true); } };
  return { create, restore, leave, retry };
}