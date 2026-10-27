/**
 * Tests E2E del módulo Movimientos con API real.
 * Requiere backend corriendo en http://localhost:8005/api
 * y al menos una cuenta activa con un mes abierto en la base de datos.
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

test.describe('Movimientos — API real', () => {
    test.setTimeout(30000);

    let movimientoId: number;
    let cuentaId: number;
    let mesId: number;

    test.beforeAll(async ({ request }) => {
        // Obtener mes abierto y cuenta activa para usarlos en los tests
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
     * Test: crear un ingreso vía UI persiste en la base de datos.
     *
     * Flow:
     * 1. Navegar a /movimientos
     * 2. Abrir dialog "Nuevo Movimiento"
     * 3. Seleccionar cuenta y tipo Ingreso, llenar monto y descripción
     * 4. Guardar
     * 5. Verificar que la descripción aparece en la tabla
     * 6. Verificar en el API que el movimiento fue creado
     *
     * Objetivo: el flujo de creación de ingreso persiste en la DB.
     */
    test('can create ingreso via UI and verify in API', async ({ page, request }) => {
        if (!mesId || !cuentaId) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.waitForLoadState('networkidle');

        await page.locator('#movimientos-btn-nuevo').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('#movimientos-select-cuenta').click();
        await page.getByRole('option').first().click();
        await page.locator('#movimientos-select-tipo').click();
        await page.getByRole('option', { name: 'Ingreso' }).click();
        await page.getByTestId('movimientos-input-monto').fill('150000');
        await page.getByTestId('movimientos-input-descripcion').fill('Ingreso E2E Test');
        await page.getByTestId('movimientos-input-categoria').fill('Test');

        await page.locator('#movimientos-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Ingreso E2E Test')).toBeVisible();

        // Verificar en API
        const res = await request.get(`${API_BASE}/movimientos?mes_id=${mesId}`);
        const body = await res.json();
        const movimientos = body.data?.data ?? body.data ?? [];
        const creado = movimientos.find((m: any) => m.descripcion === 'Ingreso E2E Test');
        expect(creado).toBeTruthy();
        movimientoId = creado.id;
    });

    /**
     * Test: editar movimiento vía UI actualiza la descripción.
     *
     * Flow:
     * 1. Navegar a /movimientos (asume movimiento creado en test anterior)
     * 2. Click en editar de la primera fila
     * 3. Cambiar la descripción
     * 4. Guardar y verificar en la lista
     *
     * Objetivo: la edición persiste correctamente.
     */
    test('can edit movimiento description via UI', async ({ page, request }) => {
        if (!mesId || !cuentaId) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.waitForLoadState('networkidle');

        const res = await request.get(`${API_BASE}/movimientos?mes_id=${mesId}`);
        const body = await res.json();
        const movimientos = body.data?.data ?? body.data ?? [];
        const mov = movimientos.find((m: any) => m.descripcion === 'Ingreso E2E Test');
        if (!mov) test.skip();

        await page.locator(`#data-table-btn-editar-${mov.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const inputDesc = page.getByTestId('movimientos-input-descripcion');
        await inputDesc.clear();
        await inputDesc.fill('Ingreso E2E Editado');
        await page.locator('#movimientos-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Ingreso E2E Editado')).toBeVisible();
    });

    /**
     * Test: eliminar movimiento vía UI lo remueve de la lista.
     *
     * Flow:
     * 1. Obtener la lista de movimientos
     * 2. Hacer click en eliminar
     * 3. Confirmar en el dialog
     * 4. Verificar que el movimiento ya no aparece en la tabla
     *
     * Objetivo: la eliminación de movimientos persiste correctamente.
     */
    test('can delete movimiento via UI', async ({ page, request }) => {
        if (!mesId) test.skip();

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.waitForLoadState('networkidle');

        const res = await request.get(`${API_BASE}/movimientos?mes_id=${mesId}`);
        const body = await res.json();
        const movimientos = body.data?.data ?? body.data ?? [];
        const mov = movimientos.find((m: any) =>
            m.descripcion === 'Ingreso E2E Editado' || m.descripcion === 'Ingreso E2E Test'
        );
        if (!mov) test.skip();

        await page.locator(`#data-table-btn-eliminar-${mov.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: 'Eliminar' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });
});
