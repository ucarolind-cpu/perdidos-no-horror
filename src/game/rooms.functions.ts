import { createServerFn } from "@tanstack/react-start";
import { deviceSchema, memberActionSchema, roomActionSchema, roomColorActionSchema, savedRoomSchema } from "./room-contract";

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

export const validatePlayerDevice = createServerFn({ method: "POST" })
  .inputValidator((input) => deviceSchema.parse(input))
  .handler(async ({ data }) => {
    const secretHash = await hashSecret(data.secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: registered, error } = await supabaseAdmin.from("player_devices")
      .select("id").eq("id", data.id).eq("secret_hash", secretHash).maybeSingle();
    if (error) {
      console.error("[Rooms] device validation failed:", error);
      throw new Error(error.message);
    }
    return Boolean(registered);
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
    // Older device_room_action responses may omit game_mode; the room creation
    // RPC stores max_players as the authoritative equivalent for host-created rooms.
    const normalizedResult = result && typeof result === "object" && "room" in result
      ? { ...result, room: { ...result.room, game_mode: result.room.game_mode ?? result.room.max_players } }
      : result;
    return { ...savedRoomSchema.parse(normalizedResult), isHost: true };
  });

export const memberRoomAction = createServerFn({ method: "POST" })
  .inputValidator((input) => memberActionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const secretHash = await hashSecret(data.device.secret);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // RPC verifies the device secret and membership inside the locked transaction.
      const { data: result, error } = await supabaseAdmin.rpc("room_member_action", {
        p_device_id: data.device.id, p_secret_hash: secretHash, p_action: data.action,
        ...(data.roomId ? { p_room_id: data.roomId } : {}),
        ...(data.code ? { p_code: data.code } : {}), ...(data.name ? { p_name: data.name } : {}),
      });
      if (error) {
        console.error("[Rooms] room_member_action failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
        return { saved: null, error: `Erro Supabase ${error.code ?? ""}: ${error.message}${error.details ? ` — ${error.details}` : ""}${error.hint ? ` — ${error.hint}` : ""}`.trim() };
      }
      if (!result) return { saved: null, error: null };
      if (typeof result === "object" && !Array.isArray(result) && "error" in result) {
        const serverError = result["error"];
        return { saved: null, error: typeof serverError === "string" ? serverError : "Sala não encontrada" };
      }
      return { saved: savedRoomSchema.parse(result), error: null };
    } catch (error) {
      console.error("[Rooms] member room action failed:", error);
      return { saved: null, error: error instanceof Error ? `Falha ao processar entrada: ${error.message}` : "Falha desconhecida ao processar entrada." };
    }
  });

// Color actions remain server-side so the device secret is checked before
// either reading room colors or invoking the restricted save RPC.
export const roomColorAction = createServerFn({ method: "POST" })
  .inputValidator((input) => roomColorActionSchema.parse(input))
  .handler(async ({ data }) => {
    const secretHash = await hashSecret(data.device.secret);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: registeredDevice, error: deviceError } = await supabaseAdmin
      .from("player_devices")
      .select("id")
      .eq("id", data.device.id)
      .eq("secret_hash", secretHash)
      .maybeSingle();

    if (deviceError || !registeredDevice) {
      console.error("[Rooms] color action device authentication failed:", deviceError);
      throw new Error(deviceError?.message ?? "Aparelho não autenticado.");
    }

    if (data.action === "confirm") {
      if (!data.color) throw new Error("Selecione uma cor antes de confirmar.");

      const playerId = registeredDevice.id;
      const roomId = data.roomId;
      const selectedColor = data.color;

      const { error: saveError } = await (supabaseAdmin as any).rpc("salvar_cor_jogador", {
        p_device_id: playerId,
        p_room_id: roomId,
        p_color: selectedColor,
      });

      if (saveError) {
        console.error("[Rooms] salvar_cor_jogador failed:", {
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint,
        });
        throw new Error(`Erro Supabase ${saveError.code ?? ""}: ${saveError.message}`.trim());
      }
    }

    // These room color columns were added after the generated Database types.
    const { data: players, error: playersError } = await (supabaseAdmin as any)
      .from("room_players")
      .select("player_id, player_color, color_confirmed")
      .eq("room_id", data.roomId);

    if (playersError) {
      console.error("[Rooms] room color list failed:", playersError);
      throw new Error(`Erro Supabase ${playersError.code ?? ""}: ${playersError.message}`.trim());
    }

    const roomPlayers = players ?? [];
    const ownPlayer = roomPlayers.find((player) => player.player_id === registeredDevice.id);

    if (!ownPlayer) {
      throw new Error("Este jogador não pertence a esta sala.");
    }

    if (data.action === "confirm" && (!ownPlayer.color_confirmed || ownPlayer.player_color !== data.color)) {
      throw new Error("O Supabase não confirmou a cor selecionada.");
    }

    return {
      players: roomPlayers,
      player_color: ownPlayer.player_color,
      color_confirmed: ownPlayer.color_confirmed,
    };
  });
