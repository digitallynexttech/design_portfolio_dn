// What the reading walker's page side (reading-walker.tsx: the scroll, the rail, where the X stands)
// tells its scene (walker.scene.ts: the X's clips and turn), keyed by the element. No three.js here,
// so the page side stays light.

export type WalkState = {
  /** How fast the X goes along the rail (CSS px/s; + to the right, the way you read). */
  v: number;
  /** The way it last went: 1 right, -1 back. */
  dir: 1 | -1;
  /** At the end of the read (the next chapter or project is next), standing. */
  end: boolean;
  /** The X's height on screen (CSS px), for matching its stride to its speed. */
  h: number;
};

export const walkers = new WeakMap<HTMLElement, WalkState>();
