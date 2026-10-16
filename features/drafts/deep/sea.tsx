/**
 * The fixed sea behind the draft. Four bands of water, shallowest on top: each fades out as its
 * section scrolls away (a CSS scroll timeline, compositor only), so the page sinks section by
 * section. The shallows carry the surface light: crisp caustics and a few shafts of sun, which go
 * with them. Nothing here is read by assistive technology.
 */
export function Sea() {
  return (
    <div className="dd-sea" aria-hidden>
      <div className="dd-sea__band dd-sea__band--abyss" />
      <div className="dd-sea__band dd-sea__band--deep" />
      <div className="dd-sea__band dd-sea__band--twilight" />
      <div className="dd-sea__band dd-sea__band--shallow">
        <div className="dd-sea__shafts">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="dd-sea__caustics" />
        <div className="dd-sea__caustics dd-sea__caustics--b" />
      </div>
    </div>
  );
}
