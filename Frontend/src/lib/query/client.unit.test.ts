import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { createQueryClient, queryClient } from "./client";

describe("query client configuration", () => {
  it("createQueryClient returns a QueryClient with expected defaults", () => {
    const client = createQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    expect(client.getDefaultOptions().queries).toMatchObject({
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });
  });

  it("queryClient singleton uses the same query defaults", () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });
  });
});
