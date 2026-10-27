<?php

namespace App\Services;

use App\Repositories\MesRepository;
use App\Repositories\CuentaMesRepository;
use App\Repositories\CuentaRepository;
use App\Repositories\PendienteRepository;
use App\Repositories\MovimientoRepository;
use App\Utils\ErrorsBag;
use App\Utils\PermissionControl;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para la gestión del ciclo de meses.
 *
 * Responsabilidades: bootstrap del primer mes, cierre atómico, reapertura atómica.
 * El invariante de un solo mes abierto (siempre el último) se preserva en todo momento.
 *
 * @package App\Services
 */
class MesService
{
    /**
     * @param MesRepository        $mesRepo
     * @param CuentaMesRepository  $cuentaMesRepo
     * @param CuentaRepository     $cuentaRepo
     * @param PendienteRepository  $pendienteRepo
     * @param MovimientoRepository $movimientoRepo
     * @param SaldoService         $saldoService
     * @param ErrorsBag            $errors
     * @param PermissionControl    $permissions
     */
    public function __construct(
        protected MesRepository $mesRepo,
        protected CuentaMesRepository $cuentaMesRepo,
        protected CuentaRepository $cuentaRepo,
        protected PendienteRepository $pendienteRepo,
        protected MovimientoRepository $movimientoRepo,
        protected SaldoService $saldoService,
        protected ErrorsBag $errors,
        protected PermissionControl $permissions
    ) {}

    /**
     * Lista todos los meses ordenados cronológicamente.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarMeses(): array
    {
        return $this->mesRepo->getMeses()->toArray();
    }

    /**
     * Bootstrapea el primer mes si no existe ninguno.
     *
     * Crea el mes calendario actual con estado 'abierto'.
     * Si ya existe algún mes, no hace nada.
     *
     * @return void
     */
    public function bootstrapPrimerMes(): void
    {
        $ultimo = $this->mesRepo->findUltimoMes();
        if ($ultimo !== null) {
            return;
        }

        $hoy = now();
        $this->mesRepo->create([
            'anio'   => (int) $hoy->format('Y'),
            'mes'    => (int) $hoy->format('n'),
            'estado' => 'abierto',
        ]);
    }

