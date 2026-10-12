import * as THREE from "three";
import type { Drop } from "../bus";
import { dropFrag, fullscreenVert, updateFrag } from "./shaders";

const MAX_DROPS_PER_FRAME = 10;

function createTarget(cols: number, rows: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(cols, rows, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export function createFullscreenTriangle(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  return geometry;
}

/** Ping-pong wave simulation on a height field. Owns its GPU resources; call dispose(). */
export class RippleSim {
  private read: THREE.WebGLRenderTarget;
  private write: THREE.WebGLRenderTarget;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly updateMaterial: THREE.ShaderMaterial;
  private readonly dropMaterial: THREE.ShaderMaterial;
  private readonly pending: Drop[] = [];
  private aspect: number;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    cols: number,
    rows: number,
  ) {
    this.aspect = cols / rows;
    this.read = createTarget(cols, rows);
    this.write = createTarget(cols, rows);

    const texel = new THREE.Vector2(1 / cols, 1 / rows);
    this.updateMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: updateFrag,
      uniforms: { uState: { value: null }, uTexel: { value: texel }, uDamping: { value: 0.985 } },
      depthTest: false,
      depthWrite: false,
    });
    this.dropMaterial = new THREE.ShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: dropFrag,
      uniforms: {
        uState: { value: null },
        uCenter: { value: new THREE.Vector2() },
        uRadius: { value: 0.05 },
        uStrength: { value: 0 },
        uAspect: { value: this.aspect },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(createFullscreenTriangle(), this.updateMaterial);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.clear();
  }

  get texture(): THREE.Texture {
    return this.read.texture;
  }

  get texel(): THREE.Vector2 {
    return this.updateMaterial.uniforms.uTexel.value as THREE.Vector2;
  }

  resize(cols: number, rows: number): void {
    this.read.setSize(cols, rows);
    this.write.setSize(cols, rows);
    this.aspect = cols / rows;
    this.texel.set(1 / cols, 1 / rows);
    this.dropMaterial.uniforms.uAspect.value = this.aspect;
    this.clear();
  }

  /** Queue a drop; x, y are viewport-normalised with y pointing down. */
  addDrop(drop: Drop): void {
    if (this.pending.length < MAX_DROPS_PER_FRAME * 3) this.pending.push(drop);
  }

  step(substeps: number): void {
    const previous = this.renderer.getRenderTarget();

    this.quad.material = this.dropMaterial;
    for (const drop of this.pending.splice(0, MAX_DROPS_PER_FRAME)) {
      const u = this.dropMaterial.uniforms;
      u.uCenter.value.set(drop.x, 1 - drop.y);
      u.uRadius.value = drop.radius;
      u.uStrength.value = drop.strength;
      this.pass();
    }

    this.quad.material = this.updateMaterial;
    for (let i = 0; i < substeps; i++) this.pass();

    this.renderer.setRenderTarget(previous);
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
    this.updateMaterial.dispose();
    this.dropMaterial.dispose();
    this.quad.geometry.dispose();
  }

  private pass(): void {
    const material = this.quad.material as THREE.ShaderMaterial;
    material.uniforms.uState.value = this.read.texture;
    this.renderer.setRenderTarget(this.write);
    this.renderer.render(this.scene, this.camera);
    [this.read, this.write] = [this.write, this.read];
  }

  private clear(): void {
    const previous = this.renderer.getRenderTarget();
    const clearColor = new THREE.Color();
    this.renderer.getClearColor(clearColor);
    const clearAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 0);
    for (const target of [this.read, this.write]) {
      this.renderer.setRenderTarget(target);
      this.renderer.clear(true, false, false);
    }
    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.setRenderTarget(previous);
  }
}
