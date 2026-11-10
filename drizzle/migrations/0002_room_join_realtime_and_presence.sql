ALTER TABLE public.rooms ADD COLUMN realtime_topic text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');
ALTER TABLE public.room_players ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX room_players_last_seen_idx ON public.room_players(last_seen_at);

CREATE FUNCTION public.notify_room_players() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_topic text;
BEGIN
 SELECT realtime_topic INTO v_topic FROM public.rooms WHERE id = COALESCE(NEW.room_id, OLD.room_id);
 IF v_topic IS NOT NULL THEN PERFORM realtime.send('{}'::jsonb, 'changed', 'room:' || v_topic, false); END IF;
 RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER room_players_changed AFTER INSERT OR DELETE ON public.room_players FOR EACH ROW EXECUTE FUNCTION public.notify_room_players();
CREATE FUNCTION public.notify_room_closed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM realtime.send('{}'::jsonb, 'closed', 'room:' || OLD.realtime_topic, false);
 RETURN OLD;
END; $$;
CREATE TRIGGER room_closed BEFORE DELETE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.notify_room_closed();
REVOKE ALL ON FUNCTION public.notify_room_players(), public.notify_room_closed() FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.room_member_action(p_device_id uuid, p_secret_hash text, p_action text, p_room_id uuid DEFAULT NULL, p_code text DEFAULT NULL, p_name text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_room public.rooms; v_player public.room_players;
BEGIN
 PERFORM 1 FROM public.player_devices WHERE id=p_device_id AND secret_hash=p_secret_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid device credentials' USING ERRCODE='42501'; END IF;
 IF p_action='join' THEN
   SELECT * INTO v_room FROM public.rooms WHERE code=p_code AND status='aguardando' FOR UPDATE;
   IF NOT FOUND THEN RETURN jsonb_build_object('error','Sala não encontrada'); END IF;
   SELECT * INTO v_player FROM public.room_players WHERE room_id=v_room.id AND player_id=p_device_id;
   IF NOT FOUND THEN
     IF (SELECT count(*) FROM public.room_players WHERE room_id=v_room.id) >= v_room.max_players THEN RETURN jsonb_build_object('error','Sala cheia'); END IF;
     IF p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 16 THEN RAISE EXCEPTION 'Invalid name'; END IF;
     INSERT INTO public.room_players(room_id,player_id,player_name,is_host) VALUES(v_room.id,p_device_id,trim(p_name),false);
   END IF;
 ELSIF p_action IN ('read','heartbeat','leave') THEN
   SELECT * INTO v_room FROM public.rooms WHERE id=p_room_id FOR UPDATE;
   IF NOT FOUND THEN RETURN NULL; END IF;
   SELECT * INTO v_player FROM public.room_players WHERE room_id=v_room.id AND player_id=p_device_id;
   IF NOT FOUND THEN RETURN NULL; END IF;
   IF p_action='leave' THEN
     IF v_player.is_host THEN DELETE FROM public.rooms WHERE id=v_room.id;
     ELSE DELETE FROM public.room_players WHERE room_id=v_room.id AND player_id=p_device_id; END IF;
     RETURN NULL;
   END IF;
 ELSE RAISE EXCEPTION 'Invalid action'; END IF;
 UPDATE public.room_players SET last_seen_at=now() WHERE room_id=v_room.id AND player_id=p_device_id;
 RETURN jsonb_build_object('room',to_jsonb(v_room),'players',COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.is_host DESC,p.joined_at,p.player_id) FROM public.room_players p WHERE p.room_id=v_room.id),'[]'::jsonb),'isHost',v_room.host_player_id=p_device_id);
END; $$;
REVOKE ALL ON FUNCTION public.room_member_action(uuid,text,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.room_member_action(uuid,text,text,uuid,text,text) TO service_role;

CREATE FUNCTION public.cleanup_disconnected_room_players() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_room record;
BEGIN
 FOR v_room IN SELECT id FROM public.rooms ORDER BY id FOR UPDATE SKIP LOCKED LOOP
   IF EXISTS(SELECT 1 FROM public.room_players WHERE room_id=v_room.id AND is_host AND last_seen_at < now()-interval '90 seconds') THEN
     DELETE FROM public.rooms WHERE id=v_room.id;
   ELSE
     DELETE FROM public.room_players WHERE room_id=v_room.id AND NOT is_host AND last_seen_at < now()-interval '90 seconds';
   END IF;
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.cleanup_disconnected_room_players() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_disconnected_room_players() TO service_role;
