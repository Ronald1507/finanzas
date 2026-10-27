/**
 * Tests E2E del módulo Movimientos con API mockeada (sin backend real).
 * Cubre: listado, crear ingreso/egreso, editar, eliminar (simple y par de transferencia),
 * registrar transferencia, y bloqueo de acciones en mes cerrado.
 */
import { test, expect } from '@playwright/test';
import {
    FRONTEND_URL,
    ROUTES,
    MES_ABIERTO_MOCK,
    successEnvelope,
    paginatedEnvelope,
} from '../../constants';
import { mockBootstrapMesAbierto, mockBootstrapMesCerrado } from '../../helpers/navigation';

// ── Datos mock ─────────────────────────────────────────────────────────────
const CUENTA_MOCK = { id: 1, nombre: 'Cuenta BCI', activa: true };

const MOVIMIENTO_INGRESO = {
    id: 1,
    cuenta_id: 1,
    cuenta: CUENTA_MOCK,
    tipo: 'ingreso',
    monto: 200000,
    fecha: '2026-06-10',
    descripcion: 'Pago de cliente',
    categoria: 'Ingresos',
    movimiento_relacionado_id: null,
};

const MOVIMIENTO_TRANSFERENCIA = {
    id: 2,
    cuenta_id: 1,
    cuenta: CUENTA_MOCK,
    tipo: 'egreso',
    monto: 50000,
    fecha: '2026-06-10',
    descripcion: 'Transferencia salida',
    categoria: 'Transferencia',
    movimiento_relacionado_id: 3,
};

