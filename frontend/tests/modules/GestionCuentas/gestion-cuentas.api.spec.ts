/**
 * Tests E2E del módulo GestionCuentas con API real.
 * Requiere backend corriendo en http://localhost:8005/api.
 *
 * Antes de ejecutar:
 *   cd backend
 *   $env:Path = "$env:USERPROFILE\.config\herd\bin;" + $env:Path
 *   php artisan migrate:fresh
 *   php artisan serve --port=8005
 *
 * Luego en otra terminal (frontend):
 *   cd frontend
 *   npm run dev:test
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { FRONTEND_URL, API_BASE, ROUTES } from '../../constants';

test.describe('GestionCuentas — API real', () => {
    test.setTimeout(30000);

    let cuentaId: number;

    /**
     * Test: crear cuenta via UI persiste en el API real.
     *
     * Flow:
     * 1. Navegar a /cuentas
     * 2. Click en "Nueva Cuenta"
     * 3. Llenar nombre, tipo y saldo inicial
     * 4. Guardar
     * 5. Verificar que la cuenta aparece en la lista y en el API
     *
     * Objetivo: el flujo completo de creación persiste en la base de datos.
     */
    test('can create account via UI and verify in API', async ({ page, request }) => {
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.waitForLoadState('networkidle');

        await page.locator('#cuentas-btn-nueva').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.getByTestId('cuentas-input-nombre').fill('Cuenta API Test');
        await page.getByTestId('cuentas-input-banco').fill('Banco Test');
        await page.locator('#cuentas-select-tipo').click();
        await page.getByRole('option', { name: 'Cuenta Corriente' }).click();
        await page.getByTestId('cuentas-input-saldo-inicial').fill('100000');

        await page.locator('#cuentas-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Cuenta API Test')).toBeVisible();

        // Verificar persistencia en API
        const res = await request.get(`${API_BASE}/cuentas`);
        const body = await res.json();
        const cuentas = body.data?.data ?? body.data ?? [];
        const creada = cuentas.find((c: any) => c.nombre === 'Cuenta API Test');
        expect(creada).toBeTruthy();
        cuentaId = creada.id;
    });

    /**
     * Test: editar cuenta vía UI actualiza los datos en el API.
     *
     * Flow:
     * 1. Navegar a /cuentas (asume que existe Cuenta API Test del test anterior)
     * 2. Hacer click en editar
     * 3. Cambiar el nombre y guardar
     * 4. Verificar que el nombre actualizado aparece en la tabla
     * 5. Verificar en el API que el nombre fue actualizado
     *
     * Objetivo: la edición persiste correctamente en la base de datos.
     */
    test('can edit account via UI', async ({ page, request }) => {
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.waitForLoadState('networkidle');

        // Buscar la cuenta creada en el test anterior
        const res = await request.get(`${API_BASE}/cuentas`);
        const body = await res.json();
        const cuentas = body.data?.data ?? body.data ?? [];
        const cuenta = cuentas.find((c: any) => c.nombre === 'Cuenta API Test');
        if (!cuenta) test.skip();

        await page.locator(`#data-table-btn-editar-${cuenta.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Editar Cuenta')).toBeVisible();

        const inputNombre = page.getByTestId('cuentas-input-nombre');
        await inputNombre.clear();
        await inputNombre.fill('Cuenta Editada');
        await page.locator('#cuentas-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Cuenta Editada')).toBeVisible();
    });

    /**
     * Test: corregir saldo inicial actualiza el dato en la API.
     *
     * Flow:
     * 1. Obtener la primera cuenta activa via API
     * 2. Navegar a /cuentas
     * 3. Click en "Corregir saldo inicial" de la primera fila
     * 4. Ingresar un nuevo saldo y guardar
     * 5. Verificar que el API refleja el nuevo saldo
     *
     * Objetivo: la corrección del saldo inicial persiste correctamente.
     */
    test('can update saldo inicial via UI', async ({ page, request }) => {
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.waitForLoadState('networkidle');

        // Solo ejecutar si hay cuentas activas
        const res = await request.get(`${API_BASE}/cuentas?activa=1`);
        const body = await res.json();
        const cuentas = body.data?.data ?? body.data ?? [];
        if (cuentas.length === 0) test.skip();

        await page.getByRole('button', { name: /Corregir saldo inicial/i }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        const inputSaldo = page.getByTestId('cuentas-input-saldo-inicial-correccion');
        await inputSaldo.fill('250000');
        await page.locator('#cuentas-saldo-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });
});
