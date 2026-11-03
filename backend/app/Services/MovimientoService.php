<?php

namespace App\Services;

use App\Repositories\MovimientoRepository;
use App\Repositories\MesRepository;
use App\Repositories\CuentaRepository;
use App\Repositories\PendienteRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para la gestión de movimientos (ingresos/egresos y transferencias).
 *
 * Reglas de negocio:
 * - mes_id se deriva de la fecha del movimiento (no lo envía el cliente).
 * - Solo escrituras en meses abiertos; meses cerrados lanzan throwFast 409.
 * - Transferencias: par egreso/ingreso vinculado en DB::transaction().
 * - Editar monto de movimiento vinculado a transferencia está bloqueado.
 * - Eliminar movimiento de transferencia elimina también su par.
 * - Eliminar movimiento generado por un pendiente devuelve ese pendiente a estado 'pendiente'.
 *
 * @package App\Services
 */
class MovimientoService
{
    /**
     * @param MovimientoRepository $movimientoRepo
     * @param MesRepository        $mesRepo
     * @param CuentaRepository     $cuentaRepo
     * @param PendienteRepository  $pendienteRepo
     * @param ErrorsBag            $errors
     * @param PermissionControl    $permissions
     */
    public function __construct(
        protected MovimientoRepository $movimientoRepo,
        protected MesRepository $mesRepo,
        protected CuentaRepository $cuentaRepo,
        protected PendienteRepository $pendienteRepo,
        protected ErrorsBag $errors,
        protected PermissionControl $permissions
    ) {}

    /**
     * Lista movimientos paginados con filtros.
     *
     * @param array<string, mixed> $params  mes_id, cuenta_id?, tipo?, categoria?, search?, page?, per_page?
     * @return array{data: array<int, mixed>, meta: array<string, int>}
     */
    public function listarMovimientos(array $params): array
    {
        return $this->movimientoRepo->paginateMovimientos($params);
    }

    /**
     * Crea un movimiento en el mes derivado de la fecha.
     *
     * @param array<string, mixed> $datos  cuenta_id, tipo, monto, fecha, descripcion, categoria
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function crear(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $mesId = $this->derivarMesId($datos['fecha']);

        $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id']);
        if ($cuenta === null || !$cuenta->activa) {
            $this->errors->throwFast('cuenta_id', 'La cuenta no existe o está inactiva', 422);
        }

        $movimiento = $this->movimientoRepo->create([
            'cuenta_id'   => $datos['cuenta_id'],
            'mes_id'      => $mesId,
            'tipo'        => $datos['tipo'],
            'monto'       => $datos['monto'],
            'fecha'       => $datos['fecha'],
            'descripcion' => $datos['descripcion'],
            'categoria'   => $datos['categoria'],
        ]);

        return $movimiento->toArray();
    }

    /**
     * Edita un movimiento existente.
     *
     * No permite editar el monto si el movimiento está vinculado a transferencia.
     *
     * @param int   $id
     * @param array<string, mixed> $datos
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function editar(int $id, array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $movimiento = $this->movimientoRepo->findMovimiento($id);
        if ($movimiento === null) {
            $this->errors->throwFast('id', 'Movimiento no encontrado', 404);
        }

        $this->validarMesAbierto($movimiento->mes_id);

        if ($movimiento->movimiento_relacionado_id !== null && isset($datos['monto'])) {
            $this->errors->throwFast(
                'monto',
                'No se puede editar el monto de un movimiento vinculado a transferencia; elimine el par y recree la transferencia',
                422
            );
        }

        $fechaNueva = $datos['fecha'] ?? $movimiento->fecha->format('Y-m-d');
        $mesId      = $this->derivarMesId($fechaNueva);

        $cuenta = $this->cuentaRepo->findCuenta($datos['cuenta_id'] ?? $movimiento->cuenta_id);
        if ($cuenta === null || !$cuenta->activa) {
            $this->errors->throwFast('cuenta_id', 'La cuenta no existe o está inactiva', 422);
        }

        $this->movimientoRepo->update($movimiento, [
            'cuenta_id'   => $datos['cuenta_id']   ?? $movimiento->cuenta_id,
            'mes_id'      => $mesId,
            'tipo'        => $datos['tipo']         ?? $movimiento->tipo,
            'monto'       => $datos['monto']        ?? $movimiento->monto,
            'fecha'       => $fechaNueva,
            'descripcion' => $datos['descripcion']  ?? $movimiento->descripcion,
            'categoria'   => $datos['categoria']    ?? $movimiento->categoria,
        ]);

        return $movimiento->fresh()->toArray();
    }

    /**
     * Elimina un movimiento.
     *
     * Si es de transferencia, elimina su par también (transacción).
     * Si fue generado por un pendiente, devuelve ese pendiente a estado 'pendiente'.
     *
     * @param int   $id
     * @param array<string, mixed> $requestPermisos
     * @return void
     */
    public function eliminar(int $id, array $requestPermisos): void
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $movimiento = $this->movimientoRepo->findMovimiento($id);
        if ($movimiento === null) {
            $this->errors->throwFast('id', 'Movimiento no encontrado', 404);
        }

