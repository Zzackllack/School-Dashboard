import { expect, test } from "@playwright/test";

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
    {
      tripId: "trip-2",
      direction: "Rathaus Steglitz",
      line: {
        type: "line",
        id: "line-bus",
        name: "M48",
        mode: "bus",
        product: "bus",
      },
      when: "2026-02-28T12:25:00+01:00",
      plannedWhen: "2026-02-28T12:25:00+01:00",
      delay: null,
      platform: null,
      plannedPlatform: null,
      stop: nearbyStopsFixture[0],
    },
  ],
};

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
});

test("renders dashboard root route with core modules", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Vertretungspläne" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Öffentliche Verkehrsmittel" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kommende Termine" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nächste Schulferien" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Credits" })).toBeVisible();
});

test("renders display route scaffold", async ({ page }) => {
  await page.goto("/display/test-screen");

  await expect(
    page.getByRole("heading", { name: "Display Route Placeholder" }),
  ).toBeVisible();
  await expect(page.getByText("Angefragte Display-ID:")).toBeVisible();
});

test("renders admin route scaffold", async ({ page }) => {
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Admin Route Placeholder" }),
  ).toBeVisible();
});
