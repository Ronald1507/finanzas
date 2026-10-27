<?php

namespace App\Repositories;

use App\Models\CuentaMes;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Repositorio para la entidad CuentaMes.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class CuentaMesRepository
{
    /**
     * @param CuentaMes $model
     */
    public function __construct(
        protected CuentaMes $model
    ) {}

    /**
     * Busca el registro de saldo de una cuenta en un mes específico.
     *
     * @param int $cuentaId
     * @param int $mesId
     * @return CuentaMes|null
     */
    public function findPorCuentaYMes(int $cuentaId, int $mesId): ?CuentaMes
    {
        return $this->model->newQuery()
            ->where('cuenta_id', $cuentaId)
            ->where('mes_id', $mesId)
            ->first();
    }

    /**
     * Retorna todos los registros de saldo de un mes, con cuenta cargada.
     *
     * @param int $mesId
     * @return Collection<int, CuentaMes>
     */
    public function getPorMes(int $mesId): Collection
    {
        return $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->with('cuenta')
            ->get();
    }

    /**
     * Crea un registro de saldo para una cuenta en un mes.
     *
     * @param array<string, mixed> $datos
     * @return CuentaMes
     */
    public function create(array $datos): CuentaMes
    {
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza el registro de saldo.
     *
     * @param CuentaMes $cuentaMes
     * @param array<string, mixed> $datos
     * @return CuentaMes
     */
    public function update(CuentaMes $cuentaMes, array $datos): CuentaMes
    {
        $cuentaMes->update($datos);
        return $cuentaMes;
    }

    /**
     * Elimina el registro de saldo.
     *
     * @param CuentaMes $cuentaMes
     * @return void
     */
    public function delete(CuentaMes $cuentaMes): void
    {
        $cuentaMes->delete();
    }

    /**
     * Inserta múltiples registros en bloque (para el cierre mensual).
     *
     * @param array<int, array<string, mixed>> $rows
     * @return void
     */
    public function bulkInsert(array $rows): void
    {
        $this->model->newQuery()->insert($rows);
    }

    /**
     * Elimina todos los registros de saldo de un mes.
     *
     * @param int $mesId
     * @return void
     */
    public function deleteByMesId(int $mesId): void
    {
        $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->delete();
    }

    /**
     * Actualiza saldo_final de múltiples cuentas en un mes con un único UPDATE CASE.
     *
     * Evita N queries individuales durante el cierre mensual.
     *
     * @param int                  $mesId
     * @param array<int, float>    $saldos  [cuenta_id => saldo_final]
     * @return void
     */
    public function bulkUpdateSaldoFinal(int $mesId, array $saldos): void
    {
        if (empty($saldos)) {
            return;
        }

        $cases   = [];
        $params  = [];

        foreach ($saldos as $cuentaId => $saldoFinal) {
            $cases[]  = 'WHEN ? THEN ?';
            $params[] = (int) $cuentaId;
            $params[] = (float) $saldoFinal;
        }

        $params[] = $mesId;

        foreach (array_keys($saldos) as $cuentaId) {
            $params[] = (int) $cuentaId;
        }

        $placeholders = implode(',', array_fill(0, count($saldos), '?'));
        $caseExpr     = 'CASE cuenta_id ' . implode(' ', $cases) . ' END';

        DB::update(
            "UPDATE cuenta_mes SET saldo_final = {$caseExpr} WHERE mes_id = ? AND cuenta_id IN ({$placeholders})",
            $params
        );
    }

    /**
     * Resetea saldo_final a null en todos los registros de un mes (reapertura).
     *
     * Un único UPDATE en lugar de N UPDATEs individuales.
     *
     * @param int $mesId
     * @return void
     */
    public function resetSaldoFinalByMesId(int $mesId): void
    {
        $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->update(['saldo_final' => null]);
    }
}
