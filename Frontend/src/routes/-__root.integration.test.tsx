// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );

  return {
    ...actual,
    HeadContent: () => (
      <>
        <meta name="application-name" content="Schul Dashboard GGL" />
        <meta
          name="description"
          content="Vertretungsplan, Wetter, Verkehrsinformationen und Schulkalender für das Goethe Gymnasium Lichterfelde"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="preconnect" href="https://umami-analytics.zacklack.de" />
      </>
    ),
    Scripts: () => null,
  };
});

import { RootDocument, Route } from "./__root";

describe("root route integration", () => {
  it("returns expected key head metadata and link definitions", async () => {
    const head = await Route.options.head?.({} as never);
    const metaEntries = head?.meta ?? [];
    const linkEntries = head?.links ?? [];

    expect(
      metaEntries.some(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "name" in entry &&
          entry.name === "application-name",
      ),
    ).toBe(true);

    expect(
      metaEntries.some(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "name" in entry &&
          entry.name === "description",
      ),
    ).toBe(true);

    expect(metaEntries.length).toBeGreaterThan(40);
    expect(linkEntries.length).toBeGreaterThanOrEqual(8);
  });

  it("renders RootDocument with key meta/link tags in the head", () => {
    const html = renderToStaticMarkup(
      <RootDocument>
        <main>Root Content</main>
      </RootDocument>,
    );

    expect(html).toContain('<html lang="de">');
    expect(html).toContain('meta name="application-name"');
    expect(html).toContain('meta name="description"');
    expect(html).toContain('link rel="manifest"');
    expect(html).toContain('link rel="preconnect"');
    expect(html).toContain("Root Content");
    expect(html).toContain("umami-analytics.zacklack.de/script.js");
  });
});
