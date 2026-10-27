## ADDED Requirements — gastos-fijos

> **Origen:** módulo implementado fuera del flujo SDD inicial. Esta spec formaliza
> el comportamiento ya existente y establece los criterios de aceptación verificables.
> Fuente de referencia: planilla `Cuentas 2026.ods`, sección de items recurrentes al
> inicio de cada hoja mensual (Netflix, Spotify, Tarjetas, Crédito consumo, etc.).

---

### Concepto

Un **gasto fijo** es un egreso que se repite cada mes (o con frecuencia regular) y
que el usuario define una sola vez en un catálogo. Cada mes el usuario registra el
pago real, lo que crea un movimiento de tipo **egreso** vinculado al gasto fijo por
`gasto_fijo_id`. El catálogo no genera movimientos automáticamente.

---

### Requirement: Crear un gasto fijo en el catálogo

El sistema SHALL permitir crear un gasto fijo con nombre, categoría opcional,
cuenta por defecto opcional y monto estimado opcional. El nombre no necesita ser
único; distintos gastos pueden compartir nombre si el usuario lo decide.

#### Scenario: Creación con monto estimado

- **WHEN** el usuario crea un gasto fijo con nombre "Netflix", categoría
  "Streaming" y monto estimado 12990
- **THEN** el sistema registra el gasto fijo como activo con esos datos y
  lo incluye en la lista del catálogo

#### Scenario: Creación sin monto estimado

- **WHEN** el usuario crea un gasto fijo "Tarjeta Banco Chile" sin monto estimado
- **THEN** el sistema lo registra correctamente; el monto real se ingresará al
  registrar el pago cada mes

#### Scenario: Validación de cuenta inexistente

- **WHEN** el usuario intenta crear un gasto fijo con un `cuenta_id` que no existe
- **THEN** el sistema rechaza la operación con error de validación en el campo
  `cuenta_id`

---

### Requirement: Editar un gasto fijo

El sistema SHALL permitir editar nombre, categoría, cuenta por defecto y monto
estimado de un gasto fijo existente, esté activo o inactivo. Los movimientos
históricos vinculados NO se modifican retroactivamente.

#### Scenario: Edición del monto estimado

- **WHEN** el usuario edita el monto estimado de "Spotify" de 7990 a 8250
- **THEN** el sistema guarda el nuevo monto estimado; los pagos ya registrados en
  meses anteriores conservan el monto con el que fueron registrados

---

### Requirement: Desactivar un gasto fijo

El sistema SHALL permitir desactivar un gasto fijo poniendo `activo = false`. La
desactivación NO elimina los movimientos históricos vinculados. Un gasto fijo
inactivo no aparece en la vista mensual ni puede recibir nuevos pagos.

#### Scenario: Desactivación

- **WHEN** el usuario desactiva el gasto fijo "Cable Directv"
- **THEN** el gasto fijo queda con `activo = false`; sus movimientos históricos
  permanecen intactos en los meses anteriores; no aparece en futuras vistas mensuales

---

### Requirement: Listar gastos fijos por mes

El sistema SHALL exponer un endpoint que devuelva todos los gastos fijos **activos**
con su estado de pago para un mes específico. La respuesta MUST incluir:

- `id`, `nombre`, `categoria`, `cuenta_id`, `monto_estimado`
- `movimiento_id`: ID del movimiento generado en ese mes, o `null` si no fue pagado
- `monto_pagado`: monto real del movimiento de ese mes, o `null` si no fue pagado
- `pagado`: boolean derivado de `movimiento_id !== null`
- `totales.estimado`: suma de `monto_estimado` de todos los activos del mes
- `totales.pagado`: suma de `monto_pagado` de los gastos pagados en el mes
- `totales.pendientes`: cantidad de gastos activos sin pago en el mes

El cálculo de `monto_pagado` se obtiene mediante un LEFT JOIN de `gastos_fijos`
con `movimientos` filtrando por `gasto_fijo_id = gf.id AND mes_id = :mesId`.

