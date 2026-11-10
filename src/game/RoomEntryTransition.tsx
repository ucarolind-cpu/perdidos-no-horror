import { useEffect } from "react";
import { FadeToBlack } from "./FadeTransition";
import { muteBackgroundMusic } from "./audio";
import matchstick from "@/assets/matchstick_strike.mp3.asset.json";

/** Shared host/guest entry: same fade, hold, matchstick and cleanup. */
export function RoomEntryTransition({ onDone }: { onDone: () => void }) {
  useEffect(() => muteBackgroundMusic(), []);
  return <FadeToBlack to="/sala-espera" onDone={onDone} holdMs={3000} safetyMs={5000} blackSoundUrl={matchstick.url} />;
}