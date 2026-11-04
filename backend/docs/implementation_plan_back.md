# Plan de Implementación Back — `auth-usuario`

> Scope: Autenticación con Sanctum + aislamiento multiusuario (`user_id` en todas las tablas de negocio) + scoping de queries por usuario autenticado.
> Fuente de verdad: `openspec/changes/auth-usuario/specs/`.
> Estándar: CSR (Controller → Service → Repository). Validación inline con `ValidacionUtils::validate()`. Errores de negocio con `$this->errors->throwFast()`. PROHIBIDO FormRequest y `throw new`.

## 1. Descripción del scope

La app pasa de "un solo usuario sin auth" a **multiusuario con Sanctum**. Cada entidad de negocio (`meses`, `cuentas`, `cuenta_mes`, `movimientos`, `pendientes`, `gastos_fijos`) gana una columna `user_id` y todas las queries de lectura/escritura se filtran por el usuario autenticado. El `user_id` se deriva SIEMPRE de `auth()->id()` (vía Service), NUNCA de parámetros del request.

## 2. Stack técnico involucrado

- Laravel 11+, PHP 8.4, SQLite (dev) / MySQL (prod).
- `laravel/sanctum` (nuevo) — tokens de acceso personal (Bearer).
- Patrón CSR existente, `app/Utils/` (ResponseUtils, ValidacionUtils, ErrorsBag, PermissionControl) sin modificar.

## 3. Decisiones de arquitectura

1. **Origen del `user_id`**: el Controller NO lo lee del body ni de la ruta. El Service lo obtiene con `auth()->id()` y lo pasa como `int $userId` a los Repositories. Esto respeta el spec (`MUST derivar user_id del token`) sin tocar la firma pública de los endpoints.
   - Nota: hoy los Controllers pasan `$request->get('permisos', [])` y los Services usan `PermissionControl`. `PermissionControl::getUserId(array)` extrae de un array, patrón que ya no aplica con Sanctum. **Decisión**: el scoping por usuario usa `auth()->id()` directo en el Service; `PermissionControl` queda intacto (no se modifica `app/Utils/`), y las llamadas `hasPermission()` existentes se conservan tal cual (el rol de permisos y el aislamiento por dueño son ejes ortogonales).
2. **Pertenencia de recurso = 404, no 403**: los métodos `find*` del Repository reciben `int $userId` y filtran por él; si el recurso existe pero es de otro usuario, `find*` retorna `null` y el Service lanza `throwFast('id', '... no encontrada', 404)`. Así nunca se revela la existencia de recursos ajenos (spec gestion-cuentas/movimientos/pendientes/cierre/gastos-fijos).
3. **Unicidad compuesta de `meses`**: `UNIQUE(anio, mes)` → `UNIQUE(anio, mes, user_id)`. Dos usuarios pueden tener el mismo mes-año abierto de forma independiente.
4. **Unicidad de nombre de cuenta**: pasa de global a `WHERE nombre = ? AND activa = 1 AND user_id = ?`. Cada usuario puede nombrar sus cuentas libremente.
5. **`bootstrapPrimerMes` user-scoped**: crea el primer mes del usuario autenticado (no un mes global). El invariante "exactamente un mes abierto" pasa a ser **por usuario**.
6. **Datos existentes**: las columnas `user_id` se agregan `nullable` + backfill a un usuario semilla, y luego se marcan `NOT NULL` (ver Fase 2). Esto evita romper los registros ya creados en dev.
7. **Bulk ops del cierre**: `bulkInsert()` usa `insert()` de Eloquent (bypassa eventos/`$fillable`), por lo que cada fila DEBE incluir `user_id` explícito. `bulkUpdateSaldoFinal()` es SQL crudo y suma `AND user_id = ?`. Estas filas se construyen en `MesService` (cierre) a partir del `user_id` autenticado.

## 4. Riesgos y dependencias

