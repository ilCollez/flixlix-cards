import { type SourceShares } from "@flixlix-cards/shared/types";
import { type NodeFlows } from "./solve";

/** What the home's own loads and each individual device get from each source. */
export type IndividualShare = Readonly<{
  home: SourceShares;
  /** In the order of the device totals passed in. */
  individuals: ReadonlyArray<SourceShares>;
}>;

const NOTHING: SourceShares = { solar: 0, battery: 0, grid: 0, nonFossil: 0 };

type HomeSource = "solar" | "battery" | "grid";

/** The solver's order for flows into home. */
const HOME_SOURCES: ReadonlyArray<HomeSource> = ["solar", "battery", "grid"];

const intoHome = (flows: NodeFlows): Record<HomeSource, number> => ({
  solar: flows.solarToHome,
  battery: flows.batteryToHome,
  grid: flows.gridToHome,
});

const withNonFossil = (
  shares: Record<HomeSource, number>,
  nonFossilFraction: number
): SourceShares => ({ ...shares, nonFossil: shares.grid * nonFossilFraction });

type Taking = Readonly<{ need: number; taken: Record<HomeSource, number> }>;

/** What `need` takes from each source, walking them in the solver's order. */
const takeInOrder = (
  sources: Record<HomeSource, number>,
  need: number
): Record<HomeSource, number> =>
  HOME_SOURCES.reduce<Taking>(
    ({ need: left, taken }, source) => {
      const amount = Math.min(left, sources[source]);
      return { need: left - amount, taken: { ...taken, [source]: amount } };
    },
    { need, taken: { solar: 0, battery: 0, grid: 0 } }
  ).taken;

/**
 * Splits the flows into home between the home's own loads and the individual devices. The home's
 * own loads (home minus the devices) take each source first, in the solver's order; what is left
 * of each source goes to the devices in proportion to their totals.
 *
 * Device totals can add up to more than the balanced home when their entities update at a
 * different pace than the sources: the devices then share whatever is left, and the home's own
 * loads get nothing.
 */
export const shareHomeFirst = (
  flows: NodeFlows,
  deviceTotals: ReadonlyArray<number>
): IndividualShare => {
  const devicesTotal = deviceTotals.reduce((sum, total) => sum + total, 0);
  const sources = intoHome(flows);
  const nonFossilFraction = flows.gridToHome > 0 ? flows.nonFossilToHome / flows.gridToHome : 0;

  const home = takeInOrder(sources, Math.max(flows.home - devicesTotal, 0));
  const left: Record<HomeSource, number> = {
    solar: sources.solar - home.solar,
    battery: sources.battery - home.battery,
    grid: sources.grid - home.grid,
  };

  const deviceShares = (total: number): SourceShares => {
    if (devicesTotal <= 0 || total <= 0) {
      return NOTHING;
    }
    const part = total / devicesTotal;
    return withNonFossil(
      { solar: left.solar * part, battery: left.battery * part, grid: left.grid * part },
      nonFossilFraction
    );
  };

  return {
    home: withNonFossil(home, nonFossilFraction),
    individuals: deviceTotals.map(deviceShares),
  };
};
