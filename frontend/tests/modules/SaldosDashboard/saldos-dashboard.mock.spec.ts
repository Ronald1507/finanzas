/**
 * Tests E2E del módulo SaldosDashboard con API mockeada (sin backend real).
 * Cubre: consolidado de cards, tabla por cuenta, mes sin datos (CTA),
 * navegación por mes y visibilidad del saldo final solo en mes cerrado.
 */
import { test, expect } from '@playwright/test';
import {
    FRONTEND_URL,
    ROUTES,
    MES_ABIERTO_MOCK,
    successEnvelope,
} from '../../constants';
import { mockBootstrapMesAbierto, mockBootstrapMesCerrado } from '../../helpers/navigation';

// ── Datos mock ─────────────────────────────────────────────────────────────
const CONSOLIDADO_MOCK = {
    saldo_inicial: 500000,
    ingresos: 200000,
    egresos: 80000,
    saldo_temporal: 620000,
    por_pagar: 50000,
    por_recibir: 30000,
    saldo_potencial: 600000,
    saldo_final: null,
};

const CONSOLIDADO_CERRADO_MOCK = {
    ...CONSOLIDADO_MOCK,
    saldo_final: 620000,
};

const CUENTAS_SALDOS_MOCK = [
    {
        cuenta_id: 1,
        nombre: 'Cuenta BCI',
        saldo_inicial: 300000,
        ingresos: 150000,
        egresos: 50000,
        saldo_temporal: 400000,
        por_pagar: 30000,
        por_recibir: 20000,
        saldo_potencial: 390000,
        saldo_final: null,
    },
];

const DASHBOARD_RESPONSE_ABIERTO = {
    mes: { ...MES_ABIERTO_MOCK, estado: 'abierto' },
    consolidado: CONSOLIDADO_MOCK,
    cuentas: CUENTAS_SALDOS_MOCK,
};

const DASHBOARD_RESPONSE_CERRADO = {
    mes: { id: 1, anio: 2026, mes: 5, estado: 'cerrado', fecha_cierre: '2026-05-31' },
    consolidado: CONSOLIDADO_CERRADO_MOCK,
    cuentas: [{ ...CUENTAS_SALDOS_MOCK[0], saldo_final: 400000 }],
};

