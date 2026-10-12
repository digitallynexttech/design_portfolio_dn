import type { TierSettings } from "@/features/stage/tier";
import type { Drop } from "../bus";
import { type GL, Program, fullscreenTriangle, whenCompiled } from "../gl";
import { RippleSim } from "./ripple-sim";
import { displayFrag, fullscreenVert } from "./shaders";

const SIM_HZ = 60;
/**
 * Ripples have died away well before this (the velocity loses 1.5% a step, so a strong drop is
 * under 1% after five seconds); from then on the height field is flat and stepping it changes
 * nothing, so the simulation sleeps until the next drop. The light bed keeps moving.
 */
const SETTLE_MS = 7000;

// Shader colours are written straight to the framebuffer (no colour management), so pass sRGB as-is.
function srgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
const INK = srgb("#0a0a0a");
const TEAL = srgb("#0ec8c5");
const PAPER = srgb("#fafaf8");

function columnsFor(rows: number, width: number, height: number): number {
  return Math.max(8, Math.round((rows * width) / Math.max(1, height)));
}

/** The water: a ripple simulation shaded as a dark pool lit from below. Owns its GPU resources. */
export class WaterSurface {
  private readonly triangle: { vao: WebGLVertexArrayObject; buffer: WebGLBuffer };
  private readonly display: Program;
  private readonly sim: RippleSim;
  /** Resolves when every shader has compiled (in the background); rejects if this GPU can't run it. */
  readonly ready: Promise<void>;
  private cols: number;
  private aspect: number;
  private accumulator = 0;
  private lastDrop = -Infinity;

  constructor(
    private readonly gl: GL,
    private readonly settings: TierSettings,
    width: number,
    height: number,
  ) {
    this.triangle = fullscreenTriangle(gl);
    this.cols = columnsFor(settings.surfaceRes, width, height);
    this.aspect = width / Math.max(1, height);
    this.sim = new RippleSim(gl, this.triangle.vao, this.cols, settings.surfaceRes);
    this.display = new Program(gl, fullscreenVert, displayFrag, ["position"]);
    this.ready = this.sim.supported() ? whenCompiled(gl, [this.display, ...this.sim.programs]) : Promise.reject(new Error("no float targets"));
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
  }

  /** Only rebuilds the simulation when the aspect really changes, so a phone's collapsing URL bar doesn't wipe the ripples. */
  resize(width: number, height: number): void {
    this.aspect = width / Math.max(1, height);
    const cols = columnsFor(this.settings.surfaceRes, width, height);
    if (Math.abs(cols - this.cols) / this.cols > 0.08) {
      this.cols = cols;
      this.sim.resize(cols, this.settings.surfaceRes);
    }
  }

  addDrop(drop: Drop, now = performance.now()): void {
    this.sim.addDrop(drop);
    this.lastDrop = now;
  }

  /**
   * One unseen pass through every program (a weightless drop, a step, a draw), so the first frame
   * anyone sees doesn't pay for the driver's first use of them. Leaves the water as it was.
   */
  warm(seconds: number, scroll: number): void {
    this.sim.addDrop({ x: 0.5, y: 0.5, strength: 0, radius: 0.01 });
    this.sim.step(1);
    this.render(this.lastDrop, 0, seconds, scroll);
  }

  /** Steps the simulation (at a fixed rate, so waves travel at the same speed on 60 and 120 Hz screens) and draws. */
  render(now: number, delta: number, seconds: number, scroll: number): void {
    const { gl } = this;
    if (now - this.lastDrop < SETTLE_MS) {
      this.accumulator = Math.min(this.accumulator + delta, 4 / SIM_HZ);
      while (this.accumulator >= 1 / SIM_HZ) {
        this.sim.step(this.settings.substeps);
        this.accumulator -= 1 / SIM_HZ;
      }
    } else this.accumulator = 0;

    const d = this.display;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindVertexArray(this.triangle.vao);
    d.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sim.texture);
    gl.uniform1i(d.uniform("uState"), 0);
    gl.uniform2f(d.uniform("uTexel"), this.sim.texel[0], this.sim.texel[1]);
    gl.uniform1f(d.uniform("uTime"), seconds);
    gl.uniform1f(d.uniform("uAspect"), this.aspect);
    gl.uniform1f(d.uniform("uScroll"), scroll);
    gl.uniform3f(d.uniform("uInk"), ...INK);
    gl.uniform3f(d.uniform("uTeal"), ...TEAL);
    gl.uniform3f(d.uniform("uPaper"), ...PAPER);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    const { gl } = this;
    this.sim.dispose();
    this.display.dispose();
    gl.deleteVertexArray(this.triangle.vao);
    gl.deleteBuffer(this.triangle.buffer);
  }
}
