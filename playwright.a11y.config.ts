import { defineConfig, devices } from '@playwright/test';

/**
 * Accessibility suite only. Deliberately a separate config from anything else:
 * `npm test` stays `node --test tests/*.test.mjs`, which needs no browser and
 * no server, so the default test path keeps working on a machine that has
 * never run `playwright install`.
 *
 * Run:  npm run test:a11y                 (builds nothing — start the site first,
 *                                          or let webServer do it)
 *       BASE_URL=https://… npm run test:a11y
 *
 * Not wired to any workflow. It needs a running site and a downloaded browser;
 * a required check that nobody can run is worse than no check at all.
 */
// `docker compose up` publishes the web container on 3000. If you run the
// a11y suite while compose is up and let it default to 3000, you scan the
// container's image, not your working tree — silently, and the results look
// plausible. Override with PORT (the server this config starts binds to it too).
const PORT = process.env.PORT ?? '3000';
const ORIGIN = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  testMatch: /a11y\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  // A cold ISR page that talks to the CMS can take tens of seconds on its
  // first hit; the default 30s navigation budget makes that look like a
  // failure. Generous here, because the assertion is about the DOM, not speed.
  timeout: 90_000,
  use: {
    baseURL: ORIGIN,
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Only start a server when no BASE_URL was given. `next start` requires an
  // existing `.next` build; run `npm run build` first.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${PORT}`,
        url: `${ORIGIN}/en`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
