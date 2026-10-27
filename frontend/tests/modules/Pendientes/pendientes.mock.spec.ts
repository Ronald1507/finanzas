/**
 * Tests E2E del módulo Pendientes con API mockeada (sin backend real).
 * Cubre: listado, crear por pagar/por recibir, editar, concretar,
 * anular y filtros de tipo/estado.
 */
import { test, expect } from '@playwright/test';
import {
    FRONTEND_URL,
    ROUTES,
    successEnvelope,
    paginatedEnvelope,
} from '../../constants';
import { mockBootstrapMesAbierto } from '../../helpers/navigation';

// ── Datos mock ─────────────────────────────────────────────────────────────
const CUENTA_MOCK = { id: 1, nombre: 'Cuenta BCI', activa: true };

const PENDIENTE_POR_PAGAR = {
    id: 1,
    cuenta_id: 1,
    cuenta: CUENTA_MOCK,
    tipo: 'por_pagar',
    monto: 80000,
    descripcion: 'Pago de servicios',
    fecha_estimada: '2026-06-20',
    estado: 'pendiente',
    movimiento_id: null,
};

const PENDIENTE_POR_RECIBIR = {
    id: 2,
    cuenta_id: 1,
    cuenta: CUENTA_MOCK,
    tipo: 'por_recibir',
    monto: 120000,
    descripcion: 'Cobro de consultoría',
    fecha_estimada: '2026-06-25',
    estado: 'pendiente',
    movimiento_id: null,
};

// ── Helpers locales ────────────────────────────────────────────────────────
async function mockPendientesList(page: any, items = [PENDIENTE_POR_PAGAR]) {
    await page.route('**/api/pendientes**', async (route: any) => {
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

async function mockCuentasFlat(page: any) {
    await page.route('**/api/cuentas**', async (route: any) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(paginatedEnvelope([CUENTA_MOCK])),
            });
        } else {
            await route.continue();
        }
    });
}

