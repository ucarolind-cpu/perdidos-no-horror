import sprite from "@/assets/dono-sala.webp.asset.json";

let readyImage: HTMLImageElement | null = null;
let pending: Promise<HTMLImageElement | null> | null = null;

export function getOwnerSprite() {
  return readyImage;
}

/** Keeps the decoded element itself across rooms; no work is done on import. */
export function prepareOwnerSprite(): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (readyImage) return Promise.resolve(readyImage);
  if (pending) return pending;
  pending = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.alt = "Personagem do dono da sala";
    image.draggable = false;
    image.width = 134;
    image.height = 310;
    image.onload = async () => {
      try { await image.decode?.(); } catch { /* loaded images still render without decode support */ }
      image.onload = null;
      image.onerror = null;
      readyImage = image;
      resolve(image);
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      resolve(null);
    };
    image.src = sprite.url;
  }).then((image) => {
    pending = null;
    return image;
  });
  return pending;
}