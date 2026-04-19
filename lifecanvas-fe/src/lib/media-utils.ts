/** Detect data URLs produced by FileReader for video files. */
export function isVideoDataUrl(uri: string): boolean {
  return uri.startsWith("data:video/");
}

/** GIF data URLs (animated or not) — not used as static album covers. */
export function isGifDataUrl(uri: string): boolean {
  return uri.startsWith("data:image/gif");
}

/** Album covers use a still image; videos and GIFs are excluded. */
export function canUseAsAlbumCover(uri: string): boolean {
  return !isVideoDataUrl(uri) && !isGifDataUrl(uri);
}

/** Stable unique id for gallery items (avoids collisions from Date.now() alone). */
export function newGalleryPhotoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/**
 * Encode images smaller for localStorage (browser quota is often ~5MB).
 * Videos pass through unchanged (still large; user may hit quota sooner).
 */
export async function fileToGalleryDataUrl(file: File): Promise<string> {
  if (file.type.startsWith("video/")) {
    return readFileAsDataUrl(file);
  }
  if (!file.type.startsWith("image/")) {
    return readFileAsDataUrl(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (!w || !h) {
      return readFileAsDataUrl(file);
    }
    const maxDim = 2048;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return readFileAsDataUrl(file);
    }
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.82),
    );
    if (!blob) {
      return readFileAsDataUrl(file);
    }
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("encode"));
      r.readAsDataURL(blob);
    });
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(url);
  }
}
