/**
 * Helpers de navegación para tests E2E de Finanzas Personales.
 *
 * La app es de un único usuario sin autenticación. No se requiere login.
 * El único paso previo a cualquier test es que el bootstrap de la app
 * complete la carga de meses (GET /api/meses).
 */
import type { Page } from '@playwright/test';
import { FRONTEND_URL, MES_ABIERTO_MOCK, successEnvelope } from '../constants';

/**
 * Navega a una ruta de la SPA y espera a que el layout sea visible.
 * Útil en api.spec.ts donde el backend real responde a /api/meses.
 */
export async function navigateTo(page: Page, route: string): Promise<void> {
    await page.goto(`${FRONTEND_URL}${route}`);
    await page.waitForLoadState('domcontentloaded');
}

/**
 * Intercepta la llamada de bootstrap al endpoint /api/meses y devuelve
 * un mes abierto mock. Llamar en beforeEach de los *.mock.spec.ts.
 *
 * Si el test necesita un mes cerrado, usar mockMesCerrado() en su lugar.
 */
export async function mockBootstrapMesAbierto(page: Page): Promise<void> {
    await page.route('**/api/meses**', async (route) => {
        // Solo interceptar GET (no POST cerrar/reabrir)
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope([MES_ABIERTO_MOCK])),
            });
        } else {
            await route.continue();
        }
    });
}

/**
 * Intercepta la llamada bootstrap para retornar un mes cerrado.
 * Útil para probar vistas de solo lectura.
 */
export async function mockBootstrapMesCerrado(
    page: Page,
    mesCerrado = { id: 1, anio: 2026, mes: 5, estado: 'cerrado', fecha_cierre: '2026-05-31' },
): Promise<void> {
    await page.route('**/api/meses**', async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope([mesCerrado])),
            });
        } else {
            await route.continue();
        }
    });
}