- **R1 — Migración NOT NULL sobre datos existentes**: si hay registros sin dueño al correr el paso NOT NULL, la migración falla. Mitigación: backfill obligatorio a un usuario semilla ANTES de `NOT NULL` (en la misma secuencia de migraciones). **Alto riesgo: ítem (1) datos existentes.**
- **R2 — SQLite y cambio de índice UNIQUE**: SQLite recrea la tabla al soltar un índice compuesto. Usar `$table->dropUnique(['anio','mes'])` + `$table->unique(['anio','mes','user_id'])` dentro de la misma migración; verificar en SQLite dev. **Alto riesgo: ítem (3) contrato de persistencia.**
- **R3 — Scoping incompleto**: si un solo `find*`/`get*` queda sin filtro `user_id`, se filtra data entre usuarios (fuga de seguridad). Mitigación: checklist por Repository en Fase 5 + tests del Tester que verifiquen el 404 cruzado. **Alto riesgo: ítem (2) seguridad.**
- **R4 — `bulkInsert` sin `user_id`**: al bypassar `$fillable`, olvidar `user_id` inserta filas huérfanas. Mitigación explícita en Fase 5.
- **Dependencia**: validaciones (Controller) las agrega el rol Validaciones; permisos por rol el rol Permisos; tests el Tester. Este plan solo deja los puntos de inserción.

---

## 5. Fases de implementación

### Fase 1 — Instalación de Sanctum

**Objetivo**: habilitar tokens de acceso personal.

| Paso | Acción |
|---|---|
| 1.1 | `composer require laravel/sanctum` |
| 1.2 | `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"` (publica `config/sanctum.php` + migración `create_personal_access_tokens_table`) |
| 1.3 | Agregar el trait `HasApiTokens` al modelo `User` |
| 1.4 | Registrar middleware de auth para API en `bootstrap/app.php` (Sanctum ya expone el guard `auth:sanctum`; no se requiere `EnsureFrontendRequestsAreStateful` porque es API con tokens Bearer, no SPA con cookies) |
| 1.5 | `php artisan migrate` (crea `personal_access_tokens`) |

**Archivos**:
- Modificar: `app/Models/User.php` (añadir `use Laravel\Sanctum\HasApiTokens;` y `HasApiTokens` al `use` del cuerpo de la clase).
- Nuevos (generados por publish): `config/sanctum.php`, `database/migrations/xxxx_create_personal_access_tokens_table.php`.
- Revisar: `bootstrap/app.php` (no requiere cambio para Bearer salvo confirmar que el grupo `api` existe).

---

### Fase 2 — Migraciones `user_id`

**Objetivo**: agregar `user_id` a las 6 tablas de negocio con FK a `users`, cambiando la unicidad de `meses`.

**Estrategia de datos existentes** (orden dentro de cada migración / secuencia):
1. Agregar `user_id` como `unsignedBigInteger nullable`.
2. Backfill: si existen registros, asignarlos a un usuario semilla (id 1). El usuario semilla se crea en un seeder (`DatabaseSeeder` o `UserSeeder`) ANTES de las migraciones de backfill, o el backfill se omite si la tabla está vacía en dev.
3. Agregar FK `foreign('user_id')->references('id')->on('users')->cascadeOnDelete()`.
4. Marcar `NOT NULL` (segunda migración o `change()` tras el backfill).

> Nota práctica dev (SQLite, base recreable): si el entorno permite `migrate:fresh`, las columnas se crean directamente `NOT NULL` y el seeder crea usuario + datos. El flujo nullable→backfill→NOT NULL es el camino seguro para una base con datos que no se puede recrear. Elegir uno según el estado real de la base al implementar; documentarlo en el commit.

| Migración (nueva) | Tabla | Cambios |
|---|---|---|
| `add_user_id_to_meses` | `meses` | +`user_id` FK; `dropUnique(['anio','mes'])`; `unique(['anio','mes','user_id'])`; index `user_id` |
| `add_user_id_to_cuentas` | `cuentas` | +`user_id` FK; index `user_id` |
| `add_user_id_to_cuenta_mes` | `cuenta_mes` | +`user_id` FK; index `user_id` |
| `add_user_id_to_movimientos` | `movimientos` | +`user_id` FK; index `user_id` |
| `add_user_id_to_pendientes` | `pendientes` | +`user_id` FK; index `user_id` |
| `add_user_id_to_gastos_fijos` | `gastos_fijos` | +`user_id` FK; index `user_id` |

