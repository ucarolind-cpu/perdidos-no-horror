import { createServerFn } from "@tanstack/react-start";
import { memberActionSchema, roomActionSchema, savedRoomSchema } from "./room-contract";

async function hashSecret(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join("");
}

// Device capabilities keep the game account-free. Raw IDs never authorize access;
// the registry and atomic RPC are service-only and tables have no public policies.
export const registerPlayerDevice = createServerFn({ method: "POST" }).handler(async () => {
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) => n.toString(16).padStart(2, "0")).join("");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("player_devices").insert({ secret_hash: await hashSecret(secret) }).select("id").single();
  if (error || !data) { console.error("[Rooms] device registration failed:", error); throw new Error(error?.message ?? "Registro do aparelho não retornou dados."); }
  return { id: data.id, secret };
});

export const roomAction = createServerFn({ method: "POST" })
  .inputValidator((input) => roomActionSchema.parse(input))
  .handler(async ({ data }) => {
    const secretHash = await hashSecret(data.device.secret);
    // Privileged access is necessary to authenticate account-free device capabilities.
    // Validate against the private registry before any room read/write; RPC rechecks atomically.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: device, error: authError } = await supabaseAdmin.from("player_devices")
      .select("id").eq("id", data.device.id).eq("secret_hash", secretHash).maybeSingle();
    if (authError || !device) { console.error("[Rooms] device authentication failed:", authError); throw new Error(authError?.message ?? "Aparelho não encontrado no registro."); }
    const { data: result, error } = await supabaseAdmin.rpc("device_room_action", {
      p_device_id: device.id, p_secret_hash: secretHash, p_action: data.action,
      p_room_id: data.roomId,
      ...(data.hostName !== undefined ? { p_host_name: data.hostName } : {}),
      ...(data.maxPlayers !== undefined ? { p_max_players: data.maxPlayers } : {}),
    });
    if (error) { console.error("[Rooms] device_room_action failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint }); throw new Error(`${error.message}${error.code ? ` [${error.code}]` : ""}`); }
    if (data.action === "delete" || result === null) return null;
    return { ...savedRoomSchema.parse(result), isHost: true };
  });

export const memberRoomAction = createServerFn({ method: "POST" })
  .inputValidator((input) => memberActionSchema.parse(input))
  .handler(async ({ data }) => {
    const secretHash = await hashSecret(data.device.secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // RPC verifies the device secret and membership inside the locked transaction.
    const { data: result, error } = await supabaseAdmin.rpc("room_member_action", {
      p_device_id: data.device.id, p_secret_hash: secretHash, p_action: data.action,
      ...(data.roomId ? { p_room_id: data.roomId } : {}),
      ...(data.code ? { p_code: data.code } : {}), ...(data.name ? { p_name: data.name } : {}), ...(data.gameMode !== undefined ? { p_game_mode: data.gameMode } : {}),
    });
    if (error) { console.error("[Rooms] room_member_action failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint }); throw new Error(`${error.message}${error.code ? ` [${error.code}]` : ""}`); }
    if (!result) return { saved: null, error: null };
    if (typeof result === "object" && !Array.isArray(result) && "error" in result) {
      const serverError = result["error"];
      return { saved: null, error: typeof serverError === "string" ? serverError : "Sala não encontrada" };
    }
    return { saved: savedRoomSchema.parse(result), error: null };
  });