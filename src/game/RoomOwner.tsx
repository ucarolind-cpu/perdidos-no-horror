import { memo, useEffect, useRef } from "react";
import { prepareRoomOwnerImage } from "./preload";

/** Mount the same decoded image without React state or another entrance. */
export const RoomOwner = memo(function RoomOwner() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    let mounted: HTMLImageElement | null = null;
    void prepareRoomOwnerImage().then((image) => {
      if (!active || !image || !container.current) return;
      image.alt = "Personagem do dono da sala";
      image.className = "lobby-owner-image";
      image.draggable = false;
      container.current.appendChild(image);
      mounted = image;
    });
    return () => { active = false; mounted?.remove(); };
  }, []);
  return <div ref={container} className="lobby-owner" />;
});