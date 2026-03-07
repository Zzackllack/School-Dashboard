import { expect, test, type Page } from "@playwright/test";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

const substitutionFixture = [
  {
    date: "01.01.2026 Mittwoch",
    title: "Vertretungsplan",
    entries: [
      {
        classes: "10a",
        period: "2",
        absent: "Müller",
        substitute: "Schmidt",
        originalSubject: "Mathe",
        subject: "Physik",
        newRoom: "201",
        type: "Vertr.",
        comment: "Bitte Buch mitbringen",
        date: "01.01.2026",
      },
    ],
    news: {
      date: "01.01.2026",
      newsItems: ["Eingang A heute gesperrt."],
    },
  },
];

const calendarFixture = [
  {
    summary: "Pädagogischer Tag",
    description: "Interner Fortbildungstag",
    location: "Aula",
    startDate: 1767225600000,
    endDate: 1767232800000,
    allDay: false,
  },
];

const weatherFixture = {
  latitude: 52.43,
  longitude: 13.3,
  timezone: "Europe/Berlin",
  current_weather: {
    temperature: 18,
    windspeed: 8,
    winddirection: 140,
    weathercode: 1,
    time: "2026-02-28T12:15",
  },
  hourly: {
    time: ["2026-02-28T12:00", "2026-02-28T13:00"],
    temperature_2m: [18, 19],
    relativehumidity_2m: [65, 63],
    precipitation: [0, 0.1],
    weathercode: [1, 2],
  },
  daily: {
    time: ["2026-02-28", "2026-03-01", "2026-03-02"],
    temperature_2m_max: [19, 20, 17],
    temperature_2m_min: [12, 11, 10],
    weathercode: [1, 2, 3],
  },
};

const nearbyStopsFixture = [
  {
    type: "stop",
    id: "900000001",
    name: "S Lichterfelde West",
    location: {
      type: "location",
      id: "loc1",
      latitude: 52.433,
      longitude: 13.301,
    },
    products: {
      suburban: true,
      subway: false,
      tram: false,
      bus: true,
      ferry: false,
      express: false,
      regional: false,
    },
    distance: 150,
  },
];

const departuresFixture = {
  departures: [
    {
      tripId: "trip-1",
      direction: "S Südkreuz",
      line: {
        type: "line",
        id: "line-s1",
        name: "S1",
        mode: "train",
        product: "suburban",
      },
      when: "2026-02-28T12:20:00+01:00",
      plannedWhen: "2026-02-28T12:20:00+01:00",
      delay: 120,
      platform: "1",
      plannedPlatform: "1",
      stop: nearbyStopsFixture[0],
    },
  ],
};

async function startMockBackend(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
) {
  return await new Promise<Server>((resolve, reject) => {
    const server = createServer(handler);
    server.once("error", reject);
    server.listen(8080, "127.0.0.1", () => resolve(server));
  });
}

async function stopMockBackend(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function seedDisplaySessionTokenCookie(page: Page, token: string) {
  const baseURL = test.info().project.use.baseURL;
  if (!baseURL) {
    throw new Error(
      "Playwright baseURL must be configured for cookie seeding.",
    );
  }

  await page.context().addCookies([
    {
      name: "DISPLAY_SESSION_TOKEN",
      value: token,
      url: `${new URL(baseURL).origin}/`,
    },
  ]);
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/substitution/plans", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(substitutionFixture),
    });
  });

  await page.route("**/api/calendar/events?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(calendarFixture),
    });
  });

  await page.route("**/api.open-meteo.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(weatherFixture),
    });
  });

  await page.route(
    "**/v6.bvg.transport.rest/locations/nearby*",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(nearbyStopsFixture),
      });
    },
  );

  await page.route(
    "**/v6.bvg.transport.rest/stops/*/departures*",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(departuresFixture),
      });
    },
  );

  await page.route("**/api/admin/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        username: "admin",
        roles: ["ROLE_ADMIN"],
      }),
    });
  });

  await page.route("**/api/admin/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        headerName: "X-CSRF-TOKEN",
        parameterName: "_csrf",
        token: "csrf-test-token",
      }),
    });
  });
});

test("routes fresh kiosk from root to setup", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Display Setup" }),
  ).toBeVisible();
});

