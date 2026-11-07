/**
 * Shared loading of heavy assets. A model used twenty times is downloaded, parsed and held
 * on the GPU once, and freed when the last user lets go. No browser APIs, so the counting
 * tests without a GPU; lib/cinema-engine/model-loader.ts supplies the real loader.
 */

/** Where a scene's files may come from. Only here, so a scene can never reach another site. */
export const LOCAL_ASSET = /^\/cinema\/assets\/[a-z0-9][a-z0-9-]{0,63}\.(glb|webp|jpg|png)$/;

export class AssetCache<T> {
  private entries = new Map<string, { users: number; value: Promise<T> }>();

  constructor(private load: (url: string) => Promise<T>, private free: (asset: T) => void) {}

  acquire(url: string): Promise<T> {
    const hit = this.entries.get(url);
    if (hit) { hit.users += 1; return hit.value; }
    const value = this.load(url);
    this.entries.set(url, { users: 1, value });
    // A failure is not remembered, so it can be tried again after the file is fixed.
    value.catch(() => { if (this.entries.get(url)?.value === value) this.entries.delete(url); });
    return value;
  }

  /** Lets go of one use. Safe while still loading: it is freed once it arrives. */
  release(url: string) {
    const hit = this.entries.get(url);
    if (!hit) return;
    hit.users -= 1;
    if (hit.users > 0) return;
    this.entries.delete(url);
    hit.value.then(this.free, () => {});
  }

  get size() { return this.entries.size; }
}
