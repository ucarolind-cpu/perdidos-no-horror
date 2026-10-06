/** Dados temporários da sessão (memória). Uso futuro. */
export const session = { playerCount: 2 };

export function setPlayerCount(n: number) {
  session.playerCount = n;
}

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Código visual temporário, sem O/0 e I/1. */
export function randomRoomCode() {
  return Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join("");
}
