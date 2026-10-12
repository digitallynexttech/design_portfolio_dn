import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps a page's <main> so route changes flow in the direction of travel (PLAN §4.2 rule 2):
 * `<PageFlow><main id="main">…</main></PageFlow>`. Use it in each page, never in a layout (layouts
 * persist, so enter and exit never fire there). Navigations without a type crossfade. The
 * persistent water canvas and the header live outside, so neither blinks.
 */
export function PageFlow({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-deeper": "nav-deeper", default: "nav-fade" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-deeper": "nav-deeper", default: "nav-fade" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