**Modelos**: agregar `user_id` al `$fillable` de `Cuenta`, `CuentaMes`, `Mes`, `Movimiento`, `Pendiente`, `GastoFijo` (vía atributo `#[Fillable]` o propiedad, según el estilo del modelo existente).

> **Riesgo R1/R2** aplica aquí. La migración de `meses` es la más delicada por el cambio de UNIQUE en SQLite.

---

### Fase 3 — AuthController

**Objetivo**: endpoints de autenticación bajo el estándar CSR.

**Arquitectura CSR**:
- `AuthController` (nuevo): valida inline con `ValidacionUtils::validate()`, delega en `AuthService`, responde con `ResponseUtils`.
- `AuthService` (nuevo): lógica de registro/login/logout/perfil; errores con `$this->errors->throwFast()`; CERO queries directas — la persistencia del usuario va en un `UserRepository`.
- `UserRepository` (nuevo): `findUserPorEmail(string $email): ?User`, `create(array $datos): User`. Sin lógica.

> La creación del token (`$user->createToken(...)`) y `auth()->user()->currentAccessToken()->delete()` son API de Sanctum sobre el modelo autenticado; se invocan desde el Service (no es una query de datos, es la API de tokens del dominio auth). La verificación de credenciales usa `Hash::check` / `Auth::attempt` en el Service. El hash de password lo resuelve el cast `'password' => 'hashed'` del modelo `User` al crear.

| Endpoint | Método Controller | Validación inline | Respuesta |
|---|---|---|---|
| `POST /api/register` | `register` | `name` required string max:255; `email` required email unique:users; `password` required string min:8 | `{ user, token }` HTTP 201 |
| `POST /api/login` | `login` | `email` required email; `password` required string | `{ user, token }` HTTP 200; credenciales malas → `throwFast('credenciales', 'Credenciales inválidas', 401)` (mensaje genérico, no revela el campo) |
| `POST /api/logout` | `logout` | — (requiere auth) | HTTP 200; elimina token actual |
| `GET /api/me` | `me` | — (requiere auth) | `{ id, name, email, created_at }` HTTP 200 |

> El `unique:users` de email cubre el escenario "email duplicado → 422" vía `ValidacionUtils`. No se usa `$request->all()`; cada método toma `$request->only([...])`.

**Archivos**:
- Nuevos: `app/Http/Controllers/AuthController.php`, `app/Services/AuthService.php`, `app/Repositories/UserRepository.php`.

---

### Fase 4 — Proteger rutas existentes

**Objetivo**: toda ruta de negocio exige `auth:sanctum`; solo register y login son públicas.

En `routes/api.php`:
- Agregar rutas públicas: `POST /api/register`, `POST /api/login`.
- Envolver TODAS las rutas existentes (cuentas, movimientos, pendientes, gastos-fijos, dashboard, meses) + `POST /api/logout` + `GET /api/me` en:
  ```php
  Route::middleware('auth:sanctum')->group(function () { /* rutas existentes + logout + me */ });
  ```
- Mantener el orden actual de rutas (ej. `/movimientos/transferencia` antes de `/movimientos/{id}`, `/gastos-fijos/mes/{mesId}` antes de `/gastos-fijos/{id}`).
- Actualizar el comentario de cabecera del archivo (hoy dice "Sin autenticación/Sanctum — app de un solo usuario").

**Archivos**: Modificar `routes/api.php`.

---

### Fase 5 — Repositories (scoping por `user_id`)

**Objetivo**: cada query filtra por el usuario autenticado. Regla transversal:
- Métodos `get*`/`paginate*`/listado: reciben `int $userId` y añaden `->where('user_id', $userId)`.
- Métodos `find*` de un recurso concreto: reciben `int $userId` y añaden `->where('user_id', $userId)`; si no coincide, retornan `null` (el Service traduce a 404).
- Métodos `create`: el `user_id` viene en el array `$datos` (lo arma el Service).

