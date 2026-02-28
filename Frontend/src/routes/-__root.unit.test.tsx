import { describe, expect, it } from "vitest";
import { Route } from "./__root";

describe("root route configuration", () => {
  it("keeps SSR enabled", () => {
    expect(Route.options.ssr).toBe(true);
  });

  it("defines a single application-name meta entry", async () => {
    const head = await Route.options.head?.({} as never);
    const appNameMetaEntries = (head?.meta ?? []).filter(
      (metaEntry: unknown) =>
        typeof metaEntry === "object" &&
        metaEntry !== null &&
        "name" in metaEntry &&
        metaEntry.name === "application-name",
    );

    expect(appNameMetaEntries).toHaveLength(1);
  });
});
