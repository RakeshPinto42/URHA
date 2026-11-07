/**
 * The real loaders, on the shared cache. Decoding Draco needs WebAssembly and a worker, which
 * next.config.mjs allows for this one purpose. The decoder is served from this site.
 */
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AssetCache, LOCAL_ASSET } from "./assets";
import { disposeObject } from "./runtime";

let gltf: GLTFLoader | null = null;

function loader(): GLTFLoader {
  if (gltf) return gltf;
  const draco = new DRACOLoader();
  draco.setDecoderPath("/cinema/draco/");
  draco.setDecoderConfig({ type: "wasm" });
  gltf = new GLTFLoader();
  gltf.setDRACOLoader(draco);
  return gltf;
}

const models = new AssetCache<THREE.Object3D>(
  async (url) => {
    if (!LOCAL_ASSET.test(url)) throw new Error(`Not a local asset: ${url}`);
    return (await loader().loadAsync(url)).scene;
  },
  (scene) => disposeObject(scene, { includeShared: true }),
);

export const modelSource = {
  acquire: (src: string) => models.acquire(src),
  release: (src: string) => models.release(src),
};

export async function loadTexture(src: string): Promise<THREE.Texture> {
  if (!LOCAL_ASSET.test(src)) throw new Error(`Not a local asset: ${src}`);
  const t = await new THREE.TextureLoader().loadAsync(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
