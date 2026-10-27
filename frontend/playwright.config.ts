import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para los tests E2E del frontend.
 *
 * - mock.spec.ts: no requieren backend (usan page.route() para interceptar API)
 * - api.spec.ts: requieren backend corriendo en http://localhost:8005/api
 *
 * Para ejecutar solo mocks:   npx playwright test --grep "mock"
 * Para ejecutar solo API:     npx playwright test --grep "api"
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'line',
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev:test',
        url: 'http://localhost:5174',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
});
