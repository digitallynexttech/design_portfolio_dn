// The wake: a wave-equation height field in a window that travels with the boat (draft 1's ripple
// simulation, rebuilt in TSL). Two render targets ping-pong; each frame runs an even number of steps
// so the latest state always lands in target A, which the water samples.
import * as THREE from "three/webgpu";
import { float, max, smoothstep, step, texture, uniform, uv, vec2, vec4 } from "three/tsl";

export const SIM_SIZE = 76; // metres covered by the window
const DROPS = 8;

export type Ripple = ReturnType<typeof createRipple>;

export function createRipple(renderer: THREE.WebGPURenderer, res: number) {
  const opts = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  };
  const a = new THREE.RenderTarget(res, res, opts);
  const b = new THREE.RenderTarget(res, res, opts);
  const texel = 1 / res;
  const center = new THREE.Vector2();
  const centerU = uniform(new THREE.Vector2());
  const shift = uniform(new THREE.Vector2());
  const damping = uniform(0.991);
  // Wave speed: about 9 m/s whatever the resolution (two steps per frame at 60 fps), close to the
  // boat's own speed, so a moving hull draws a V-shaped wake instead of rings racing ahead of it.
  const texelMetres = SIM_SIZE / res;
  const speed = Math.min(0.5, 9 / (120 * texelMetres));
  const c2 = speed * speed;
  const drops = Array.from({ length: DROPS }, () => uniform(new THREE.Vector4(0, 0, 0, 0)));
  let queued: THREE.Vector4[] = [];

  /** One wave-equation step reading `from`. Only the A→B pass shifts the window and adds drops. */
  function stepMaterial(from: THREE.RenderTarget, first: boolean) {
    const m = new THREE.MeshBasicNodeMaterial({ depthTest: false, depthWrite: false });
    const base = uv().add(first ? shift : vec2(0, 0));
    const sample = (offset: [number, number]) => {
      const p = base.add(vec2(offset[0] * texel, offset[1] * texel));
      const inside = step(0, p.x).mul(step(p.x, 1)).mul(step(0, p.y)).mul(step(p.y, 1));
      return texture(from.texture, p).mul(inside);
    };
    const c = sample([0, 0]);
    const sum = sample([1, 0]).x.add(sample([-1, 0]).x).add(sample([0, 1]).x).add(sample([0, -1]).x);
    // Discrete wave equation: next = 2h − previous + c²·∇²h.
    let next = c.x.mul(2).sub(c.y).add(sum.sub(c.x.mul(4)).mul(c2)).mul(damping);
    if (first) {
      for (const d of drops) {
        const dist = uv().sub(d.xy).length();
        next = next.add(d.w.mul(float(1).sub(dist.div(d.z.max(1e-4)).clamp(0, 1)).pow(2)));
      }
    }
    // Soak the edges so waves never reflect off the window's border.
    const e = uv().sub(0.5).abs();
    const edge = float(1).sub(smoothstep(0.42, 0.5, max(e.x, e.y)));
    m.colorNode = vec4(next.mul(edge).clamp(-2, 2), c.x, 0, 1);
    return m;
  }

  const quadAB = new THREE.QuadMesh(stepMaterial(a, true));
  const quadBA = new THREE.QuadMesh(stepMaterial(b, false));

  return {
    /** The latest height field (red channel). */
    texture: a.texture,
    centerU,
    texel,
    /** Queue a disturbance at world (x, z); radius in metres, strength ±. */
    drop(x: number, z: number, radius: number, strength: number) {
      if (queued.length >= DROPS) queued.shift();
      queued.push(new THREE.Vector4((x - center.x) / SIM_SIZE + 0.5, (z - center.y) / SIM_SIZE + 0.5, radius / SIM_SIZE, strength));
    },
    /** Move the window to follow (x, z), snapped to whole texels, and run `pairs` double steps. */
    update(x: number, z: number, pairs: number) {
      const size = SIM_SIZE * texel;
      const nx = Math.round(x / size) * size;
      const nz = Math.round(z / size) * size;
      shift.value.set((nx - center.x) / SIM_SIZE, (nz - center.y) / SIM_SIZE);
      center.set(nx, nz);
      centerU.value.copy(center);
      const previous = renderer.getRenderTarget();
      for (let p = 0; p < pairs; p++) {
        drops.forEach((d, i) => d.value.copy(p === 0 && queued[i] ? queued[i] : new THREE.Vector4(0, 0, 0, 0)));
        renderer.setRenderTarget(b);
        quadAB.render(renderer);
        shift.value.set(0, 0);
        renderer.setRenderTarget(a);
        quadBA.render(renderer);
      }
      queued = [];
      renderer.setRenderTarget(previous);
    },
    dispose() {
      a.dispose();
      b.dispose();
      (quadAB.material as THREE.Material).dispose();
      (quadBA.material as THREE.Material).dispose();
    },
  };
}
