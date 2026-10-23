// Which layout this visitor gets: "3d" (the flight) or "flat" (a plain stacked page). Flat for
// reduced motion, Data Saver, a 2G connection or no WebGL2. Decided before the first paint by the
// inline script (server HTML), and again by AwayFlag on client navigations, where that script never
// runs. No attribute at all (script off) means flat, which is also the CSS default.

export const MODE_SCRIPT = `(function(){try{var d=document.documentElement,m=window.matchMedia('(prefers-reduced-motion: reduce)').matches,c=navigator.connection,s=!!(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))),g=typeof WebGL2RenderingContext!=='undefined';d.setAttribute('data-dp',!m&&!s&&g?'3d':'flat')}catch(e){}})()`;

export function decideMode(): "3d" | "flat" {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const saver = !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType ?? "")));
  const gl2 = typeof WebGL2RenderingContext !== "undefined";
  return !reduced && !saver && gl2 ? "3d" : "flat";
}

// Whether this visit opens with the preloader (html[data-loader]). Only in the 3d layout (it loads
// the 3D), once a session, and never for the testing tools' own URLs. ?loader shows it every time;
// ?loader=off never. Runs right after MODE_SCRIPT.
export const LOADER_SCRIPT = `(function(){try{var d=document.documentElement;if(d.getAttribute('data-dp')!=='3d')return;var q=location.search,m=/[?&]loader(=([^&]*))?/.exec(q);if(m&&m[2]==='off')return;if(!m&&(/astro-debug|sky-only|astro-only/.test(q)||sessionStorage.getItem('dp-loader')))return;d.setAttribute('data-loader','')}catch(e){}})()`;
