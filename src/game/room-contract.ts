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
export const savedRoomSchema = z.object({
  room: z.object({ id: z.string().uuid(), code: z.string().regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/), host_player_id: z.string().uuid(), host_name: z.string(), max_players: z.number().int().min(2).max(5), status: z.literal("aguardando"), created_at: z.string() }),
  players: z.array(z.object({ room_id: z.string().uuid(), player_id: z.string().uuid(), player_name: z.string(), is_host: z.boolean(), joined_at: z.string() })),
});
export type SavedRoom = z.infer<typeof savedRoomSchema>;