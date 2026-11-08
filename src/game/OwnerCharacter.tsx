import { memo, useLayoutEffect, useRef } from "react";
import { getOwnerSprite, prepareOwnerSprite } from "./ownerSprite";

/** Moves the warmed, decoded element into the scene before its first paint. */
export const OwnerCharacter = memo(function OwnerCharacter() {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let active = true;
    const attach = (image: HTMLImageElement | null) => {
      if (active && image && container.current) container.current.replaceChildren(image);
    };
    const ready = getOwnerSprite();
    if (ready) attach(ready);
    else void prepareOwnerSprite().then(attach);
    return () => {
      active = false;
      container.current?.replaceChildren();
    };
  }, []);
  return <div className="lobby-owner-character" ref={container} />;
});