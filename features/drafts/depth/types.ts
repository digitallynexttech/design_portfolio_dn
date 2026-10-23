// Shared by the server root, the journey (client) and the scene (lazy). Plain data only.

/** Station spacing along the camera's path, in world units. Station k sits at z = -k * D. */
export const STATION_DEPTH = 14;

/** A textured plane in the flight: the showreel, or one flagship. */
export type DepthPlane = {
  /** Matches the overlay's [data-box] (and, for work, its [data-case-link]). */
  key: string;
  /** Station coordinate: where the camera rests to look at it. */
  at: number;
  kind: "reel" | "work";
  /** Texture: the study's poster, or the reel's poster frame. */
  src: string;
  w: number;
  h: number;
  /** The hairline frame's colour: the client's theme accent. */
  accent: string;
  /** Which side of the corridor it hangs on (the overlay's text takes the other side). */
  side: -1 | 0 | 1;
  /** The reel's file, attached as a video texture only when the camera is near. */
  video?: string;
};

/** A mark on the depth gauge. */
export type DepthStop = {
  at: number;
  /** The overlay it jumps to (also the anchor in the stacked layout). */
  id: string;
  label: string;
  /** A short name for the phone gauge, where every stop is named in a narrow strip. */
  short: string;
};
