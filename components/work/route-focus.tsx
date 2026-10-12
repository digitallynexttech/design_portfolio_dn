"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noop = () => () => undefined;

/**
 * After a client-side navigation, move focus to the new page's title so keyboard and screen-reader
 * visitors start at the top of what just arrived (Next leaves focus where it was). A first load
 * (hydration) leaves focus alone.
 */
export function RouteFocus() {
  // False while hydrating the server HTML, true when this page was mounted by a navigation.
  const client = useSyncExternalStore(noop, () => true, () => false);
  const [byNavigation] = useState(client);

  useEffect(() => {
    if (!byNavigation) return;
    const title = document.querySelector<HTMLElement>("main h1");
    if (!title) return;
    if (!title.hasAttribute("tabindex")) title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }, [byNavigation]);

  return null;
}