        $this->validarMesAbierto($movimiento->mes_id);

        DB::transaction(function () use ($movimiento) {
            // Desvincular pendiente si aplica
            if ($movimiento->pendiente_id !== null) {
                $pendiente = $this->pendienteRepo->findPendiente($movimiento->pendiente_id);
                if ($pendiente !== null) {
                    $this->pendienteRepo->update($pendiente, [
                        'estado'       => 'pendiente',
                        'movimiento_id'=> null,
                    ]);
                }
            }

            // Eliminar el par de transferencia si aplica
            if ($movimiento->movimiento_relacionado_id !== null) {
                $par = $this->movimientoRepo->findMovimiento($movimiento->movimiento_relacionado_id);
                if ($par !== null) {
                    $this->movimientoRepo->delete($par);
                }
            }

            $this->movimientoRepo->delete($movimiento);
        });
    }

    /**
     * Crea una transferencia entre dos cuentas (par egreso/ingreso vinculado).
     *
     * @param array<string, mixed> $datos  cuenta_origen_id, cuenta_destino_id, monto, fecha, descripcion
     * @param array<string, mixed> $requestPermisos
     * @return array{egreso: array<string, mixed>, ingreso: array<string, mixed>}
     */
    public function transferir(array $datos, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $cuentaOrigen  = $this->cuentaRepo->findCuenta($datos['cuenta_origen_id']);
        $cuentaDestino = $this->cuentaRepo->findCuenta($datos['cuenta_destino_id']);

        if ($cuentaOrigen === null || !$cuentaOrigen->activa) {
            $this->errors->throwFast('cuenta_origen_id', 'La cuenta origen no existe o está inactiva', 422);
        }

        if ($cuentaDestino === null || !$cuentaDestino->activa) {
            $this->errors->throwFast('cuenta_destino_id', 'La cuenta destino no existe o está inactiva', 422);
        }

        if ($datos['cuenta_origen_id'] === $datos['cuenta_destino_id']) {
            $this->errors->throwFast('cuenta_destino_id', 'La cuenta origen y destino deben ser distintas', 422);
        }

        $mesId = $this->derivarMesId($datos['fecha']);

        return DB::transaction(function () use ($datos, $mesId, $cuentaOrigen, $cuentaDestino) {
            $descripcion = $datos['descripcion'] ?? 'Transferencia';
            $categoria   = 'transferencia';

            $egreso = $this->movimientoRepo->create([
                'cuenta_id'   => $cuentaOrigen->id,
                'mes_id'      => $mesId,
                'tipo'        => 'egreso',
                'monto'       => $datos['monto'],
                'fecha'       => $datos['fecha'],
                'descripcion' => $descripcion,
                'categoria'   => $categoria,
            ]);

            $ingreso = $this->movimientoRepo->create([
                'cuenta_id'                => $cuentaDestino->id,
                'mes_id'                   => $mesId,
                'tipo'                     => 'ingreso',
                'monto'                    => $datos['monto'],
                'fecha'                    => $datos['fecha'],
                'descripcion'              => $descripcion,
                'categoria'               => $categoria,
                'movimiento_relacionado_id'=> $egreso->id,
            ]);

            $this->movimientoRepo->update($egreso, [
                'movimiento_relacionado_id' => $ingreso->id,
            ]);

            return [
                'egreso'  => $egreso->fresh()->toArray(),
                'ingreso' => $ingreso->fresh()->toArray(),
            ];
        });
    }

    /**
     * Deriva el mes_id desde una fecha; valida que el mes exista y esté abierto.
     *
     * @param string $fecha  Formato Y-m-d
     * @return int
     */
    private function derivarMesId(string $fecha): int
    {
        $dt   = \Carbon\Carbon::parse($fecha);
        $mes  = $this->mesRepo->findMesPorAnioMes((int) $dt->format('Y'), (int) $dt->format('n'));

        if ($mes === null) {
            $this->errors->throwFast('fecha', 'El mes de la fecha indicada no está inicializado', 422);
        }

        if ($mes->estado === 'cerrado') {
            $this->errors->throwFast('fecha', 'El mes de la fecha indicada está cerrado', 409);
        }

        return $mes->id;
    }

    /**
     * Valida que un mes esté abierto.
     *
     * @param int $mesId
     * @return void
     */
    private function validarMesAbierto(int $mesId): void
    {
        $mes = $this->mesRepo->findMes($mesId);

        if ($mes === null || $mes->estado === 'cerrado') {
            $this->errors->throwFast('mes', 'El mes está cerrado y no permite modificaciones', 409);
        }
    }
}