| Repository | Cambios concretos |
|---|---|
| `CuentaRepository` | `findCuenta(int $id, int $userId)`; `findCuentaActivaPorNombre(string $nombre, int $userId, ?int $exceptId)` + `->where('user_id', $userId)`; `getCuentas(?bool $activa, int $userId)`; `getCuentasActivas(int $userId)` |
| `CuentaMesRepository` | `findPorCuentaYMes(int $cuentaId, int $mesId, int $userId)`; `getPorMes(int $mesId, int $userId)`; `deleteByMesId(int $mesId, int $userId)`; `resetSaldoFinalByMesId(int $mesId, int $userId)`; **`bulkInsert(array $rows)`**: cada fila ya debe traer `user_id` (lo arma MesService); **`bulkUpdateSaldoFinal(int $mesId, array $saldos, int $userId)`**: agregar `AND user_id = ?` al SQL y pushear `$userId` en `$params` |
| `MesRepository` | `findMesAbierto(int $userId)`; `findMes(int $id, int $userId)`; `getMeses(int $userId)`; y cualquier método de cierre/reapertura con `user_id`; conteo para `bootstrapPrimerMes` con `user_id` |
| `MovimientoRepository` | `find*`/`get*`/`paginate*` reciben y filtran `int $userId`; `create` con `user_id` en `$datos` |
| `PendienteRepository` | ídem: `find*`/`get*` con `int $userId`; incluye `getPendientesAbiertosPorCuentaYMes(int $cuentaId, int $mesId, int $userId)` |
| `GastoFijoRepository` | ídem: `find*`/`get*` con `int $userId`; `create` con `user_id` |
| `UserRepository` (Fase 3) | `findUserPorEmail`, `create` — sin scoping (son del dominio auth) |

> **R4**: en `bulkUpdateSaldoFinal`, el SQL pasa a `UPDATE cuenta_mes SET saldo_final = {CASE} WHERE mes_id = ? AND cuenta_id IN (...) AND user_id = ?`, con `$userId` añadido al final de `$params`.

**Archivos**: Modificar los 6 repositories de negocio (+ `UserRepository` nuevo en Fase 3).

---

### Fase 6 — Services (derivar `user_id` y propagarlo)

**Objetivo**: cada Service obtiene `auth()->id()` y lo pasa a sus Repositories; nunca lo lee del request.

Regla transversal por Service:
```php
$userId = auth()->id();           // único origen del user_id
$cuenta = $this->cuentaRepo->findCuenta($id, $userId);
if ($cuenta === null) {
    $this->errors->throwFast('id', 'Cuenta no encontrada', 404);   // 404 cruzado
}
```
- En `create*`: añadir `'user_id' => $userId` al array que se pasa al Repository.
- CERO queries directas (se mantiene la regla); `DB::transaction()` en Services se conserva (es orquestación, no query).
- Las llamadas `$this->permissions->hasPermission(...)` existentes se conservan sin cambios.

| Service | Cambios concretos |
|---|---|
| `CuentaService` | `$userId = auth()->id()` en cada método; `findCuenta($id, $userId)`; unicidad con `findCuentaActivaPorNombre($nombre, $userId, $exceptId)`; `create([... , 'user_id' => $userId])` para cuenta y cuenta_mes; `bootstrapPrimerMes($userId)`; `findMesAbierto($userId)` |
| `MesService` | `bootstrapPrimerMes(int $userId)`: crea el primer mes del usuario (conteo y create con `user_id`); cierre/reapertura reciben `$userId = auth()->id()`, validan pertenencia del mes (404 si ajeno); al construir filas de `bulkInsert` del mes siguiente, incluir `'user_id' => $userId` en cada fila; `bulkUpdateSaldoFinal($mesId, $saldos, $userId)` |
| `MovimientoService` | `$userId = auth()->id()`; find/get/create con `user_id`; **transferencia**: ambas cuentas (origen y destino) se buscan con `findCuenta($id, $userId)`; si alguna es `null` → 404 (spec movimientos) |
| `PendienteService` | `$userId = auth()->id()`; find/get/create con `user_id`; concretar/anular validan pertenencia (404); el movimiento generado al concretar lleva `user_id` |
| `GastoFijoService` | `$userId = auth()->id()`; find/get/create con `user_id`; editar/desactivar/pagar/deshacer-pago validan pertenencia (404) |
| `SaldoService` (dashboard) | `$userId = auth()->id()`; todas las lecturas (cuentas, meses, cuenta_mes, pendientes) filtradas por `user_id` |

