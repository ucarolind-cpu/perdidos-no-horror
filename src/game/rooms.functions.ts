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
  if (error || !data) throw new Error("Não foi possível identificar este aparelho. Tente novamente.");
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
    if (authError || !device) throw new Error("Não foi possível validar este aparelho.");
    const { data: result, error } = await supabaseAdmin.rpc("device_room_action", {
      p_device_id: device.id, p_secret_hash: secretHash, p_action: data.action,
      p_room_id: data.roomId,
      ...(data.hostName !== undefined ? { p_host_name: data.hostName } : {}),
      ...(data.maxPlayers !== undefined ? { p_max_players: data.maxPlayers } : {}),
    });
    if (error) throw new Error("Não foi possível atualizar a sala. Tente novamente.");
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
      ...(data.code ? { p_code: data.code } : {}), ...(data.name ? { p_name: data.name } : {}),
    });
    if (error) throw new Error("Não foi possível atualizar a sala. Tente novamente.");
    if (!result) return { saved: null, error: null };
    if (typeof result === "object" && !Array.isArray(result) && "error" in result) {
      return { saved: null, error: result.error === "Sala cheia" ? "Sala cheia" : "Sala não encontrada" };
    }
    return { saved: savedRoomSchema.parse(result), error: null };
  });