import { describe, expect, it, vi } from "vitest";
import { fetchJson } from "./http";

describe("fetchJson", () => {
  it("returns parsed JSON for successful responses", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const data = await fetchJson<{ ok: boolean }>("/substitution/plans");

    expect(data).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith("/api/substitution/plans", undefined);
  });

  it("throws when API responses are not successful", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Bad gateway", { status: 502 }),
    );

    await expect(fetchJson("/calendar/events")).rejects.toThrow(
      "API error: 502 - Bad gateway",
    );
  });

  it("rethrows network failures from fetch", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Network error"));

    await expect(fetchJson("/test")).rejects.toThrow("Network error");
    expect(fetchSpy).toHaveBeenCalledWith("/api/test", undefined);
  });

  it("returns undefined for successful responses with empty JSON bodies", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const data = await fetchJson("/some/path");

    expect(data).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith("/api/some/path", undefined);
  });
});
