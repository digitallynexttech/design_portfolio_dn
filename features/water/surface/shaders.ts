// GLSL for the water surface, in the classic dialect: ../gl.ts compiles it as GLSL ES 3.0 on WebGL2
// with the varying/texture2D/gl_FragColor compatibility defines.

/** One oversized triangle that covers clip space; uv runs 0→1 across the visible area. */
export const fullscreenVert = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/**
 * Wave equation on a height field. r = height, g = vertical velocity.
 * Each texel accelerates toward the average of its neighbours, then velocity is damped.
 */
export const updateFrag = /* glsl */ `
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uDamping;
  varying vec2 vUv;

  void main() {
    vec4 info = texture2D(uState, vUv);
    vec2 dx = vec2(uTexel.x, 0.0);
    vec2 dy = vec2(0.0, uTexel.y);
    float average = (
      texture2D(uState, vUv - dx).r +
      texture2D(uState, vUv + dx).r +
      texture2D(uState, vUv - dy).r +
      texture2D(uState, vUv + dy).r
    ) * 0.25;
    info.g += (average - info.r) * 2.0;
    info.g *= uDamping;
    info.r += info.g;
    // A slow pull back to flat so the surface always comes to rest.
    info.r *= 0.997;
    gl_FragColor = info;
  }
`;

/** Adds a smooth cosine-shaped bump (a drop) to the height field. */
export const dropFrag = /* glsl */ `
  uniform sampler2D uState;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uAspect;
  varying vec2 vUv;
  const float PI = 3.141592653589793;

  void main() {
    vec4 info = texture2D(uState, vUv);
    vec2 d = vUv - uCenter;
    d.x *= uAspect;
    float drop = max(0.0, 1.0 - length(d) / uRadius);
    drop = 0.5 - cos(drop * PI) * 0.5;
    info.r += drop * uStrength;
    gl_FragColor = info;
  }
`;

/**
 * Shading: a dark pool lit from below. The ripples refract the light bed and catch a specular
 * highlight, so the surface reads as water even though it is flat 2D.
 */
export const displayFrag = /* glsl */ `
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform float uTime;
  uniform float uAspect;
  uniform float uScroll;
  uniform vec3 uInk;
  uniform vec3 uTeal;
  uniform vec3 uPaper;
  varying vec2 vUv;

  // Animated caustic pattern (after Dave Hoskins' tileable water caustic), kept slow and faint.
  float caustic(vec2 p, float t) {
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 3; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 3.0;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.0);
  }

  vec3 lightBed(vec2 uv) {
    // The glow rises from the bottom of the viewport and drifts up as the page scrolls.
    float depth = clamp(1.0 - uv.y + uScroll * 0.15, 0.0, 1.6);
    float glow = pow(smoothstep(0.0, 1.35, depth), 2.4);
    vec2 p = vec2(uv.x * uAspect, uv.y) * 6.2831 * 0.9 - 250.0;
    float c = caustic(p, uTime * 0.22 + 23.0);
    vec3 col = uInk;
    col = mix(col, uTeal * 0.42, glow * 0.6);
    col += uTeal * c * (0.035 + 0.16 * glow);
    return col;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float hL = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;
    float hR = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
    float hD = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
    float hU = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
    vec3 n = normalize(vec3((hL - hR) * 4.0, (hD - hU) * 4.0, 1.0));

    vec3 col = lightBed(vUv + n.xy * 0.055);

    vec3 lightDir = normalize(vec3(-0.35, 0.55, 0.75));
    vec3 r = reflect(-lightDir, n);
    float spec = pow(max(r.z, 0.0), 40.0);
    float slope = length(n.xy);
    // Slopes facing the light catch it and slopes facing away fall dark, so rings read as 3D
    // even over the unlit middle of the pool.
    float facing = dot(n.xy, normalize(vec2(-0.5, 0.85)));
    col += mix(uPaper, uTeal, 0.45) * max(facing, 0.0) * 1.1;
    col *= 1.0 - clamp(max(-facing, 0.0) * 1.6, 0.0, 0.85);
    col += mix(uPaper, uTeal, 0.35) * spec * 0.6;
    col += uTeal * smoothstep(0.0, 0.3, slope) * 0.16;
    col = max(col, vec3(0.0));

    // Vignette, then a whisper of noise so the dark gradients never band.
    vec2 v = vUv - 0.5;
    col *= 1.0 - dot(v, v) * 0.55;
    col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0 * 2.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;
