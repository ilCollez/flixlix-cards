import { type HomeRing } from "@flixlix-cards/shared/card-state";
import {
  type CardMainContext,
  type FlowCardPlusConfig,
  type HomeObject,
} from "@flixlix-cards/shared/types";
import { html, nothing } from "lit";
import { ringSections } from "./ring-sections";
import { generalSecondarySpan } from "./spans/general-secondary-span";

export const homeElement = (
  main: CardMainContext,
  config: FlowCardPlusConfig,
  { home, ring, showLabel }: { home: HomeObject; ring: HomeRing; showLabel: boolean }
) => {
  const { entities } = config;
  const isHomeEntityDefined = !!entities.home?.entity;
  const noActionSet = new Set(["none", undefined]);
  const staticAction =
    !noActionSet.has(entities.home?.tap_action?.action) ||
    !noActionSet.has(entities.home?.hold_action?.action) ||
    !noActionSet.has(entities.home?.double_tap_action?.action);
  const isClickable = isHomeEntityDefined || staticAction;
  const disableEntityClick = !config.clickable_entities || !isClickable;

  return html`
    <div class="circle-container home">
      <div
        class="circle ${disableEntityClick ? "pointer-events-none" : ""}"
        tabindex=${disableEntityClick ? nothing : 0}
        role=${disableEntityClick ? nothing : "button"}
        id="home-circle"
        @click=${(e: MouseEvent) => {
          main.onEntityClick(e, entities.home, entities.home?.entity);
        }}
        @dblclick=${(e: MouseEvent) => {
          main.onEntityDoubleClick(e, entities.home, entities.home?.entity);
        }}
        @pointerdown=${(e: PointerEvent) => {
          main.onEntityPointerDown(e, entities.home, entities.home?.entity);
        }}
        @pointerup=${(e: PointerEvent) => {
          main.onEntityPointerUp(e);
        }}
        @pointercancel=${(e: PointerEvent) => {
          main.onEntityPointerUp(e);
        }}
        @keydown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
          if (e.key === "Enter") {
            main.openDetails(e, entities.home, entities.home?.entity, "tap");
          }
        }}
      >
        <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
        ${generalSecondarySpan(main, home.secondary, "home")}
        ${home.icon !== " " ? html`<ha-icon id="home-icon" .icon=${home.icon}></ha-icon>` : nothing}
        <span class="home">${ring.usageText}</span>
        ${ringSections(ring)}
      </div>
      ${
        !showLabel
          ? html`<span class="label"></span>`
          : html`<span class="label">${home.name}</span>`
      }
    </div>
  `;
};