test("completes setup -> pending -> approved -> display flow", async ({
  page,
}) => {
  let pollCount = 0;

  await page.route("**/api/displays/enrollments", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    let payload: unknown;
    try {
      payload = route.request().postDataJSON();
    } catch {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid JSON payload" }),
      });
      return;
    }
    const isValidPayload =
      typeof payload === "object" &&
      payload !== null &&
      typeof (payload as { enrollmentCode?: unknown }).enrollmentCode ===
        "string" &&
      typeof (payload as { proposedDisplayName?: unknown })
        .proposedDisplayName === "string";
    if (!isValidPayload) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid enrollment payload" }),
      });
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "req-1",
        status: "PENDING",
        pollAfterSeconds: 1,
      }),
    });
  });

  await page.route("**/api/displays/enrollments/req-1", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    pollCount += 1;

    if (pollCount < 2) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "req-1",
          status: "PENDING",
          displayId: null,
          displaySessionToken: null,
          pollAfterSeconds: 1,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "req-1",
        status: "APPROVED",
        displayId: "display-1",
        displaySessionToken: "token-abc",
        pollAfterSeconds: null,
      }),
    });
  });

  await page.route("**/api/displays/session", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: true,
        displayId: "display-1",
        displaySlug: "main-hall",
        assignedProfileId: "default",
        themeId: "default",
        redirectPath: "/display/display-1",
      }),
    });
  });

  await page.goto("/setup");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Enrollment Code").fill("ABCD1234");
  await page.getByLabel("Display Name").fill("Main Hall Screen");
  await page.getByRole("button", { name: "Enrollment starten" }).click();

  await expect(page).toHaveURL(/\/display\/display-1/);
  await expect(page.getByText("Display: display-1")).toBeVisible();
});

test("restores approved display from stored session token on reboot", async ({
  page,
}) => {
  await seedDisplaySessionTokenCookie(page, "token-reboot");

  await page.route("**/api/displays/session", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: true,
        displayId: "display-reboot",
        displaySlug: "main-hall",
        assignedProfileId: "default",
        themeId: "default",
        redirectPath: "/display/display-reboot",
      }),
    });
  });

  await page.goto("/");

  await expect(page).toHaveURL(/\/display\/display-reboot/);
  await expect(page.getByText("Display: display-reboot")).toBeVisible();
});

test("falls back to setup when stored token is revoked", async ({ page }) => {
  await seedDisplaySessionTokenCookie(page, "token-revoked");

  await page.route("**/api/displays/session", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: false,
        displayId: null,
        displaySlug: null,
        assignedProfileId: null,
        themeId: null,
        redirectPath: null,
      }),
    });
  });

  await page.goto("/");

  await expect(page).toHaveURL(/\/setup/);
  await expect(
    page.getByRole("heading", { name: "Display Setup" }),
  ).toBeVisible();
});

for (const [targetPath, scenarioLabel] of [
  ["/display/direct-access", "without a session token"],
  ["/display/revoked-screen", "when token is revoked"],
]) {
  test(`blocks direct /display/:displayId access ${scenarioLabel}`, async ({
    page,
  }) => {
    await page.route("**/api/displays/session", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          valid: false,
          displayId: null,
          displaySlug: null,
          assignedProfileId: null,
          themeId: null,
          redirectPath: null,
        }),
      });
    });

    await page.goto(targetPath);

    await expect(page).toHaveURL(/\/setup/);
    await expect(
      page.getByRole("heading", { name: "Display Setup" }),
    ).toBeVisible();
  });
}

test("admin pending page supports approval action", async ({ page }) => {
  let approved = false;
  const expectedCsrfToken = "csrf-test-token";

  await page.route("**/api/admin/displays/enrollments?*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        !approved
          ? [
              {
                requestId: "req-approve",
                enrollmentCodeId: "code-1",
                proposedDisplayName: "North Wing",
                deviceInfo: null,
                status: "PENDING",
                displayId: null,
                createdAt: "2026-03-01T10:00:00Z",
                expiresAt: "2026-03-02T10:00:00Z",
              },
            ]
          : [],
      ),
    });
  });

  await page.route(
    "**/api/admin/displays/enrollments/req-approve/approve",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const csrfHeader = route.request().headers()["x-csrf-token"];
      if (csrfHeader !== expectedCsrfToken) {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid CSRF token" }),
        });
        return;
      }
      approved = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "req-approve",
          status: "APPROVED",
          displayId: "display-approve",
          displaySessionToken: "token-approve",
          pollAfterSeconds: null,
        }),
      });
    },
  );

  await page.goto("/admin/displays/pending");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Freigeben" }).click();

  await expect(page.getByText("Keine offenen Requests.")).toBeVisible();
});

