# Mejoras de extensión — Sistema Finanzas v2

Objetivo: agregar categorías normalizadas, observaciones, cuotas, búsqueda global, presupuestos y reportería al sistema actual.
Branch: feat/mejoras-extension
Delivery: ask-on-risk
Test runner: Pest (backend) · Playwright (frontend)

---

## Specs

### S1 — Tabla `categorias` y migración de movimientos

Crear tabla `categorias`:
- Columnas: `id`, `nombre` string único, `color` char(7) nullable (hex CSS, e.g. `#E53935`), `activa` boolean default true, `timestamps`
- Seed inicial con estas categorías (nombre → color):
  - General → #9E9E9E
  - Alimentación → #43A047
  - Transporte → #1E88E5
  - Salud → #E53935
  - Entretenimiento → #8E24AA
  - Pago Tarjeta Crédito → #F4511E
  - Servicios → #00ACC1
  - Educación → #FFB300
  - Vivienda → #6D4C41
  - Otros → #757575

Migrar `movimientos`:
- Agregar columna `categoria_id` bigint unsigned nullable FK → `categorias.id` (nullOnDelete)
- Correr update: `UPDATE movimientos SET categoria_id = (SELECT id FROM categorias WHERE nombre = movimientos.categoria LIMIT 1)`
- El string `General` mapea al registro "General" recién creado; cualquier otro valor no reconocido queda NULL
- Eliminar columna `movimientos.categoria` (string) en la misma migración o en una siguiente
- La columna `categoria_id` es nullable para mantener compatibilidad temporal; el frontend y validaciones la tratan como requerida

Backend CSR:
- `CategoriaController` → index, store, update, destroy (soft-destroy: desactivar si tiene movimientos, borrar físico si no)
- `CategoriaService` → validar unicidad de nombre, no borrar si tiene movimientos vinculados
- `CategoriaRepository`
- Rutas: `GET /categorias`, `POST /categorias`, `PUT /categorias/{id}`, `DELETE /categorias/{id}`
- `MovimientoService` y `MovimientoController`: reemplazar campo `categoria` string por `categoria_id` FK en crear/editar

### S2 — Frontend: módulo Categorías + MovimientoDialog actualizado

Módulo `GestionCategorias`:
- Tabla con columnas: chip de color, nombre, estado (activa/inactiva), acciones (editar, desactivar/activar)
- `CategoriaDialog` para crear/editar: input nombre + color picker hex (input type=color o campo hex manual), toggle activa
- Desactivar con confirmación si tiene movimientos; borrar solo si no los tiene

`MovimientoDialog` actualizado:
- Reemplazar input libre "categoria" por `ComboBox` con categorías activas
- Mostrar chip de color junto al nombre en las opciones del combo

Tabla de movimientos:
- Columna categoría muestra chip con color + nombre

### S3 — Observaciones en movimientos

Migración:
- Agregar columna `observacion` TEXT nullable a `movimientos`

Backend:
- Incluir `observacion` en crear/editar movimiento (opcional, sin validación de formato)
- Incluir en respuesta JSON de movimientos

Frontend:
- `MovimientoDialog`: agregar textarea "Observación" (opcional, placeholder: "Notas adicionales...")
- Tabla de movimientos: mostrar ícono de nota si tiene observación; al hacer hover muestra el texto en tooltip

### S4 — Tracking de cuotas en pendientes

Migración:
- Agregar a `pendientes`: `cuota_actual` tinyint unsigned nullable, `cuota_total` tinyint unsigned nullable

Reglas de negocio:
- Ambos campos son opcionales; si uno tiene valor el otro también debe tenerlo
- `cuota_actual` >= 1 y `cuota_actual` <= `cuota_total`
- `cuota_total` >= 1

Backend:
- Incluir `cuota_actual` y `cuota_total` en crear/editar pendiente
- Validar la regla anterior en `PendienteService`

Frontend:
- `PendienteDialog`: dos inputs numéricos opcionales "Cuota actual" y "Total de cuotas" (ej. 3 / 12)
- Tabla de pendientes: columna que muestra "3/12" si tiene cuotas, vacío si null
- Al concretar una pendiente con cuotas: mostrar en el dialog de concretar el texto "Cuota X de Y"

### S5 — Búsqueda global de movimientos

Backend:
- Nuevo endpoint: `GET /movimientos/buscar`
- Query params: `q` (texto libre sobre descripcion u observacion), `categoria_id`, `tipo` (ingreso|egreso), `cuenta_id`, `fecha_desde` (YYYY-MM-DD), `fecha_hasta` (YYYY-MM-DD)
- Todos los filtros son opcionales; sin filtros devuelve los últimos 50
- Busca en toda la historia (sin restricción de mes)
- Respuesta incluye el mes al que pertenece cada movimiento (`mes.anio`, `mes.mes`, `mes.estado`)
- Paginado: 50 por página con cursor o page param
- Ordenado: fecha DESC

