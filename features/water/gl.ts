// The few WebGL2 pieces the water and its shapes need, without a 3D library: programs that compile
// in the background, a full-screen triangle, and half-float render targets. The shaders keep three.js's
// classic dialect (attribute / varying / texture2D / gl_FragColor), mapped to GLSL ES 3.00 here.

export type GL = WebGL2RenderingContext;

const VERTEX_PREFIX = `#version 300 es
precision highp float;
precision highp int;
#define attribute in
#define varying out
#define texture2D texture
`;
const FRAGMENT_PREFIX = `#version 300 es
precision highp float;
precision highp int;
#define varying in
#define texture2D texture
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
`;

type ParallelCompile = { COMPLETION_STATUS_KHR: number };

/** A linked program. `ready()` is false until the driver has finished compiling it (never blocks). */
export class Program {
  readonly program: WebGLProgram;
  private readonly shaders: WebGLShader[];
  private readonly locations = new Map<string, WebGLUniformLocation | null>();
  private linked: boolean | null = null;

  constructor(
    private readonly gl: GL,
    vertex: string,
    fragment: string,
    attributes: string[] = [],
  ) {
    const program = gl.createProgram();
    this.shaders = [
      [gl.VERTEX_SHADER, VERTEX_PREFIX + vertex],
      [gl.FRAGMENT_SHADER, FRAGMENT_PREFIX + fragment],
    ].map(([type, source]) => {
      const shader = gl.createShader(type as number)!;
      gl.shaderSource(shader, source as string);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      return shader;
    });
    attributes.forEach((name, i) => gl.bindAttribLocation(program, i, name));
    gl.linkProgram(program);
    this.program = program;
  }

  /** Whether compiling has finished; throws if it failed. Without the parallel-compile extension this waits. */
  ready(parallel: ParallelCompile | null): boolean {
    if (this.linked !== null) return this.linked;
    const { gl } = this;
    if (parallel && !gl.getProgramParameter(this.program, parallel.COMPLETION_STATUS_KHR)) return false;
    this.linked = !!gl.getProgramParameter(this.program, gl.LINK_STATUS);
    if (!this.linked) {
      const log = [gl.getProgramInfoLog(this.program), ...this.shaders.map((s) => gl.getShaderInfoLog(s))].filter(Boolean).join("\n");
      throw new Error(`water shader: ${log}`);
    }
    return true;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  uniform(name: string): WebGLUniformLocation | null {
    let location = this.locations.get(name);
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.program, name);
      this.locations.set(name, location);
    }
    return location;
  }

  dispose(): void {
    for (const shader of this.shaders) this.gl.deleteShader(shader);
    this.gl.deleteProgram(this.program);
  }
}

/**
 * Resolves once every program has compiled, checking once a frame, so compiling never stalls a frame
 * the visitor sees. Rejects if one fails.
 */
export function whenCompiled(gl: GL, programs: Program[]): Promise<void> {
  const parallel = gl.getExtension("KHR_parallel_shader_compile") as ParallelCompile | null;
  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        if (programs.every((p) => p.ready(parallel))) resolve();
        else requestAnimationFrame(check);
      } catch (error) {
        reject(error);
      }
    };
    // Without the extension, asking blocks until done; do it when the page is idle.
    if (parallel) requestAnimationFrame(check);
    else setTimeout(check, 50);
  });
}

/** One oversized triangle covering clip space, bound to attribute 0 (`position`, a vec2). */
export function fullscreenTriangle(gl: GL): { vao: WebGLVertexArrayObject; buffer: WebGLBuffer } {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, buffer };
}

/** A half-float RGBA texture with its framebuffer, linearly filtered and clamped. */
export class Target {
  readonly texture: WebGLTexture;
  readonly framebuffer: WebGLFramebuffer;
  width = 0;
  height = 0;

  constructor(
    private readonly gl: GL,
    width: number,
    height: number,
  ) {
    this.texture = gl.createTexture();
    this.framebuffer = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.setSize(width, height);
  }

  setSize(width: number, height: number): void {
    const { gl } = this;
    this.width = width;
    this.height = height;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Whether the GPU can draw into it (half-float targets need an extension). */
  complete(): boolean {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok;
  }

  dispose(): void {
    this.gl.deleteTexture(this.texture);
    this.gl.deleteFramebuffer(this.framebuffer);
  }
}

/** Sizes a canvas's drawing buffer to its CSS box at a pixel ratio (as three.js's setSize did). */
export function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number, pixelRatio: number): void {
  const w = Math.floor(width * pixelRatio);
  const h = Math.floor(height * pixelRatio);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}