#### Scenario: Mes con pagos parciales

- **GIVEN** existen 3 gastos fijos activos: Netflix (pagado), Spotify (pagado),
  Cable (no pagado)
- **WHEN** el frontend consulta `GET /api/gastos-fijos/mes/{mesId}`
- **THEN** la respuesta contiene los 3 items con `pagado: true` para Netflix y
  Spotify, `pagado: false` para Cable, y `totales.pendientes = 1`

---

### Requirement: Registrar el pago de un gasto fijo

El sistema SHALL permitir registrar el pago de un gasto fijo en un mes abierto.
El pago MUST:

1. Crear un movimiento de tipo `egreso` con la descripción igual al nombre del
   gasto fijo, la categoría del gasto fijo, el monto ingresado, la fecha y la
   cuenta indicados, y `gasto_fijo_id` apuntando al gasto fijo.
2. Derivar el `mes_id` del movimiento a partir de la fecha (igual que
   `MovimientoService::crear`).
3. Rechazar el pago si ya existe un movimiento con ese `gasto_fijo_id` en el
   mismo mes.
4. Rechazar el pago si el mes derivado de la fecha está cerrado.
5. Rechazar el pago si la cuenta está inactiva.

Los movimientos generados por gastos fijos son egresos estándar: `SaldoService`
los incluye automáticamente en el cálculo de `saldo_temporal` sin lógica especial.

#### Scenario: Pago exitoso en mes abierto

- **WHEN** el usuario registra el pago de "Netflix" con monto 12990,
  fecha 2026-10-22 y cuenta "CTA Corriente Banco Falabella"
- **THEN** el sistema crea un movimiento `{tipo: egreso, monto: 12990,
  descripcion: "Netflix", categoria: "Streaming", gasto_fijo_id: <id>}` en el
  mes de octubre 2026, y el gasto fijo aparece como `pagado: true` en la vista
  del mes

#### Scenario: Pago duplicado en el mismo mes

- **GIVEN** "Netflix" ya tiene un pago registrado en octubre 2026
- **WHEN** el usuario intenta registrar un segundo pago de "Netflix" en octubre 2026
- **THEN** el sistema rechaza la operación con HTTP 409 indicando que el gasto fijo
  ya fue registrado este mes

#### Scenario: Pago en mes cerrado

- **WHEN** el usuario intenta registrar el pago de un gasto fijo con una fecha
  que cae en un mes cerrado
- **THEN** el sistema rechaza la operación con HTTP 409 indicando que el mes
  está cerrado (validación delegada a `MovimientoService::crear`)

#### Scenario: Gasto fijo inactivo

- **WHEN** el usuario intenta registrar el pago de un gasto fijo con `activo = false`
- **THEN** el sistema rechaza la operación con HTTP 422 indicando que el gasto fijo
  no existe o está inactivo

---

### Requirement: Deshacer el pago de un gasto fijo

El sistema SHALL permitir deshacer el pago de un gasto fijo en un mes abierto.
Deshacer el pago MUST eliminar el movimiento vinculado mediante
`MovimientoService::eliminar` (que valida que el mes esté abierto). Tras la
eliminación, el gasto fijo vuelve a aparecer como `pagado: false` en el mes.

#### Scenario: Deshacer pago exitoso

- **GIVEN** "Netflix" tiene un pago registrado en octubre 2026 y ese mes está abierto
- **WHEN** el usuario deshace el pago (`DELETE /api/gastos-fijos/{id}/pago/{mesId}`)
- **THEN** el movimiento es eliminado y "Netflix" aparece como `pagado: false` en
  la vista mensual; el saldo temporal del mes se recalcula sin ese egreso

#### Scenario: Deshacer pago inexistente

- **WHEN** el usuario intenta deshacer el pago de un gasto fijo que no tiene
  movimiento registrado en el mes indicado