Frontend:
- Nueva tab "Buscar" (o sección) en el módulo Movimientos
- Formulario de filtros: texto libre, categoría, tipo, cuenta, rango de fechas
- Tabla de resultados con columna adicional "Mes" (ej. "Nov 2025")
- Resultados en tiempo real al aplicar filtros (botón Buscar o debounce)

### S6 — Presupuesto mensual por categoría

Tabla `presupuestos`:
- Columnas: `id`, `categoria_id` FK, `mes_id` FK, `monto_limite` decimal(15,2), `timestamps`
- Unique: `(categoria_id, mes_id)`

Backend CSR:
- `PresupuestoController` → index (por mes), store, update, destroy
- `PresupuestoService` → validar unicidad, `monto_limite` > 0
- `PresupuestoRepository`
- Rutas: `GET /presupuestos?mes_id=X`, `POST /presupuestos`, `PUT /presupuestos/{id}`, `DELETE /presupuestos/{id}`
- `DashboardController`: incluir en la respuesta por cada cuenta_mes los presupuestos del mes con ejecutado vs límite

### S7 — Frontend: módulo Presupuestos + widget Dashboard

Módulo `Presupuestos`:
- Tabla por mes: categoría (chip color), límite, ejecutado (sum de movimientos egreso de esa cat en ese mes), % usado, estado (ok / alerta >80% / excedido >100%)
- Crear/editar presupuesto: seleccionar categoría + ingresar monto límite

Widget en `SaldosDashboard`:
- Sección "Presupuesto del mes" con barra de progreso por categoría que tiene presupuesto asignado
- Colores: verde <80%, amarillo 80–100%, rojo >100%
- Solo mostrar si hay al menos un presupuesto en el mes activo

### S8 — Reportes: backend

Tres endpoints nuevos bajo `/reportes`:

`GET /reportes/resumen-mensual?mes_id=X`
- Respuesta: `{ ingresos_total, egresos_total, balance_neto, por_categoria: [{categoria, monto, porcentaje}] }`
- Solo egresos en `por_categoria`

`GET /reportes/evolucion-anual?anio=X`
- Respuesta: array de 12 items (uno por mes del año, null si el mes no existe)
- Por mes: `{ mes, anio, saldo_inicial, ingresos, egresos, saldo_final, estado }`

`GET /reportes/gastos-categoria?anio=X&mes_id=X` (mes_id opcional)
- Si se pasa mes_id: gastos del mes por categoría
- Si solo anio: gastos acumulados del año por categoría

### S9 — Frontend: módulo Reportes

Librería: `recharts` (agregar a package.json)

Tres vistas en un módulo `Reportes` con tabs o secciones:

**Resumen mensual** (usar mes activo como default, navegable):
- Gráfico de barras doble: Ingresos vs Egresos del mes seleccionado vs los 5 meses anteriores
- Gráfico de torta o barras horizontales: distribución de egresos por categoría del mes

**Evolución anual** (año seleccionable):
- Gráfico de línea: saldo final por mes a lo largo del año
- Gráfico de barras apiladas: ingresos y egresos por mes

**Gastos por categoría**:
- Tabla + gráfico de barras horizontales: qué categorías concentran más gasto en el mes o el año

---

## Tasks

| ID | Descripción | Specs | Ruta | Estado | Commit |
|----|-------------|-------|------|--------|--------|
| T1 | Migraciones categorías + data migration movimientos | S1 | inline | [ ] | — |
| T2 | Backend CSR Categorías + actualizar MovimientoService | S1 | inline | [ ] | — |
| T3 | Frontend módulo Categorías + MovimientoDialog actualizado | S2 | inline | [ ] | — |
| T4 | Migración observacion en movimientos + backend + frontend | S3 | inline | [ ] | — |
| T5 | Migración cuotas en pendientes + backend + frontend | S4 | inline | [ ] | — |
| T6 | Backend búsqueda global | S5 | inline | [ ] | — |
| T7 | Frontend búsqueda global | S5 | inline | [ ] | — |
| T8 | Migraciones + backend CSR Presupuestos + dashboard update | S6 | inline | [ ] | — |
| T9 | Frontend módulo Presupuestos + widget Dashboard | S7 | inline | [ ] | — |
| T10 | Backend 3 endpoints Reportes | S8 | inline | [ ] | — |
| T11 | Frontend módulo Reportes + recharts | S9 | inline | [ ] | — |

Orden de ejecución: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11

T1 es prerequisito de todos. T2 prerequisito de T3. T8 prerequisito de T9. T10 prerequisito de T11.
T6 y T7 pueden ejecutarse luego de T2 (necesitan categoria_id en la búsqueda).

---

## Log

L1 (2026-11-04): "quiero que pienses como una persona normal que quiere gestionar y mantener de forma ordenada sus cuentas bancarias [...] analicemos el sistema y veamos que más se le puede agregar para hacerlo aun más completo". Features acordadas: (1) categorías normalizadas con tabla, (2) reportería con gráficos, (3) búsqueda global, (4) observaciones en movimientos, (5) presupuesto mensual por categoría, (6) tracking de cuotas en pendientes. Multi-moneda, metas de ahorro y comprobantes diferidos para después.
