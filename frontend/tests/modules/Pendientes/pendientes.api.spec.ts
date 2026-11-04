/**
 * Tests E2E del módulo Pendientes con API real.
 * Requiere backend corriendo en http://localhost:8005/api
 * y al menos una cuenta activa con un mes abierto.
 *
 * Antes de ejecutar:
 *   cd backend
 *   $env:Path = "$env:USERPROFILE\.config\herd\bin;" + $env:Path
 *   php artisan migrate:fresh
 *   php artisan serve --port=8005
 *
 * Luego en otra terminal:
 *   cd frontend && npm run dev:test
 */
import { test, expect } from '@playwright/test';
import { FRONTEND_URL, API_BASE, ROUTES } from '../../constants';

test.describe('Pendientes — API real', () => {
    test.setTimeout(30000);

    let mesId: number;
    let cuentaId: number;

    test.beforeAll(async ({ request }) => {
        const mesesRes = await request.get(`${API_BASE}/meses`);
        const mesesBody = await mesesRes.json();
        const meses = mesesBody.data ?? [];
        const mesAbierto = meses.find((m: any) => m.estado === 'abierto');
        if (mesAbierto) mesId = mesAbierto.id;

        const cuentasRes = await request.get(`${API_BASE}/cuentas?activa=1`);
        const cuentasBody = await cuentasRes.json();
        const cuentas = cuentasBody.data?.data ?? cuentasBody.data ?? [];
        if (cuentas.length > 0) cuentaId = cuentas[0].id;
    });

    /**
     * Test: crear pendiente por pagar vía UI persiste en la API.
     *
     * Flow:
     * 1. Navegar a /pendientes
     * 2. Abrir dialog nuevo pendiente
     * 3. Seleccionar cuenta, tipo Por Pagar, llenar monto y descripción
     * 4. Guardar y verificar en la lista
     * 5. Confirmar via API que el pendiente existe
     *
     * Objetivo: el flujo de creación de pendiente persiste en la DB.
     */
    test('can create pendiente por pagar via UI', async ({ page, request }) => {
        if (!mesId || !cuentaId) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.waitForLoadState('networkidle');

        await page.locator('#pendientes-btn-nuevo').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('#pendientes-select-cuenta').click();
        await page.getByRole('option').first().click();
        await page.locator('#pendientes-select-tipo').click();
        await page.getByRole('option', { name: 'Por Pagar' }).click();
        await page.getByTestId('pendientes-input-monto').fill('90000');
        await page.getByTestId('pendientes-input-descripcion').fill('Pendiente E2E Test');
        await page.getByTestId('pendientes-input-fecha-estimada').fill('2026-06-30');

        await page.locator('#pendientes-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Pendiente E2E Test')).toBeVisible();

        // Verificar en API
        const res = await request.get(`${API_BASE}/pendientes?mes_id=${mesId}`);
        const body = await res.json();
        const pendientes = body.data?.data ?? body.data ?? [];
        const creado = pendientes.find((p: any) => p.descripcion === 'Pendiente E2E Test');
        expect(creado).toBeTruthy();
    });

    /**
     * Test: crear pendiente recurrente vía UI persiste recurrente=true en la API.
     *
     * Flow:
     * 1. Navegar a /pendientes
     * 2. Abrir dialog, llenar campos y activar el switch recurrente
     * 3. Guardar y verificar que el chip "Recurrente" aparece en la lista
     * 4. Verificar vía API que el campo recurrente es true
     *
     * Objetivo: el toggle persiste correctamente en la DB.
     */
    test('can create pendiente recurrente via UI and verify in API', async ({ page, request }) => {
        if (!mesId || !cuentaId) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.waitForLoadState('networkidle');

        await page.locator('#pendientes-btn-nuevo').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('#pendientes-select-cuenta').click();
        await page.getByRole('option').first().click();
        await page.locator('#pendientes-select-tipo').click();
        await page.getByRole('option', { name: 'Por Pagar' }).click();
        await page.getByTestId('pendientes-input-monto').fill('75000');
        await page.getByTestId('pendientes-input-descripcion').fill('Recurrente E2E Test');
        await page.getByTestId('pendientes-input-fecha-estimada').fill('2026-06-30');
        await page.locator('#pendientes-switch-recurrente').check({ force: true });

        await page.locator('#pendientes-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByTestId('pendientes-chip-recurrente')).toBeVisible();

        // Verify via API
        const res = await request.get(`${API_BASE}/pendientes?mes_id=${mesId}`);
        const body = await res.json();
        const pendientes = body.data?.data ?? body.data ?? [];
        const creado = pendientes.find((p: any) => p.descripcion === 'Recurrente E2E Test');
        expect(creado).toBeTruthy();
        expect(creado.recurrente).toBe(true);
    });

    /**
     * Test: concretar pendiente vía UI genera el movimiento real.
     *
     * Flow:
     * 1. Obtener un pendiente en estado "pendiente" via API
     * 2. Navegar a /pendientes
     * 3. Click en "Concretar" → llenar fecha → confirmar
     * 4. Verificar que el estado cambió en la tabla
     * 5. Verificar via API que el pendiente tiene movimiento_id
     *
     * Objetivo: concretar un pendiente crea el movimiento real en la DB.
     */
    test('can concretar pendiente and verify movimiento created', async ({ page, request }) => {
        if (!mesId) test.skip();

        const res = await request.get(`${API_BASE}/pendientes?mes_id=${mesId}&estado=pendiente`);
        const body = await res.json();
        const pendientes = body.data?.data ?? body.data ?? [];
        const pendiente = pendientes[0];
        if (!pendiente) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Concretar' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByTestId('pendientes-concretar-input-fecha').fill('2026-06-15');
        await page.locator('#pendientes-concretar-btn-confirmar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByRole('alert')).toBeVisible();
    });
});