- **THEN** el sistema rechaza la operación con HTTP 404

---

### Requirement: Visibilidad en el módulo Movimientos

Los movimientos generados por gastos fijos son egresos estándar y MUST aparecer
en el listado de `GET /api/movimientos` con los demás movimientos del mes. El
campo `gasto_fijo_id` está disponible en el movimiento para que el frontend pueda
distinguirlos visualmente (indicador de "gasto fijo" en la tabla).

Un movimiento vinculado a un gasto fijo puede eliminarse directamente desde el
módulo Movimientos. Al eliminarse de esa forma, el gasto fijo queda automáticamente
como `pagado: false` para ese mes (la consulta `findMovimientoDelMes` no encuentra
el movimiento eliminado).

> **Nota:** editar el movimiento directamente desde Movimientos (cambio de monto o
> fecha) es posible pero no actualiza retroactivamente el catálogo del gasto fijo.
> Es la vía de corrección de un pago ya registrado.

---

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/gastos-fijos` | Catálogo paginado con filtros `search`, `activo`, `page`, `per_page` |
| GET | `/api/gastos-fijos/mes/{mesId}` | Lista activos con estado de pago en el mes |
| POST | `/api/gastos-fijos` | Crea un gasto fijo en el catálogo |
| PUT | `/api/gastos-fijos/{id}` | Edita un gasto fijo |
| POST | `/api/gastos-fijos/{id}/desactivar` | Desactiva un gasto fijo |
| POST | `/api/gastos-fijos/{id}/pagar` | Registra el pago mensual (crea egreso) |
| DELETE | `/api/gastos-fijos/{id}/pago/{mesId}` | Deshace el pago (elimina el egreso) |

---

### Modelo de datos involucrado

**`gastos_fijos`**

| Columna | Tipo | Notas |
|---|---|---|
| id | bigIncrements | PK |
| nombre | string | Nombre descriptivo del gasto recurrente |
| categoria | string | Default `'Gastos Fijos'` si no se especifica |
| cuenta_id | FK → cuentas nullable | Cuenta sugerida por defecto al pagar; `nullOnDelete` |
| monto_estimado | decimal(15,2) nullable | Referencia; el monto real se ingresa al pagar |
| activo | boolean default true | `false` al desactivar |
| timestamps | | |

**Modificación en `movimientos`**

| Columna | Tipo | Notas |
|---|---|---|
| gasto_fijo_id | FK → gastos_fijos nullable | Presente si el egreso fue generado por un gasto fijo; `nullOnDelete` |

---

### Decisiones de diseño

1. **Catálogo sin unicidad de nombre:** el ODS contiene items con nombres similares
   o duplicados (p. ej. distintas suscripciones); no se impone unicidad.
2. **Monto estimado opcional:** items como "Tarjeta Banco Chile" varían cada mes;
   el catálogo solo guarda una referencia; el monto real se ingresa al registrar el pago.
3. **Sin generación automática de movimientos:** el usuario decide mes a mes cuándo
   registrar el pago; no hay cron ni cierre que genere egresos automáticamente.
4. **Un pago por mes por gasto fijo:** validado en `GastoFijoService::registrarPago`
   con `findMovimientoDelMes`; evita duplicación accidental.
5. **Delegación a MovimientoService:** `registrarPago` y `deshacerPago` delegan en
   `MovimientoService` para reutilizar la validación de mes abierto y cuenta activa
   sin duplicar esa lógica.
6. **Integración transparente con SaldoService:** no requiere cambios en
   `SaldoService`; los pagos son egresos normales incluidos en `SUM(monto) WHERE tipo='egreso'`.
7. **Items del ODS sin fecha o en columna "pdte":** en la planilla, algunos gastos
   fijos aparecen sin monto (solo esperados). En la app estos corresponden a gastos
   fijos en estado `pagado: false` para ese mes; si tienen un monto esperado
   específico, el usuario puede crear un Pendiente en paralelo.
