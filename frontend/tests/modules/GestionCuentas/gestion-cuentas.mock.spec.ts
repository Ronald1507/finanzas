/**
 * Tests E2E del módulo GestionCuentas con API mockeada (sin backend real).
 * Cubre: listado, crear cuenta, editar, corregir saldo inicial,
 * desactivar (éxito y rechazo 409), y filtro por estado.
 */
import { test, expect } from '@playwright/test';
import {
    FRONTEND_URL,
    ROUTES,
    MES_ABIERTO_MOCK,
    successEnvelope,
    paginatedEnvelope,
    errorEnvelope,
} from '../../constants';
import { mockBootstrapMesAbierto } from '../../helpers/navigation';

// ── Datos mock ─────────────────────────────────────────────────────────────
const CUENTA_MOCK = {
    id: 1,
    nombre: 'Cuenta BCI',
    banco: 'BCI',
    tipo: 'corriente',
    activa: true,
    saldo_inicial: 500000,
};

const CUENTA_INACTIVA_MOCK = {
    id: 2,
    nombre: 'Cuenta Vieja',
    banco: null,
    tipo: 'ahorro',
    activa: false,
    saldo_inicial: 0,
};

// ── Helpers locales ────────────────────────────────────────────────────────
async function mockCuentasList(page: any, items = [CUENTA_MOCK]) {
    await page.route('**/api/cuentas**', async (route: any) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(paginatedEnvelope(items)),
            });
        } else {
            await route.continue();
        }
    });
}