    /**
     * Cierre atómico del mes: congela saldos, crea el mes siguiente, arrastra pendientes.
     *
     * @param int   $mesId
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function cerrar(int $mesId, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $mesAbierto = $this->mesRepo->findMesAbierto();

        if ($mesAbierto === null || $mesAbierto->id !== $mesId) {
            $this->errors->throwFast(
                'mes',
                'Solo se puede cerrar el mes actualmente abierto',
                409
            );
        }

        return DB::transaction(function () use ($mesAbierto) {
            $mes = $mesAbierto;
            // 1. Calcular y congelar saldos finales (bulk UPDATE — una sola query)
            $saldosFinales = $this->saldoService->calcularSaldosFinalesCierre($mes->id);
            $this->cuentaMesRepo->bulkUpdateSaldoFinal($mes->id, $saldosFinales);

            // 2. Calcular el mes siguiente
            $anioSiguiente = $mes->mes === 12 ? $mes->anio + 1 : $mes->anio;
            $mesSiguiente  = $mes->mes === 12 ? 1 : $mes->mes + 1;

            // 3. Usar el mes siguiente si ya existe, o crearlo
            $nuevoMes = $this->mesRepo->findMesPorAnioMes($anioSiguiente, $mesSiguiente);
            if ($nuevoMes === null) {
                $nuevoMes = $this->mesRepo->create([
                    'anio'   => $anioSiguiente,
                    'mes'    => $mesSiguiente,
                    'estado' => 'abierto',
                ]);
            } else {
                $this->mesRepo->update($nuevoMes, ['estado' => 'abierto']);
            }

            // 4. Crear cuenta_mes del mes nuevo solo para cuentas activas (omitir si ya existe)
            $cuentasActivas = $this->cuentaRepo->getCuentasActivas();
            $ahora = now()->toDateTimeString();
            $rows  = [];

            foreach ($cuentasActivas as $cuenta) {
                if ($this->cuentaMesRepo->findPorCuentaYMes($cuenta->id, $nuevoMes->id) !== null) {
                    continue;
                }
                $rows[] = [
                    'cuenta_id'     => $cuenta->id,
                    'mes_id'        => $nuevoMes->id,
                    'saldo_inicial' => $saldosFinales[$cuenta->id] ?? 0.0,
                    'saldo_final'   => null,
                    'created_at'    => $ahora,
                    'updated_at'    => $ahora,
                ];
            }

            if (!empty($rows)) {
                $this->cuentaMesRepo->bulkInsert($rows);
            }

            // 5. Clonar pendientes en estado 'pendiente' al mes nuevo (bulk INSERT — una sola query)
            $pendientesAbiertas = $this->pendienteRepo->getPorMes($mes->id, null, 'pendiente');
            $ahora = now()->toDateTimeString();
            $rowsPendientes = [];

            foreach ($pendientesAbiertas as $pendiente) {
                $rowsPendientes[] = [
                    'cuenta_id'          => $pendiente->cuenta_id,
                    'mes_id'             => $nuevoMes->id,
                    'tipo'               => $pendiente->tipo,
                    'monto'              => $pendiente->monto,
                    'descripcion'        => $pendiente->descripcion,
                    'fecha_estimada'     => $pendiente->fecha_estimada instanceof \Carbon\Carbon
                        ? $pendiente->fecha_estimada->format('Y-m-d')
                        : (string) $pendiente->fecha_estimada,
                    'estado'             => 'pendiente',
                    'movimiento_id'      => null,
                    'pendiente_origen_id'=> $pendiente->id,
                    'created_at'         => $ahora,
                    'updated_at'         => $ahora,
                ];
            }

            $this->pendienteRepo->bulkInsert($rowsPendientes);

            // 6. Marcar mes como cerrado
            $this->mesRepo->update($mes, [
                'estado'       => 'cerrado',
                'fecha_cierre' => now(),
            ]);

            return $mes->fresh()->toArray();
        });
    }

    /**
     * Reapertura atómica del último mes cerrado.
     *
     * Condiciones: el mes a reabrir es el último cerrado; su mes siguiente
     * está abierto, sin movimientos nuevos y sin pendientes nuevos
     * (solo clones identificados por pendiente_origen_id).
     *
     * @param int   $mesId
     * @param array<string, mixed> $requestPermisos
     * @return array<string, mixed>
     */
    public function reabrir(int $mesId, array $requestPermisos): array
    {
        $this->permissions->hasPermission($requestPermisos, PermissionControl::ADMIN);

        $mesAReabrir = $this->mesRepo->findMes($mesId);

        if ($mesAReabrir === null || $mesAReabrir->estado !== 'cerrado') {
            $this->errors->throwFast('mes', 'El mes indicado no está cerrado', 409);
        }

        // Verificar que sea el último cerrado (el siguiente en la lista es el abierto)
        $ultimoMes = $this->mesRepo->findUltimoMes();
        if ($ultimoMes === null || $ultimoMes->estado !== 'abierto') {
            $this->errors->throwFast('mes', 'No existe un mes abierto siguiente para revertir', 409);
        }

        // El mes siguiente debe ser justo el último mes de la secuencia (orden cronológico)
        $todos = $this->mesRepo->getMeses(); // ordenado por anio, mes ASC
        $mesAnteriorDelUltimo = $todos->filter(
            fn($m) => $m->anio < $ultimoMes->anio || ($m->anio === $ultimoMes->anio && $m->mes < $ultimoMes->mes)
        )->last();
        if ($mesAnteriorDelUltimo === null || $mesAnteriorDelUltimo->id !== $mesId) {
            $this->errors->throwFast(
                'mes',
                'Solo se puede reabrir el mes anterior al mes abierto actual',
                409
            );
        }

        $mesSiguiente = $ultimoMes;

        // Validar que el mes siguiente no tenga movimientos nuevos
        if ($this->movimientoRepo->countPorMes($mesSiguiente->id) > 0) {
            $this->errors->throwFast(
                'mes',
                'El mes siguiente tiene movimientos registrados; no se puede reabrir',
                409
            );
        }

        // Validar que el mes siguiente no tenga pendientes nuevos (sin pendiente_origen_id)
        if ($this->pendienteRepo->countPendientesNuevosPorMes($mesSiguiente->id) > 0) {
            $this->errors->throwFast(
                'mes',
                'El mes siguiente tiene pendientes nuevos; no se puede reabrir',
                409
            );
        }

        return DB::transaction(function () use ($mesAReabrir, $mesSiguiente) {
            // 1. Borrar clones del mes siguiente (DELETE con subquery — una sola query)
            $this->pendienteRepo->deleteByOrigenMesId($mesAReabrir->id);

            // 2. Borrar cuenta_mes del mes siguiente
            $this->cuentaMesRepo->deleteByMesId($mesSiguiente->id);

            // 3. Borrar el mes siguiente
            $this->mesRepo->delete($mesSiguiente);

            // 4. Descongelar saldo_final (bulk UPDATE — una sola query)
            $this->cuentaMesRepo->resetSaldoFinalByMesId($mesAReabrir->id);

            $this->mesRepo->update($mesAReabrir, [
                'estado'       => 'abierto',
                'fecha_cierre' => null,
            ]);

            return $mesAReabrir->fresh()->toArray();
        });
    }
}
