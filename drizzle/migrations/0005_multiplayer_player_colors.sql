-- Multiplayer color selection.
ALTER TABLE public.room_players
  ADD COLUMN IF NOT EXISTS player_color text,
  ADD COLUMN IF NOT EXISTS color_confirmed boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'room_players_player_color_check'
      AND conrelid = 'public.room_players'::regclass
  ) THEN
    ALTER TABLE public.room_players
      ADD CONSTRAINT room_players_player_color_check
      CHECK (player_color IS NULL OR player_color IN ('green', 'pink', 'orange', 'blue', 'white'));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS room_players_unique_confirmed_color
  ON public.room_players (room_id, player_color)
  WHERE color_confirmed = true AND player_color IS NOT NULL;

CREATE OR REPLACE FUNCTION public.room_color_action(
  p_device_id uuid, p_secret_hash text, p_room_id uuid,
  p_action text, p_color text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_player public.room_players;
  v_players jsonb;
BEGIN
  PERFORM 1 FROM public.player_devices
  WHERE id = p_device_id AND secret_hash = p_secret_hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Aparelho não autenticado.'); END IF;

  SELECT * INTO v_player FROM public.room_players
  WHERE room_id = p_room_id AND player_id = p_device_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jogador não encontrado nesta sala.'); END IF;

  IF p_action = 'confirm' THEN
    IF v_player.color_confirmed THEN
      IF v_player.player_color IS DISTINCT FROM p_color THEN
        RETURN jsonb_build_object('error', 'Sua cor já foi confirmada e está bloqueada.');
      END IF;
    ELSE
      IF p_color IS NULL OR p_color NOT IN ('green', 'pink', 'orange', 'blue', 'white') THEN
        RETURN jsonb_build_object('error', 'Cor inválida.');
      END IF;
      BEGIN
        UPDATE public.room_players
        SET player_color = p_color, color_confirmed = true
        WHERE room_id = p_room_id AND player_id = p_device_id AND color_confirmed = false
        RETURNING * INTO v_player;
      EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('error', 'Essa cor já foi confirmada por outro jogador.');
      END;
    END IF;
  ELSIF p_action <> 'get' THEN
    RETURN jsonb_build_object('error', 'Ação inválida.');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'player_id', rp.player_id,
    'player_color', rp.player_color,
    'color_confirmed', rp.color_confirmed
  )), '[]'::jsonb)
  INTO v_players
  FROM public.room_players rp WHERE rp.room_id = p_room_id;

  RETURN jsonb_build_object(
    'players', v_players,
    'player_color', v_player.player_color,
    'color_confirmed', v_player.color_confirmed
  );
END;
$$;
