import { getSettings } from "./settings";

/** Dados locais temporários; não representam uma sala online. */
export const session: { playerCount: number; owner: { id: string; name: string } | null } = {
  playerCount: 2,
  owner: null,
};

export function setRoomOwner() {
  session.owner = { id: "local-owner", name: getSettings().playerName };
}

export function setPlayerCount(n: number) {
  session.playerCount = n;
}

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Código visual temporário, sem O/0 e I/1. */
export function randomRoomCode() {
  return Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join("");
}
