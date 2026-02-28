import { describe, expect, it } from "vitest";
import {
  RootErrorComponent,
  RootNotFoundComponent,
  Route,
} from "./__root";

describe("root route configuration", () => {
  it("keeps SSR enabled", () => {
    expect(Route.options.ssr).toBe(true);
  });

  it("defines head metadata and links with expected entries", async () => {
    const head = await Route.options.head?.({} as never);
    const metaEntries = head?.meta ?? [];
    const linkEntries = head?.links ?? [];

    expect(metaEntries.length).toBeGreaterThan(40);
    expect(linkEntries.length).toBeGreaterThanOrEqual(8);

    const appNameMetaEntries = metaEntries.filter(
      (metaEntry: unknown) =>
        typeof metaEntry === "object" &&
        metaEntry !== null &&
        "name" in metaEntry &&
        metaEntry.name === "application-name",
    );

    const descriptionMetaEntries = metaEntries.filter(
      (metaEntry: unknown) =>
        typeof metaEntry === "object" &&
        metaEntry !== null &&
        "name" in metaEntry &&
        metaEntry.name === "description",
    );

    expect(appNameMetaEntries).toHaveLength(1);
    expect(descriptionMetaEntries).toHaveLength(1);
  });

  it("wires root error and not-found components", () => {
    expect(Route.options.errorComponent).toBe(RootErrorComponent);
    expect(Route.options.notFoundComponent).toBe(RootNotFoundComponent);
  });
});
