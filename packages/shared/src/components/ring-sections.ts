import { CIRCLE_CIRCUMFERENCE } from "@flixlix-cards/shared/const/circle";
import { type RingSegments } from "@flixlix-cards/shared/types";
import { nothing, svg } from "lit";

/** A circle's border split into one arc per source: solar, battery, low-carbon, then grid. */
export const ringSections = (ring: RingSegments) => svg`
  <svg class="home-circle-sections">
    <circle
      class="solar"
      cx="40"
      cy="40"
      r="38"
      stroke-dasharray="${ring.solar} ${CIRCLE_CIRCUMFERENCE - ring.solar}"
      shape-rendering="geometricPrecision"
      stroke-dashoffset="-${CIRCLE_CIRCUMFERENCE - ring.solar}"
    />
    ${
      ring.battery
        ? svg`<circle
            class="battery"
            cx="40"
            cy="40"
            r="38"
            stroke-dasharray="${ring.battery} ${CIRCLE_CIRCUMFERENCE - ring.battery}"
            stroke-dashoffset="-${CIRCLE_CIRCUMFERENCE - ring.battery - ring.solar}"
            shape-rendering="geometricPrecision"
          />`
        : nothing
    }
    <circle
      class="low-carbon"
      cx="40"
      cy="40"
      r="38"
      stroke-dasharray="${ring.nonFossil} ${CIRCLE_CIRCUMFERENCE - ring.nonFossil}"
      stroke-dashoffset="-${CIRCLE_CIRCUMFERENCE - ring.nonFossil - ring.battery - ring.solar}"
      shape-rendering="geometricPrecision"
    />
    <circle
      class="grid"
      cx="40"
      cy="40"
      r="38"
      stroke-dasharray="${ring.grid} ${CIRCLE_CIRCUMFERENCE - ring.grid}"
      stroke-dashoffset="0"
      shape-rendering="geometricPrecision"
    />
  </svg>
`;
