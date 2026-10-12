"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { emitEdgeWave } from "@/features/water/bus";

type Direction = "forward" | "back" | "deeper";

type Props = Omit<ComponentProps<typeof Link>, "transitionTypes"> & {
  /** Which way the visitor travels: forward flows in from the right, back from the left, deeper from below. */
  direction?: Direction;
};

const EDGE = { forward: "right", back: "left", deeper: "bottom" } as const;

/** An internal link whose page transition (and water wave) follows the direction of travel. */
export function FlowLink({ direction = "forward", onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      transitionTypes={[`nav-${direction}`]}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) emitEdgeWave(EDGE[direction], 0.45);
      }}
    />
  );
}
