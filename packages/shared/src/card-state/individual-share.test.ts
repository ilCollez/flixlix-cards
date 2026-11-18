import * as fc from "fast-check";
import { describe, expect, test } from "vite-plus/test";
import { shareHomeFirst } from "./individual-share";
import { type NodeTotals } from "./normalize";
import { solve } from "./solve";

const RUNS = { numRuns: 1000, seed: 20261118 };

const totals = (overrides: Partial<NodeTotals>): NodeTotals => ({
  gridImport: 0,
  gridExport: 0,
  solar: 0,
  batteryCharge: 0,
  batteryDischarge: 0,
  individuals: [],
  nonFossilFraction: 0,
  ...overrides,
});

describe("shareHomeFirst", () => {
  test("solar covers the home's own loads first and the car gets the rest", () => {
    const flows = solve(totals({ solar: 1500, gridImport: 2600 }));

    const share = shareHomeFirst(flows, [3600]);

    expect(share.home).toEqual({ solar: 500, battery: 0, grid: 0, nonFossil: 0 });
    expect(share.individuals).toEqual([{ solar: 1000, battery: 0, grid: 2600, nonFossil: 0 }]);
  });

  test("the home's own loads take the battery before the grid", () => {
    const flows = solve(totals({ batteryDischarge: 300, gridImport: 1000 }));

    const share = shareHomeFirst(flows, [800]);

    expect(share.home).toEqual({ solar: 0, battery: 300, grid: 200, nonFossil: 0 });
    expect(share.individuals).toEqual([{ solar: 0, battery: 0, grid: 800, nonFossil: 0 }]);
  });

  test("devices share what is left of each source in proportion to their totals", () => {
    const flows = solve(totals({ solar: 1000, gridImport: 2000 }));

    const share = shareHomeFirst(flows, [2000, 500]);

    expect(share.home).toEqual({ solar: 500, battery: 0, grid: 0, nonFossil: 0 });
    expect(share.individuals).toEqual([
      { solar: 400, battery: 0, grid: 1600, nonFossil: 0 },
      { solar: 100, battery: 0, grid: 400, nonFossil: 0 },
    ]);
  });

  test("devices reading more than the balanced home leave nothing for the home's own loads", () => {
    const flows = solve(totals({ solar: 1700, gridImport: 600 }));

    const share = shareHomeFirst(flows, [3600]);

    expect(share.home).toEqual({ solar: 0, battery: 0, grid: 0, nonFossil: 0 });
    expect(share.individuals).toEqual([{ solar: 1700, battery: 0, grid: 600, nonFossil: 0 }]);
  });

  test("each share's low-carbon part keeps the grid's non-fossil fraction", () => {
    const flows = solve(totals({ gridImport: 1000, nonFossilFraction: 0.3 }));

    const share = shareHomeFirst(flows, [600]);

    expect(share.home.nonFossil).toBeCloseTo(120, 10);
    expect(share.individuals[0]?.nonFossil).toBeCloseTo(180, 10);
  });

  test("a device with nothing to draw gets no share", () => {
    const flows = solve(totals({ gridImport: 500 }));

    expect(shareHomeFirst(flows, [0]).individuals).toEqual([
      { solar: 0, battery: 0, grid: 0, nonFossil: 0 },
    ]);
  });

  test("home and devices together get exactly what flows into home, source by source", () => {
    const amount = fc.integer({ min: 0, max: 10_000 });
    fc.assert(
      fc.property(
        amount,
        amount,
        amount,
        fc.array(fc.integer({ min: 1, max: 10_000 }), { minLength: 1, maxLength: 4 }),
        (solar, batteryDischarge, gridImport, devices) => {
          const flows = solve(totals({ solar, batteryDischarge, gridImport }));
          const share = shareHomeFirst(flows, devices);
          const sum = (source: "solar" | "battery" | "grid") =>
            share.home[source] +
            share.individuals.reduce((total, device) => total + device[source], 0);

          expect(sum("solar")).toBeCloseTo(flows.solarToHome, 6);
          expect(sum("battery")).toBeCloseTo(flows.batteryToHome, 6);
          expect(sum("grid")).toBeCloseTo(flows.gridToHome, 6);
        }
      ),
      RUNS
    );
  });
});