// ── Suite ──────────────────────────────────────────────────────────────────
test.describe('SaldosDashboard — mock', () => {

    test.beforeEach(async ({ page }) => {
        await mockBootstrapMesAbierto(page);
    });

    // ── Consolidado cards ─────────────────────────────────────────────────
    /**
     * Test: muestra las cards consolidadas del mes seleccionado.
     *
     * Flow:
     * 1. Interceptar GET /api/dashboard con datos de mes abierto
     * 2. Navegar a /dashboard
     * 3. Verificar que los labels de las cards son visibles (Saldo Inicial, Ingresos, etc.)
     * 4. Verificar que la card "Saldo Temporal" es visible
     *
     * Objetivo: el componente ConsolidadoCards muestra todas las métricas.
     */
    test('shows consolidado cards for open month', async ({ page }) => {
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(DASHBOARD_RESPONSE_ABIERTO)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        await expect(page.getByText('Saldo Inicial')).toBeVisible();
        await expect(page.getByText('Ingresos')).toBeVisible();
        await expect(page.getByText('Egresos')).toBeVisible();
        await expect(page.getByText('Saldo Temporal')).toBeVisible();
        await expect(page.getByText('Saldo Potencial')).toBeVisible();
    });

    /**
     * Test: la tabla de saldos por cuenta muestra las cuentas del mes.
     *
     * Flow:
     * 1. Interceptar GET /api/dashboard con datos de mes abierto
     * 2. Navegar a /dashboard
     * 3. Verificar que el nombre de la cuenta aparece en la tabla
     *
     * Objetivo: la tabla CuentasSaldosTable renderiza los datos por cuenta.
     */
    test('shows cuentas saldos table with account data', async ({ page }) => {
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(DASHBOARD_RESPONSE_ABIERTO)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        await expect(page.getByText('Cuenta BCI')).toBeVisible();
    });

    // ── Saldo final solo en mes cerrado ───────────────────────────────────
    /**
     * Test: la card "Saldo Final" NO aparece en mes abierto.
     *
     * Flow:
     * 1. Interceptar /api/meses con mes abierto
     * 2. Interceptar /api/dashboard con mes abierto (sin saldo_final)
     * 3. Navegar a /dashboard
     * 4. Verificar que el texto "Saldo Final" NO es visible
     *
     * Objetivo: el saldo final solo se muestra en meses cerrados.
     */
    test('does not show Saldo Final card for open month', async ({ page }) => {
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(DASHBOARD_RESPONSE_ABIERTO)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        // La card Saldo Final no debe aparecer en mes abierto
        await expect(page.getByText('Saldo Final')).not.toBeVisible();
    });

    /**
     * Test: la card "Saldo Final" aparece cuando el mes está cerrado.
     *
     * Flow:
     * 1. Interceptar /api/meses con mes cerrado
     * 2. Interceptar /api/dashboard con mes cerrado (saldo_final presente)
     * 3. Navegar a /dashboard
     * 4. Verificar que el texto "Saldo Final" ES visible
     *
     * Objetivo: el saldo final se muestra exclusivamente en meses cerrados.
     */
    test('shows Saldo Final card for closed month', async ({ page }) => {
        await mockBootstrapMesCerrado(page);
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(DASHBOARD_RESPONSE_CERRADO)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        await expect(page.getByText('Saldo Final')).toBeVisible();
    });

    // ── Mes sin datos ─────────────────────────────────────────────────────
    /**
     * Test: navegar a un mes sin datos muestra el CTA hacia Cierre Mensual.
     *
     * Flow:
     * 1. Interceptar /api/meses con un solo mes abierto
     * 2. Interceptar /api/dashboard retornando null (sin datos)
     * 3. Simular navegación al mes siguiente (virtual)
     * 4. Verificar que aparece el componente MesSinDatos con el CTA
     * 5. Verificar que el botón "#dashboard-btn-ir-cierre" está visible
     *
     * Objetivo: el estado vacío del dashboard muestra el CTA de cierre mensual.
     */
    test('shows MesSinDatos CTA when month has no data', async ({ page }) => {
        // Retornar dashboard sin datos para el mes actual
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(null)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        // Ir al mes siguiente (virtual) con el navegador de mes
        await page.locator('#month-navigator-btn-siguiente').click();
        await expect(page.getByText(/no tiene datos aún/i)).toBeVisible();
        await expect(page.locator('#dashboard-btn-ir-cierre')).toBeVisible();
    });

    /**
     * Test: el botón del CTA de MesSinDatos navega a /meses.
     *
     * Flow:
     * 1. Reproducir el estado de mes sin datos
     * 2. Hacer click en #dashboard-btn-ir-cierre
     * 3. Verificar que la URL cambia a /meses
     *
     * Objetivo: el CTA lleva al usuario a la sección de Cierre Mensual.
     */
    test('CTA button in MesSinDatos navigates to /meses', async ({ page }) => {
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(null)),
            });
        });
        await page.route('**/api/meses**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope([])),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        await page.locator('#month-navigator-btn-siguiente').click();
        await page.locator('#dashboard-btn-ir-cierre').click();
        await expect(page).toHaveURL(/\/meses/);
    });

    // ── Navegación por mes ────────────────────────────────────────────────
    /**
     * Test: el MonthNavigator muestra el mes seleccionado y su estado.
     *
     * Flow:
     * 1. Interceptar /api/dashboard
     * 2. Navegar a /dashboard
     * 3. Verificar que el MonthNavigator es visible
     * 4. Verificar que el chip de estado muestra "Abierto"
     *
     * Objetivo: el MonthNavigator muestra correctamente el mes y estado.
     */
    test('shows MonthNavigator with current month and estado', async ({ page }) => {
        await page.route('**/api/dashboard**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope(DASHBOARD_RESPONSE_ABIERTO)),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.DASHBOARD}`);
        await expect(page.locator('#month-navigator')).toBeVisible();
        await expect(page.locator('#month-navigator-chip-estado')).toBeVisible();
        await expect(page.locator('#month-navigator-chip-estado')).toContainText('Abierto');
    });
});