test("admin pending page supports rejection action", async ({ page }) => {
  let rejected = false;
  const expectedCsrfToken = "csrf-test-token";

  await page.route("**/api/admin/displays/enrollments?*", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        !rejected
          ? [
              {
                requestId: "req-reject",
                enrollmentCodeId: "code-2",
                proposedDisplayName: "South Wing",
                deviceInfo: null,
                status: "PENDING",
                displayId: null,
                createdAt: "2026-03-01T11:00:00Z",
                expiresAt: "2026-03-02T11:00:00Z",
              },
            ]
          : [],
      ),
    });
  });

  await page.route(
    "**/api/admin/displays/enrollments/req-reject/reject",
    async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const csrfHeader = route.request().headers()["x-csrf-token"];
      if (csrfHeader !== expectedCsrfToken) {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid CSRF token" }),
        });
        return;
      }
      rejected = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "req-reject",
          status: "REJECTED",
          displayId: null,
          displaySessionToken: null,
          pollAfterSeconds: null,
        }),
      });
    },
  );

  await page.goto("/admin/displays/pending");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Ablehnen" }).click();

  await expect(page.getByText("Keine offenen Requests.")).toBeVisible();
});

test("admin can switch display theme and display route keeps module parity", async ({
  page,
}) => {
  let selectedThemeId = "default";

  await page.route("**/api/admin/displays/display-1", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "display-1",
          name: "Main Hall Screen",
          slug: "main-hall-screen",
          locationLabel: "Main Entrance",
          status: "ACTIVE",
          assignedProfileId: "default",
          themeId: selectedThemeId,
          updatedAt: "2026-03-07T10:00:00Z",
        }),
      });
      return;
    }

    if (route.request().method() === "PATCH") {
      const payload = route.request().postDataJSON() as { themeId?: string };
      if (payload.themeId) {
        selectedThemeId = payload.themeId;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "display-1",
          name: "Main Hall Screen",
          slug: "main-hall-screen",
          locationLabel: "Main Entrance",
          status: "ACTIVE",
          assignedProfileId: "default",
          themeId: selectedThemeId,
          updatedAt: "2026-03-07T10:01:00Z",
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route("**/api/displays/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: true,
        displayId: "display-1",
        displaySlug: "main-hall-screen",
        assignedProfileId: "default",
        themeId: selectedThemeId,
        redirectPath: "/display/display-1",
      }),
    });
  });

  await page.goto("/admin/displays/display-1");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Theme").selectOption("brutalist-high-density");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText("Display erfolgreich aktualisiert.")).toBeVisible();

  await page.goto("/display/display-1");
  await expect(page.getByText("Display: display-1")).toBeVisible();
  await expect(
    page.getByTestId("theme-brutalist-high-density"),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "Vertretungspläne" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wetter" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Öffentliche Verkehrsmittel" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kommende Termine" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nächste Schulferien" }),
  ).toBeVisible();
});

test("renders root error component when a route throws", async ({ page }) => {
  await page.goto("/throw-error");

  await expect(
    page.getByRole("heading", { name: "Anwendungsfehler" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Die Seite konnte nicht geladen werden. Bitte versuche es erneut.",
    ),
  ).toBeVisible();
});

test("renders root not-found component for unknown routes", async ({
  page,
}) => {
  await page.goto("/does-not-exist");

  await expect(
    page.getByRole("heading", { name: "Seite nicht gefunden" }),
  ).toBeVisible();
});

test("calendar API route forwards upstream status, headers, and body", async ({
  request,
}) => {
  let backendServer: Server | null = null;

  try {
    backendServer = await startMockBackend((incomingRequest, response) => {
      if (!incomingRequest.url?.startsWith("/api/calendar/events?limit=9")) {
        response.statusCode = 404;
        response.end("Not Found");
        return;
      }

      response.statusCode = 207;
      response.statusMessage = "Multi-Status";
      response.setHeader("Content-Type", "application/json");
      response.setHeader("X-Upstream", "calendar");
      response.end('{"source":"upstream"}');
    });
  } catch (error) {
    test.skip(
      true,
      `Mock backend server could not bind to 127.0.0.1:8080: ${String(error)}`,
    );
    return;
  }

  try {
    const response = await request.get("/api/calendar/events?limit=9");

    expect(response.status()).toBe(207);
    expect(response.statusText()).toBe("Multi-Status");
    expect(response.headers()["x-upstream"]).toBe("calendar");
    await expect(response.text()).resolves.toBe('{"source":"upstream"}');
  } finally {
    if (backendServer) {
      await stopMockBackend(backendServer);
    }
  }
});
