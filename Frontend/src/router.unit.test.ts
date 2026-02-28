import { describe, expect, it } from "vitest";
import { getRouter } from "./router";

describe("getRouter", () => {
  it("creates a fresh query client for each router instance", () => {
    const firstRouter = getRouter();
    const secondRouter = getRouter();

    expect(firstRouter.options.context.queryClient).not.toBe(
      secondRouter.options.context.queryClient,
    );
  });
});