// ── Suite ──────────────────────────────────────────────────────────────────
test.describe('GestionCuentas — mock', () => {

    test.beforeEach(async ({ page }) => {
        await mockBootstrapMesAbierto(page);
    });

    // ── Listado ──────────────────────────────────────────────────────────
    /**
     * Test: muestra el listado de cuentas recibido del API.
     *
     * Flow:
     * 1. Interceptar GET /api/meses y GET /api/cuentas con datos mock
     * 2. Navegar a /cuentas
     * 3. Verificar que el nombre de la cuenta aparece en la tabla
     *
     * Objetivo: la DataTable renderiza los datos del API correctamente.
     */
    test('shows account list from mocked API', async ({ page }) => {
        await mockCuentasList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await expect(page.getByText('Cuenta BCI')).toBeVisible();
        await expect(page.getByText('BCI')).toBeVisible();
    });

    /**
     * Test: muestra estado vacío cuando el API devuelve lista vacía.
     *
     * Flow:
     * 1. Interceptar /api/cuentas con array vacío
     * 2. Navegar a /cuentas
     * 3. Verificar mensaje de "No se encontraron cuentas"
     *
     * Objetivo: el estado vacío de DataTable muestra el mensaje correcto.
     */
    test('shows empty state when no accounts', async ({ page }) => {
        await mockCuentasList(page, []);
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await expect(page.getByText('No se encontraron cuentas')).toBeVisible();
    });

    // ── Crear cuenta ──────────────────────────────────────────────────────
    /**
     * Test: el botón "Nueva Cuenta" abre el dialog de creación.
     *
     * Flow:
     * 1. Cargar listado
     * 2. Hacer click en #cuentas-btn-nueva
     * 3. Verificar que el dialog con título "Nueva Cuenta" aparece
     * 4. Verificar que el campo #cuentas-input-nombre está visible
     *
     * Objetivo: el dialog de creación se abre correctamente.
     */
    test('opens create dialog when clicking Nueva Cuenta', async ({ page }) => {
        await mockCuentasList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.locator('#cuentas-btn-nueva').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Nueva Cuenta')).toBeVisible();
        await expect(page.getByTestId('cuentas-input-nombre')).toBeVisible();
    });

    /**
     * Test: el dialog de creación se cierra al hacer click en Cancelar.
     *
     * Flow:
     * 1. Abrir dialog de nueva cuenta
     * 2. Hacer click en #cuentas-dialog-btn-cancelar
     * 3. Verificar que el dialog ya no es visible
     *
     * Objetivo: el botón Cancelar cierra el dialog sin guardar.
     */
    test('closes create dialog on cancel', async ({ page }) => {
        await mockCuentasList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.locator('#cuentas-btn-nueva').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.locator('#cuentas-dialog-btn-cancelar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    /**
     * Test: crear cuenta exitosamente actualiza la lista.
     *
     * Flow:
     * 1. Interceptar POST /api/cuentas con respuesta exitosa
     * 2. Interceptar segundo GET /api/cuentas con cuenta nueva
     * 3. Abrir dialog, llenar nombre + tipo, guardar
     * 4. Verificar que aparece el snackbar de éxito o la cuenta en la lista
     *
     * Objetivo: el flujo completo de creación cierra el dialog y refresca la lista.
     */
    test('creates account successfully and refreshes list', async ({ page }) => {
        const cuentaNueva = { ...CUENTA_MOCK, nombre: 'Cuenta Nueva', id: 5 };
        let listCallCount = 0;

        await page.route('**/api/cuentas**', async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                listCallCount++;
                const items = listCallCount === 1 ? [] : [cuentaNueva];
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope(items)),
                });
            } else if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(cuentaNueva)),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.locator('#cuentas-btn-nueva').click();
        await page.getByTestId('cuentas-input-nombre').fill('Cuenta Nueva');
        await page.locator('#cuentas-select-tipo').click();
        await page.getByRole('option', { name: 'Cuenta Corriente' }).click();
        await page.locator('#cuentas-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByText('Cuenta Nueva')).toBeVisible();
    });

    // ── Editar cuenta ─────────────────────────────────────────────────────
    /**
     * Test: el dialog de edición se abre con los datos de la cuenta pre-llenados.
     *
     * Flow:
     * 1. Cargar listado con CUENTA_MOCK (id=1)
     * 2. Hacer click en el botón de editar de la fila
     * 3. Verificar que el dialog dice "Editar Cuenta"
     * 4. Verificar que el campo nombre tiene el valor existente
     *
     * Objetivo: el dialog de edición pre-llena el formulario con los datos actuales.
     */
    test('opens edit dialog pre-filled with account data', async ({ page }) => {
        await mockCuentasList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.locator(`#data-table-btn-editar-${CUENTA_MOCK.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Editar Cuenta')).toBeVisible();
        await expect(page.getByTestId('cuentas-input-nombre')).toHaveValue('Cuenta BCI');
    });

    // ── Corregir saldo inicial ────────────────────────────────────────────
    /**
     * Test: el dialog de saldo inicial se abre y permite guardar.
     *
     * Flow:
     * 1. Cargar listado con CUENTA_MOCK activa, mes abierto
     * 2. Hacer click en la acción "Corregir saldo inicial" de la fila
     * 3. Limpiar el campo e ingresar un nuevo valor
     * 4. Interceptar PUT /api/cuentas/1/saldo-inicial con éxito
     * 5. Hacer click en guardar y verificar cierre del dialog
     *
     * Objetivo: el flujo de corrección de saldo inicial funciona correctamente.
     */
    test('opens saldo inicial dialog and saves successfully', async ({ page }) => {
        await mockCuentasList(page);
        await page.route('**/api/cuentas/*/saldo-inicial**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope({ ...CUENTA_MOCK, saldo_inicial: 750000 })),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        // La acción "Corregir saldo inicial" es el primer extraAction de la fila
        await page.getByRole('button', { name: 'Corregir saldo inicial' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Corregir Saldo Inicial')).toBeVisible();
        const inputSaldo = page.getByTestId('cuentas-input-saldo-inicial-correccion');
        await inputSaldo.fill('750000');
        await page.locator('#cuentas-saldo-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Desactivar cuenta ─────────────────────────────────────────────────
    /**
     * Test: desactivar cuenta abre el ConfirmDialog y ejecuta la desactivación.
     *
     * Flow:
     * 1. Cargar listado con cuenta activa
     * 2. Hacer click en el botón "Desactivar"
     * 3. Verificar que aparece el ConfirmDialog con el título
     * 4. Interceptar POST /api/cuentas/1/desactivar con éxito
     * 5. Confirmar → dialog se cierra
     *
     * Objetivo: el flujo de desactivación pide confirmación antes de ejecutar.
     */
    test('shows confirm dialog before deactivating account', async ({ page }) => {
        await mockCuentasList(page);
        await page.route('**/api/cuentas/*/desactivar**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope({ ...CUENTA_MOCK, activa: false })),
            });
        });
        // Segunda llamada GET retorna la cuenta inactiva
        let callCount = 0;
        await page.route('**/api/cuentas**', async (route) => {
            if (route.request().method() === 'GET') {
                callCount++;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope(callCount > 1 ? [{ ...CUENTA_MOCK, activa: false }] : [CUENTA_MOCK])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.getByRole('button', { name: 'Desactivar' }).first().click();
        // ConfirmDialog no tiene data-testid; usar role dialog + button
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Desactivar Cuenta')).toBeVisible();
        await page.getByRole('button', { name: 'Desactivar' }).last().click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    /**
     * Test: rechazo 409 al desactivar cuenta con pendientes abiertos.
     *
     * Flow:
     * 1. Cargar listado con cuenta activa
     * 2. Iniciar desactivación → confirmar en dialog
     * 3. Interceptar POST /api/cuentas/1/desactivar con 409
     * 4. Verificar que aparece el snackbar de error
     *
     * Objetivo: cuando el backend rechaza la desactivación, la UI muestra el error.
     */
    test('shows error snackbar when deactivation rejected with 409', async ({ page }) => {
        await mockCuentasList(page);
        await page.route('**/api/cuentas/*/desactivar**', async (route) => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify(errorEnvelope('La cuenta tiene pendientes activos y no puede desactivarse.')),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.getByRole('button', { name: 'Desactivar' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: 'Desactivar' }).last().click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
        await expect(page.getByRole('alert')).toBeVisible();
    });

    // ── Filtro por estado ─────────────────────────────────────────────────
    /**
     * Test: el filtro de estado llama al API con el parámetro activa.
     *
     * Flow:
     * 1. Navegar a /cuentas
     * 2. Hacer click en el select de filtro y seleccionar "Activas"
     * 3. Verificar que la solicitud GET incluye activa=1 en la URL
     *
     * Objetivo: el filtro de estado pasa el parámetro correcto al API.
     */
    test('filter by estado sends activa param to API', async ({ page }) => {
        let capturedUrl = '';
        await page.route('**/api/cuentas**', async (route) => {
            if (route.request().method() === 'GET') {
                capturedUrl = route.request().url();
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([CUENTA_MOCK])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.CUENTAS}`);
        await page.locator('#cuentas-select-filtro-activa').click();
        await page.getByRole('option', { name: 'Activas' }).click();
        await page.waitForTimeout(600); // debounce 500ms
        expect(capturedUrl).toContain('activa=1');
    });
});