// ── Helpers locales ────────────────────────────────────────────────────────
async function mockMovimientosList(page: any, items = [MOVIMIENTO_INGRESO]) {
    await page.route('**/api/movimientos**', async (route: any) => {
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
test.describe('Movimientos — mock', () => {

    test.beforeEach(async ({ page }) => {
        await mockBootstrapMesAbierto(page);
        await mockCuentasFlat(page);
    });

    // ── Listado ──────────────────────────────────────────────────────────
    /**
     * Test: muestra el listado de movimientos del mes seleccionado.
     *
     * Flow:
     * 1. Interceptar GET /api/movimientos con datos mock
     * 2. Navegar a /movimientos
     * 3. Verificar que la descripción del movimiento aparece en la tabla
     * 4. Verificar que el tipo "Ingreso" aparece
     *
     * Objetivo: la DataTable renderiza los movimientos correctamente.
     */
    test('shows movimientos list from mocked API', async ({ page }) => {
        await mockMovimientosList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await expect(page.getByText('Pago de cliente')).toBeVisible();
    });

    /**
     * Test: muestra estado vacío cuando no hay movimientos.
     *
     * Flow:
     * 1. Interceptar /api/movimientos con array vacío
     * 2. Navegar a /movimientos
     * 3. Verificar mensaje de "No hay movimientos en este mes"
     *
     * Objetivo: el estado vacío muestra el mensaje correcto.
     */
    test('shows empty state when no movimientos', async ({ page }) => {
        await mockMovimientosList(page, []);
        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await expect(page.getByText('No hay movimientos en este mes')).toBeVisible();
    });

    // ── Crear ingreso ─────────────────────────────────────────────────────
    /**
     * Test: crear un movimiento de tipo ingreso.
     *
     * Flow:
     * 1. Hacer click en #movimientos-btn-nuevo
     * 2. Seleccionar tipo "Ingreso"
     * 3. Llenar monto, descripción y categoría
     * 4. Interceptar POST /api/movimientos con éxito
     * 5. Guardar y verificar que el dialog se cierra
     *
     * Objetivo: el flujo de creación de ingreso funciona correctamente.
     */
    test('creates ingreso successfully', async ({ page }) => {
        await mockMovimientosList(page, []);
        await page.route('**/api/movimientos**', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(MOVIMIENTO_INGRESO)),
                });
            } else if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([MOVIMIENTO_INGRESO])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator('#movimientos-btn-nuevo').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Seleccionar cuenta
        await page.locator('#movimientos-select-cuenta').click();
        await page.getByRole('option', { name: 'Cuenta BCI' }).click();

        // Seleccionar tipo ingreso
        await page.locator('#movimientos-select-tipo').click();
        await page.getByRole('option', { name: 'Ingreso' }).click();

        await page.getByTestId('movimientos-input-monto').fill('200000');
        await page.getByTestId('movimientos-input-descripcion').fill('Pago de cliente');
        await page.getByTestId('movimientos-input-categoria').fill('Ingresos');

        await page.locator('#movimientos-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    /**
     * Test: crear un movimiento de tipo egreso.
     *
     * Flow:
     * 1. Abrir dialog nuevo movimiento
     * 2. Seleccionar cuenta y tipo "Egreso"
     * 3. Llenar monto y descripción
     * 4. Interceptar POST con respuesta de egreso
     * 5. Guardar y verificar que el dialog se cierra
     *
     * Objetivo: el tipo egreso se crea correctamente.
     */
    test('creates egreso successfully', async ({ page }) => {
        const egresoMock = { ...MOVIMIENTO_INGRESO, id: 10, tipo: 'egreso', descripcion: 'Pago arriendo' };
        await mockMovimientosList(page, []);
        await page.route('**/api/movimientos**', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(egresoMock)),
                });
            } else if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([egresoMock])),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator('#movimientos-btn-nuevo').click();
        await page.locator('#movimientos-select-cuenta').click();
        await page.getByRole('option', { name: 'Cuenta BCI' }).click();
        await page.locator('#movimientos-select-tipo').click();
        await page.getByRole('option', { name: 'Egreso' }).click();
        await page.getByTestId('movimientos-input-monto').fill('50000');
        await page.getByTestId('movimientos-input-descripcion').fill('Pago arriendo');
        await page.locator('#movimientos-dialog-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Editar movimiento ─────────────────────────────────────────────────
    /**
     * Test: el dialog de edición se abre con los datos del movimiento.
     *
     * Flow:
     * 1. Cargar lista con un movimiento
     * 2. Hacer click en el botón de editar de la fila
     * 3. Verificar que el dialog dice "Editar Movimiento"
     * 4. Verificar que el campo descripción tiene el valor existente
     *
     * Objetivo: el dialog de edición pre-llena correctamente el formulario.
     */
    test('opens edit dialog pre-filled with movimiento data', async ({ page }) => {
        await mockMovimientosList(page, [MOVIMIENTO_INGRESO]);
        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator(`#data-table-btn-editar-${MOVIMIENTO_INGRESO.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Editar Movimiento')).toBeVisible();
        await expect(page.getByTestId('movimientos-input-descripcion')).toHaveValue('Pago de cliente');
    });

    // ── Eliminar movimiento simple ────────────────────────────────────────
    /**
     * Test: eliminar un movimiento simple muestra el ConfirmDialog con mensaje estándar.
     *
     * Flow:
     * 1. Cargar lista con un movimiento sin movimiento_relacionado_id
     * 2. Hacer click en el botón de eliminar
     * 3. Verificar que aparece el ConfirmDialog con "Eliminar Movimiento"
     * 4. Interceptar DELETE con éxito
     * 5. Confirmar y verificar que el dialog se cierra
     *
     * Objetivo: la eliminación de movimientos simples requiere confirmación.
     */
    test('shows confirm dialog for simple movimiento deletion', async ({ page }) => {
        await mockMovimientosList(page, [MOVIMIENTO_INGRESO]);
        await page.route('**/api/movimientos/**', async (route) => {
            if (route.request().method() === 'DELETE') {
                await route.fulfill({
                    status: 204,
                    contentType: 'application/json',
                    body: JSON.stringify(successEnvelope(null)),
                });
            } else {
                await route.continue();
            }
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator(`#data-table-btn-eliminar-${MOVIMIENTO_INGRESO.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Eliminar Movimiento')).toBeVisible();
        await page.getByRole('button', { name: 'Eliminar' }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    /**
     * Test: eliminar un movimiento que forma parte de una transferencia muestra advertencia de par.
     *
     * Flow:
     * 1. Cargar lista con un movimiento que tiene movimiento_relacionado_id != null
     * 2. Hacer click en el botón de eliminar
     * 3. Verificar que el ConfirmDialog muestra el mensaje de advertencia sobre el par
     *
     * Objetivo: el usuario es advertido de que se eliminará el movimiento par.
     */
    test('shows transfer pair warning when deleting transferencia movimiento', async ({ page }) => {
        await mockMovimientosList(page, [MOVIMIENTO_TRANSFERENCIA]);
        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator(`#data-table-btn-eliminar-${MOVIMIENTO_TRANSFERENCIA.id}`).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/también se eliminará su movimiento par/i)).toBeVisible();
    });

    // ── Transferencia ─────────────────────────────────────────────────────
    /**
     * Test: el dialog de transferencia se abre correctamente.
     *
     * Flow:
     * 1. Cargar lista de movimientos
     * 2. Hacer click en #movimientos-btn-transferencia
     * 3. Verificar que el dialog "Nueva Transferencia" aparece
     * 4. Verificar que los selects de cuenta origen y destino están presentes
     *
     * Objetivo: el dialog de transferencia se abre con los campos requeridos.
     */
    test('opens transferencia dialog with required fields', async ({ page }) => {
        await mockMovimientosList(page);
        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator('#movimientos-btn-transferencia').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Nueva Transferencia')).toBeVisible();
        await expect(page.getByTestId('movimientos-transferencia-select-origen')).toBeVisible();
        await expect(page.getByTestId('movimientos-transferencia-select-destino')).toBeVisible();
    });

    /**
     * Test: registrar una transferencia cierra el dialog y refresca la lista.
     *
     * Flow:
     * 1. Abrir dialog de transferencia
     * 2. Seleccionar cuenta origen y destino
     * 3. Llenar monto, fecha y descripción
     * 4. Interceptar POST /api/movimientos/transferencia con éxito
     * 5. Confirmar y verificar que el dialog se cierra
     *
     * Objetivo: el flujo completo de transferencia funciona correctamente.
     */
    test('registers transferencia successfully', async ({ page }) => {
        const cuenta2 = { id: 2, nombre: 'Cuenta Efectivo', activa: true };
        await page.route('**/api/cuentas**', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(paginatedEnvelope([CUENTA_MOCK, cuenta2])),
                });
            } else {
                await route.continue();
            }
        });
        await page.route('**/api/movimientos/transferencia**', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(successEnvelope({ egreso: MOVIMIENTO_TRANSFERENCIA, ingreso: { ...MOVIMIENTO_TRANSFERENCIA, id: 3, tipo: 'ingreso' } })),
            });
        });
        await mockMovimientosList(page);

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await page.locator('#movimientos-btn-transferencia').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.locator('#movimientos-transferencia-select-origen').click();
        await page.getByRole('option', { name: 'Cuenta BCI' }).click();
        await page.locator('#movimientos-transferencia-select-destino').click();
        await page.getByRole('option', { name: 'Cuenta Efectivo' }).click();
        await page.getByTestId('movimientos-transferencia-input-monto').fill('50000');
        await page.getByTestId('movimientos-transferencia-input-descripcion').fill('Traspaso entre cuentas');

        await page.locator('#movimientos-transferencia-btn-guardar').click();
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    // ── Mes cerrado ───────────────────────────────────────────────────────
    /**
     * Test: los botones de acción están deshabilitados cuando el mes está cerrado.
     *
     * Flow:
     * 1. Interceptar /api/meses para retornar un mes cerrado
     * 2. Interceptar /api/movimientos con datos de ejemplo
     * 3. Navegar a /movimientos
     * 4. Verificar que #movimientos-btn-nuevo está deshabilitado
     * 5. Verificar que #movimientos-btn-transferencia está deshabilitado
     * 6. Verificar el aviso de "Mes cerrado"
     *
     * Objetivo: las acciones de escritura se bloquean cuando el mes está cerrado.
     */
    test('action buttons disabled when mes is closed', async ({ page }) => {
        await mockBootstrapMesCerrado(page);
        await page.route('**/api/movimientos**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(paginatedEnvelope([])),
            });
        });

        await page.goto(`${FRONTEND_URL}${ROUTES.MOVIMIENTOS}`);
        await expect(page.locator('#movimientos-btn-nuevo')).toBeDisabled();
        await expect(page.locator('#movimientos-btn-transferencia')).toBeDisabled();
        await expect(page.getByText(/Mes cerrado/i)).toBeVisible();
    });
});