**Archivos**: Modificar los 6 services de negocio.

---

### Fase 7 — Relaciones en el modelo `User`

**Objetivo**: declarar las relaciones inversas (soporte, no obligatorias para el scoping, que ya es por `user_id` explícito).

`User` `hasMany`: `Cuenta`, `Mes`, `Movimiento`, `Pendiente`, `GastoFijo`. (CuentaMes se accede vía Cuenta/Mes; opcional.)

**Archivos**: Modificar `app/Models/User.php`.

---

## 6. Rutas, endpoints y contratos de API

### Nuevos (públicos)
| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| POST | `/api/register` | `name`, `email`, `password` | `{ user, token }` 201 |
| POST | `/api/login` | `email`, `password` | `{ user, token }` 200 / 401 genérico |

### Nuevos (protegidos `auth:sanctum`)
| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/logout` | 200 |
| GET | `/api/me` | `{ id, name, email, created_at }` 200 |

### Existentes — SIN cambio de contrato, ahora protegidos por `auth:sanctum`
Todos requieren header `Authorization: Bearer <token>` y devuelven 401 sin token válido. El `user_id` se deriva del token (no cambia el body ni la URL):
`GET /api/cuentas`, `GET /api/cuentas/{id}`, `POST /api/cuentas`, `PUT /api/cuentas/{id}`, `PUT /api/cuentas/{id}/saldo-inicial`, `POST /api/cuentas/{id}/desactivar`, `POST /api/movimientos/transferencia`, `GET /api/movimientos`, `POST /api/movimientos`, `PUT /api/movimientos/{id}`, `DELETE /api/movimientos/{id}`, `GET /api/pendientes`, `POST /api/pendientes`, `PUT /api/pendientes/{id}`, `POST /api/pendientes/{id}/concretar`, `POST /api/pendientes/{id}/anular`, `GET /api/gastos-fijos`, `GET /api/gastos-fijos/mes/{mesId}`, `POST /api/gastos-fijos`, `PUT /api/gastos-fijos/{id}`, `POST /api/gastos-fijos/{id}/desactivar`, `POST /api/gastos-fijos/{id}/pagar`, `DELETE /api/gastos-fijos/{id}/pago/{mesId}`, `GET /api/dashboard`, `GET /api/meses`, `POST /api/meses/{id}/cerrar`, `POST /api/meses/{id}/reabrir`.

> Acceso a recurso ajeno (otro `user_id`) → **HTTP 404** en todos los `{id}`.

---

## 7. Tareas que NO ejecuta el Arquitecto Back (las delega el Lead)

- **Validaciones** (Controller): refinamiento de reglas inline en `AuthController` y verificación de las existentes — rol Validaciones.
- **Permisos**: política de roles sobre los nuevos endpoints — rol Permisos.
- **Tests** (Pest): registro/login/logout/me; 401 sin token; 404 cruzado entre usuarios en cada módulo; unicidad `(anio,mes,user_id)`; nombre de cuenta único por usuario; transferencia entre cuentas de distinto dueño → 404 — rol Tester.
- **Documentación**: rol Documentador.

---

## 8. Autovalidación CSR (verificada)

- [x] Services: CERO queries directas — todo scoping vive en los Repositories (`->where('user_id', $userId)`); `auth()->id()` y `DB::transaction()` son orquestación, no queries de datos.
- [x] Services: errores con `$this->errors->throwFast($campo, $mensaje, $codigoHTTP)` — sin `throw new` (404 cruzado, 401 login, 422 unicidad).
- [x] Controllers: validación con `ValidacionUtils::validate()` inline — sin FormRequest (incluye `AuthController`).
- [x] No se pasa `$request->all()` a `create()`/`update()` — siempre `$request->only([...])`; el `user_id` lo inyecta el Service, no viene del body.
- [x] Sin valores hardcodeados — reglas y nombres derivados del spec; el usuario semilla es un dato de seed, no un literal de dominio.
