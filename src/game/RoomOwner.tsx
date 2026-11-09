import { memo, useLayoutEffect, useRef } from "react";
import { getReadyRoomOwnerImage, prepareRoomOwnerImage } from "./preload";

/** Mount the same decoded image without React state or another entrance. */
export const RoomOwner = memo(function RoomOwner() {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let active = true;
    let mounted: HTMLImageElement | null = null;
    const attach = (image: HTMLImageElement | null) => {
      if (!active || !image || !container.current) return;
      image.alt = "Personagem do dono da sala";
      image.className = "lobby-owner-image";
      image.draggable = false;
      container.current.appendChild(image);
      mounted = image;
    };
    const ready = getReadyRoomOwnerImage();
    if (ready) attach(ready);
    else void prepareRoomOwnerImage().then(attach);
    return () => { active = false; mounted?.remove(); };
  }, []);
  return <div ref={container} className="lobby-owner" />;
});