import type { Drop } from "../bus";
import { type GL, Program, Target } from "../gl";
import { dropFrag, fullscreenVert, updateFrag } from "./shaders";

const MAX_DROPS_PER_FRAME = 10;

/** Ping-pong wave simulation on a height field. Owns its GPU resources; call dispose(). */
export class RippleSim {
  private read: Target;
  private write: Target;
  readonly programs: Program[];
  private readonly update: Program;
  private readonly drop: Program;
  private readonly pending: Drop[] = [];
  private aspect: number;
  readonly texel: [number, number];

  constructor(
    private readonly gl: GL,
    private readonly triangle: WebGLVertexArrayObject,
    cols: number,
    rows: number,
  ) {
    this.aspect = cols / rows;
    this.texel = [1 / cols, 1 / rows];
    this.read = new Target(gl, cols, rows);
    this.write = new Target(gl, cols, rows);
    this.update = new Program(gl, fullscreenVert, updateFrag, ["position"]);
    this.drop = new Program(gl, fullscreenVert, dropFrag, ["position"]);
    this.programs = [this.update, this.drop];
    this.clear();
  }

  get texture(): WebGLTexture {
    return this.read.texture;
  }

  /** Whether this GPU can render into half-float targets at all. */
  supported(): boolean {
    return this.read.complete() && this.write.complete();
  }

  resize(cols: number, rows: number): void {
    this.read.setSize(cols, rows);
    this.write.setSize(cols, rows);
    this.aspect = cols / rows;
    this.texel[0] = 1 / cols;
    this.texel[1] = 1 / rows;
    this.clear();
  }

  /** Queue a drop; x, y are viewport-normalised with y pointing down. */
  addDrop(drop: Drop): void {
    if (this.pending.length < MAX_DROPS_PER_FRAME * 3) this.pending.push(drop);
  }

  step(substeps: number): void {
    const { gl } = this;
    gl.bindVertexArray(this.triangle);
    gl.viewport(0, 0, this.read.width, this.read.height);

    if (this.pending.length) {
      this.drop.use();
      gl.uniform1f(this.drop.uniform("uAspect"), this.aspect);
      for (const drop of this.pending.splice(0, MAX_DROPS_PER_FRAME)) {
        gl.uniform2f(this.drop.uniform("uCenter"), drop.x, 1 - drop.y);
        gl.uniform1f(this.drop.uniform("uRadius"), drop.radius);
        gl.uniform1f(this.drop.uniform("uStrength"), drop.strength);
        this.pass(this.drop);
      }
    }

    this.update.use();
    gl.uniform2f(this.update.uniform("uTexel"), this.texel[0], this.texel[1]);
    gl.uniform1f(this.update.uniform("uDamping"), 0.985);
    for (let i = 0; i < substeps; i++) this.pass(this.update);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
    for (const program of this.programs) program.dispose();
  }

  private pass(program: Program): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.write.framebuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.read.texture);
    gl.uniform1i(program.uniform("uState"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [this.read, this.write] = [this.write, this.read];
  }

  private clear(): void {
    const { gl } = this;
    gl.clearColor(0, 0, 0, 0);
    for (const target of [this.read, this.write]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
