CREATE TABLE public.player_devices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 secret_hash text NOT NULL CHECK (length(secret_hash) = 64),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.player_devices TO service_role;
ALTER TABLE public.player_devices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rooms (
 id uuid PRIMARY KEY,
 code text NOT NULL UNIQUE CHECK (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$'),
 host_player_id uuid NOT NULL REFERENCES public.player_devices(id),
 host_name text NOT NULL CHECK (char_length(host_name) BETWEEN 1 AND 16),
 max_players integer NOT NULL CHECK (max_players BETWEEN 2 AND 5),
 status text NOT NULL DEFAULT 'aguardando' CHECK (status = 'aguardando'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(host_player_id)
);
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE INDEX rooms_created_at_idx ON public.rooms(created_at);

CREATE TABLE public.room_players (
 room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES public.player_devices(id),
 player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 16),
 is_host boolean NOT NULL DEFAULT false,
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(room_id, player_id)
);
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;

CREATE FUNCTION public.device_room_action(p_device_id uuid, p_secret_hash text, p_action text, p_room_id uuid, p_host_name text DEFAULT NULL, p_max_players integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 v_room public.rooms;
 v_code text;
 v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 v_attempt integer;
BEGIN
 -- Credentials are server-hashed, high-entropy capabilities, not client IDs alone.
 PERFORM 1 FROM public.player_devices WHERE id = p_device_id AND secret_hash = p_secret_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid device credentials' USING ERRCODE = '42501'; END IF;
 IF p_action = 'delete' THEN
   DELETE FROM public.rooms WHERE id = p_room_id AND host_player_id = p_device_id;
   RETURN jsonb_build_object('deleted', true);
 ELSIF p_action = 'create' THEN
   IF p_max_players IS NULL OR p_max_players NOT BETWEEN 2 AND 5 OR p_host_name IS NULL OR char_length(trim(p_host_name)) NOT BETWEEN 1 AND 16 THEN
     RAISE EXCEPTION 'Invalid room parameters' USING ERRCODE = '22023';
   END IF;
   SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id AND host_player_id = p_device_id;
   IF NOT FOUND THEN
     DELETE FROM public.rooms WHERE host_player_id = p_device_id;
     FOR v_attempt IN 1..64 LOOP
       v_code := '';
       FOR i IN 1..4 LOOP
         v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::integer, 1);
       END LOOP;
       BEGIN
         INSERT INTO public.rooms(id, code, host_player_id, host_name, max_players)
         VALUES(p_room_id, v_code, p_device_id, trim(p_host_name), p_max_players) RETURNING * INTO v_room;
         EXIT;
       EXCEPTION WHEN unique_violation THEN
         IF v_attempt = 64 THEN RAISE EXCEPTION 'Room allocation failed'; END IF;
       END;
     END LOOP;
     INSERT INTO public.room_players(room_id, player_id, player_name, is_host)
       VALUES(v_room.id, p_device_id, v_room.host_name, true);
   END IF;
 ELSIF p_action = 'read' THEN
   SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id AND host_player_id = p_device_id;
 ELSE
   RAISE EXCEPTION 'Invalid action' USING ERRCODE = '22023';
 END IF;
 IF v_room.id IS NULL THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('room', to_jsonb(v_room), 'players', COALESCE((
   SELECT jsonb_agg(to_jsonb(p) ORDER BY p.is_host DESC, p.joined_at, p.player_id)
   FROM public.room_players p WHERE p.room_id = v_room.id
 ), '[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.device_room_action(uuid, text, text, uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.device_room_action(uuid, text, text, uuid, text, integer) TO service_role;
