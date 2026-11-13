import { z } from "zod";

export const deviceSchema = z.object({ id: z.string().uuid(), secret: z.string().regex(/^[a-f0-9]{64}$/) });
export type DeviceIdentity = z.infer<typeof deviceSchema>;
export const roomActionSchema = z.object({
  device: deviceSchema,
  action: z.enum(["create", "read", "delete"]),
  roomId: z.string().uuid(),
  hostName: z.string().trim().min(1).max(16).optional(),
  maxPlayers: z.number().int().min(2).max(5).optional(),
}).superRefine((data, ctx) => {
  if (data.action === "create" && (data.hostName === undefined || data.maxPlayers === undefined)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dados da sala incompletos." });
  }
});
export type RoomActionInput = z.infer<typeof roomActionSchema>;
export const memberActionSchema = z.object({
  device: deviceSchema, action: z.enum(["join", "read", "heartbeat", "leave"]),
  roomId: z.string().uuid().optional(), code: z.string().regex(/^[A-Z0-9]{4}$/).optional(),
  name: z.string().trim().min(1).max(16).optional(), gameMode: z.number().int().min(2).max(5).optional(),
}).superRefine((data, ctx) => {
  if (data.action === "join" ? !data.code || !data.name : !data.roomId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dados incompletos." });
});
export const savedRoomSchema = z.object({
  room: z.object({ id: z.string().uuid(), code: z.string().regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/), host_player_id: z.string().uuid(), host_name: z.string(), max_players: z.number().int().min(2).max(5), game_mode: z.number().int().min(2).max(5), status: z.literal("aguardando"), created_at: z.string(), realtime_topic: z.string().optional() }),
  players: z.array(z.object({ room_id: z.string().uuid(), player_id: z.string().uuid(), player_name: z.string(), is_host: z.boolean(), joined_at: z.string() })),
  isHost: z.boolean().optional(),
});

export const roomColorActionSchema = z.object({
  device: deviceSchema,
  roomId: z.string().uuid(),
  action: z.enum(["get", "confirm"]),
  color: z.enum(["green", "pink", "orange", "blue", "white"]).optional(),
}).superRefine((data, ctx) => {
  if (data.action === "confirm" && data.color === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione uma cor antes de confirmar." });
  }
});
export type SavedRoom = z.infer<typeof savedRoomSchema>;