// TSL node graphs mix float, vec3 and colour nodes freely; @types/three types every node by its
// GLSL type, which turns shader plumbing into cast noise. Graph values that cross helper boundaries
// use this alias; everything else stays typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type N = any;