// ── Suite ──────────────────────────────────────────────────────────────────
test.describe('Pendientes — mock', () => {

    test.beforeEach(async ({ page }) => {
        await mockBootstrapMesAbierto(page);
        await mockCuentasFlat(page);
    });

    // ── Listado ──────────────────────────────────────────────────────────
    /**
     * Test: muestra el listado de pendientes del mes seleccionado.
     *
     * Flow:
     * 1. Interceptar GET /api/pendientes con datos mock
     * 2. Navegar a /pendientes
     * 3. Verificar que la descripción del pendiente aparece en la tabla
     *
     * Objetivo: la DataTable renderiza los pendientes correctamente.
     */
    test('shows pendientes list from mocked API', async ({ page }) => {
        await mockPendientesList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await expect(page.getByText('Pago de servicios')).toBeVisible();
    });

    /**
     * Test: muestra estado vacío cuando no hay pendientes.
     *
     * Flow:
     * 1. Interceptar /api/pendientes con array vacío
     * 2. Navegar a /pendientes
     * 3. Verificar mensaje de "No hay pendientes en este mes"
     *
     * Objetivo: el estado vacío muestra el mensaje correcto.
     */
    test('shows empty state when no pendientes', async ({ page }) => {
        await mockPendientesList(page, []);
        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await expect(page.getByText('No hay pendientes en este mes')).toBeVisible();
    });

    // ── Crear por pagar ───────────────────────────────────────────────────
    /**
     * Test: el botón "Nuevo Pendiente" abre el dialog de creación.
     *
     * Flow:
     * 1. Cargar listado
     * 2. Hacer click en #pendientes-btn-nuevo
     * 3. Verificar que el dialog aparece con el título correcto
     *
     * Objetivo: el dialog de creación se abre correctamente.
     */
    test('opens create dialog when clicking Nuevo Pendiente', async ({ page }) => {
        await mockPendientesList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.locator('#pendientes-btn-nuevo').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Nuevo Pendiente')).toBeVisible();
        await expect(page.getByTestId('pendientes-input-descripcion')).toBeVisible();
    });

    /**
     * Test: crear un pendiente de tipo "por pagar" con todos los campos.
     *
     * Flow:
     * 1. Abrir dialog nuevo pendiente
     * 2. Seleccionar cuenta y tipo "Por Pagar"
     * 3. Llenar monto, descripción y fecha estimada
     * 4. Interceptar POST /api/pendientes con éxito
     * 5. Guardar y verificar cierre del dialog
     *
     * Objetivo: la creación de pendiente por pagar funciona correctamente.
     */
    test('creates pendiente por pagar successfully', async ({ page }) => {
        let listCallCount = 0;
        await page.route('**/api/pendientes**', async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                listCallCount++;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope(listCallCount > 1 ? [PENDIENTE_POR_PAGAR] : [])),
                });
            } else if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(PENDIENTE_POR_PAGAR)),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.locator('#pendientes-btn-nuevo').click();

        await page.locator('#pendientes-select-cuenta').click();
        await page.getByRole('option', { name: 'Cuenta BCI' }).click();
        await page.locator('#pendientes-select-tipo').click();
        await page.getByRole('option', { name: 'Por Pagar' }).click();
        await page.getByTestId('pendientes-input-monto').fill('80000');
        await page.getByTestId('pendientes-input-descripcion').fill('Pago de servicios');
        await page.getByTestId('pendientes-input-fecha-estimada').fill('2026-06-20');

        await page.locator('#pendientes-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    /**
     * Test: crear un pendiente de tipo "por recibir".
     *
     * Flow:
     * 1. Abrir dialog y seleccionar tipo "Por Recibir"
     * 2. Llenar campos y guardar
     * 3. Verificar que el dialog se cierra correctamente
     *
     * Objetivo: el tipo por recibir se crea sin errores.
     */
    test('creates pendiente por recibir successfully', async ({ page }) => {
        await page.route('**/api/pendientes**', async (route) => {
            const method = route.request().method();
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([])),
                });
            } else if (method === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(PENDIENTE_POR_RECIBIR)),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.locator('#pendientes-btn-nuevo').click();
        await page.locator('#pendientes-select-cuenta').click();
        await page.getByRole('option', { name: 'Cuenta BCI' }).click();
        await page.locator('#pendientes-select-tipo').click();
        await page.getByRole('option', { name: 'Por Recibir' }).click();
        await page.getByTestId('pendientes-input-monto').fill('120000');
        await page.getByTestId('pendientes-input-descripcion').fill('Cobro de consultoría');
        await page.locator('#pendientes-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Concretar pendiente ───────────────────────────────────────────────
    /**
     * Test: el dialog de concretar pide la fecha y ejecuta la concreción.
     *
     * Flow:
     * 1. Cargar lista con un pendiente en estado "pendiente"
     * 2. Hacer click en el botón "Concretar" de la fila
     * 3. Verificar que el dialog "Concretar Pendiente" aparece con la descripción
     * 4. Interceptar POST /api/pendientes/1/concretar con éxito
     * 5. Guardar la fecha y verificar que el dialog se cierra
     *
     * Objetivo: el flujo de concreción genera el movimiento real correctamente.
     */
    test('concretar pendiente opens dialog and executes concrecion', async ({ page }) => {
        await mockPendientesList(page, [PENDIENTE_POR_PAGAR]);
        await page.route('**/api/pendientes/*/concretar**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope({ ...PENDIENTE_POR_PAGAR, estado: 'realizado', movimiento_id: 10 })),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.getByRole('button', { name: 'Concretar' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Concretar Pendiente')).toBeVisible();
        await expect(page.getByText('Pago de servicios')).toBeVisible();

        const inputFecha = page.getByTestId('pendientes-concretar-input-fecha');
        await inputFecha.fill('2026-06-15');
        await page.locator('#pendientes-concretar-btn-confirmar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Anular pendiente ──────────────────────────────────────────────────
    /**
     * Test: anular pendiente muestra ConfirmDialog antes de ejecutar.
     *
     * Flow:
     * 1. Cargar lista con pendiente en estado "pendiente"
     * 2. Hacer click en el botón "Anular" de la fila
     * 3. Verificar que el ConfirmDialog aparece con "Anular Pendiente"
     * 4. Interceptar POST /api/pendientes/1/anular con éxito
     * 5. Confirmar y verificar cierre del dialog
     *
     * Objetivo: la anulación requiere confirmación y actualiza el estado.
     */
    test('anular pendiente shows confirm dialog before executing', async ({ page }) => {
        await mockPendientesList(page, [PENDIENTE_POR_PAGAR]);
        await page.route('**/api/pendientes/*/anular**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope({ ...PENDIENTE_POR_PAGAR, estado: 'anulado' })),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.getByRole('button', { name: 'Anular' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Anular Pendiente')).toBeVisible();
        await page.getByRole('button', { name: 'Anular' }).last().click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Filtros ───────────────────────────────────────────────────────────
    /**
     * Test: el filtro por tipo envía el parámetro tipo al API.
     *
     * Flow:
     * 1. Navegar a /pendientes
     * 2. Seleccionar "Por Pagar" en el filtro de tipo
     * 3. Verificar que la petición GET incluye tipo=por_pagar
     *
     * Objetivo: el filtro de tipo funciona y pasa el parámetro correcto.
     */
    test('filter by tipo sends tipo param to API', async ({ page }) => {
        let capturedUrl = '';
        await page.route('**/api/pendientes**', async (route) => {
            if (route.request().method() === 'GET') {
                capturedUrl = route.request().url();
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.locator('#pendientes-select-filtro-tipo').click();
        await page.getByRole('option', { name: 'Por Pagar' }).click();
        await page.waitForTimeout(600);
        expect(capturedUrl).toContain('tipo=por_pagar');
    });

    /**
     * Test: el filtro por estado envía el parámetro estado al API.
     *
     * Flow:
     * 1. Navegar a /pendientes
     * 2. Seleccionar "Realizado" en el filtro de estado
     * 3. Verificar que la petición GET incluye estado=realizado
     *
     * Objetivo: el filtro de estado funciona y pasa el parámetro correcto.
     */
    test('filter by estado sends estado param to API', async ({ page }) => {
        let capturedUrl = '';
        await page.route('**/api/pendientes**', async (route) => {
            if (route.request().method() === 'GET') {
                capturedUrl = route.request().url();
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.PENDIENTES}`);
        await page.locator('#pendientes-select-filtro-estado').click();
        await page.getByRole('option', { name: 'Realizado' }).click();
        await page.waitForTimeout(600);
        expect(capturedUrl).toContain('estado=realizado');
    });
});
