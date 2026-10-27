<?php

namespace App\Services;

use App\Repositories\CuentaMesRepository;
use App\Repositories\MovimientoRepository;
use App\Repositories\PendienteRepository;
use App\Repositories\MesRepository;
use App\Utils\ErrorsBag;

/**
 * Servicio de cálculo de saldos.
 *
 * Fórmulas:
 *   temporal  = saldo_inicial + Σ ingresos − Σ egresos
 *   potencial = temporal + Σ por_recibir(pendiente) − Σ por_pagar(pendiente)
 *   final     = temporal congelado al cierre (persistido en cuenta_mes.saldo_final)
 *
 * Los agregados se resuelven con queries SUM GROUP BY (sin N+1).
 *
 * @package App\Services
 */
class SaldoService
{
    /**
     * @param CuentaMesRepository  $cuentaMesRepo
     * @param MovimientoRepository $movimientoRepo
     * @param PendienteRepository  $pendienteRepo
     * @param MesRepository        $mesRepo
     * @param ErrorsBag            $errors
     */
    public function __construct(
        protected CuentaMesRepository $cuentaMesRepo,
        protected MovimientoRepository $movimientoRepo,
        protected PendienteRepository $pendienteRepo,
        protected MesRepository $mesRepo,
        protected ErrorsBag $errors
    ) {}

    /**
     * Calcula los saldos completos de un mes por cuenta y el consolidado.
     *
     * Devuelve null para el campo saldo_final si el mes está abierto.
     *
     * @param int $mesId
     * @return array{
     *   consolidado: array<string, mixed>,
     *   cuentas: array<int, array<string, mixed>>
     * }
     */
    public function calcularSaldosMes(int $mesId): array
    {
        $cuentasMes = $this->cuentaMesRepo->getPorMes($mesId);

        if ($cuentasMes->isEmpty()) {
            return [
                'consolidado' => $this->consolidadoVacio(),
                'cuentas'     => [],
            ];
        }

        // Agregados de movimientos por cuenta (una sola query)
        $totalesMovimientos = $this->movimientoRepo->getTotalesPorMes($mesId)
            ->keyBy('cuenta_id');

        // Agregados de pendientes por cuenta (una sola query)
        $totalesPendientes = $this->pendienteRepo->getTotalesPendientesPorMes($mesId)
            ->keyBy('cuenta_id');

        $resultadosCuentas = [];
        $consolidado = $this->consolidadoVacio();

        foreach ($cuentasMes as $cm) {
            $cuentaId     = $cm->cuenta_id;
            $saldoInicial = (float) $cm->saldo_inicial;
            $saldoFinal   = $cm->saldo_final !== null ? (float) $cm->saldo_final : null;

            $movs         = $totalesMovimientos->get($cuentaId);
            $ingresos     = $movs ? (float) $movs->total_ingresos : 0.0;
            $egresos      = $movs ? (float) $movs->total_egresos  : 0.0;

            $pends        = $totalesPendientes->get($cuentaId);
            $porPagar     = $pends ? (float) $pends->total_por_pagar     : 0.0;
            $porRecibir   = $pends ? (float) $pends->total_por_recibir   : 0.0;

            $temporal     = $saldoInicial + $ingresos - $egresos;
            $potencial    = $temporal + $porRecibir - $porPagar;

            $resultadosCuentas[] = [
                'cuenta_id'      => $cuentaId,
                'cuenta_nombre'  => $cm->cuenta->nombre ?? null,
                'saldo_inicial'  => $saldoInicial,
                'ingresos'       => $ingresos,
                'egresos'        => $egresos,
                'saldo_temporal' => $temporal,
                'por_pagar'      => $porPagar,
                'por_recibir'    => $porRecibir,
                'saldo_potencial'=> $potencial,
                'saldo_final'    => $saldoFinal,
            ];

            // Acumular consolidado
            $consolidado['saldo_inicial']   += $saldoInicial;
            $consolidado['ingresos']        += $ingresos;
            $consolidado['egresos']         += $egresos;
            $consolidado['saldo_temporal']  += $temporal;
            $consolidado['por_pagar']       += $porPagar;
            $consolidado['por_recibir']     += $porRecibir;
            $consolidado['saldo_potencial'] += $potencial;
            if ($saldoFinal !== null) {
                $consolidado['saldo_final'] = ($consolidado['saldo_final'] ?? 0.0) + $saldoFinal;
            }
        }

        return [
            'consolidado' => $consolidado,
            'cuentas'     => $resultadosCuentas,
        ];
    }

    /**
     * Retorna los datos del dashboard para un mes calendario (anio + mes).
     *
     * Si el mes no existe devuelve ['mes' => null] para que el frontend
     * ofrezca el CTA de cierre del mes anterior.
     * Si el mes está abierto, no expone saldo_final en el consolidado.
     *
     * @param int $anio
     * @param int $mes
     * @return array{mes: array<string, mixed>|null, consolidado?: array<string, mixed>, cuentas?: array<int, array<string, mixed>>}
     */
    public function getDashboard(int $anio, int $mes): array
    {
        $mesModel = $this->mesRepo->findMesPorAnioMes($anio, $mes);

        if ($mesModel === null) {
            return ['mes' => null];
        }

        $saldos      = $this->calcularSaldosMes($mesModel->id);
        $consolidado = $saldos['consolidado'];

        // El saldo_final solo aplica para meses cerrados
        if ($mesModel->estado !== 'cerrado') {
            unset($consolidado['saldo_final']);
        }

        return [
            'mes'         => $mesModel->toArray(),
            'consolidado' => $consolidado,
            'cuentas'     => $saldos['cuentas'],
        ];
    }

    /**
     * Retorna el saldo temporal de una cuenta específica en un mes.
     *
     * @param int $cuentaId
     * @param int $mesId
     * @return float
     */
    public function calcularTemporalCuenta(int $cuentaId, int $mesId): float
    {
        $cm = $this->cuentaMesRepo->findPorCuentaYMes($cuentaId, $mesId);
        if ($cm === null) {
            return 0.0;
        }

        $totales  = $this->movimientoRepo->getTotalesPorMes($mesId)->keyBy('cuenta_id');
        $movs     = $totales->get($cuentaId);
        $ingresos = $movs ? (float) $movs->total_ingresos : 0.0;
        $egresos  = $movs ? (float) $movs->total_egresos  : 0.0;

        return (float) $cm->saldo_inicial + $ingresos - $egresos;
    }

    /**
     * Retorna un array de saldo_final por cuenta para el cierre.
     *
     * @param int $mesId
     * @return array<int, float>  [cuenta_id => saldo_temporal]
     */
    public function calcularSaldosFinalesCierre(int $mesId): array
    {
        $cuentasMes = $this->cuentaMesRepo->getPorMes($mesId);
        $totales    = $this->movimientoRepo->getTotalesPorMes($mesId)->keyBy('cuenta_id');

        $resultado = [];
        foreach ($cuentasMes as $cm) {
            $cuentaId = $cm->cuenta_id;
            $movs     = $totales->get($cuentaId);
            $ingresos = $movs ? (float) $movs->total_ingresos : 0.0;
            $egresos  = $movs ? (float) $movs->total_egresos  : 0.0;

            $resultado[$cuentaId] = (float) $cm->saldo_inicial + $ingresos - $egresos;
        }

        return $resultado;
    }

    /**
     * Retorna un consolidado vacío con todos los campos en cero.
     *
     * @return array<string, float|null>
     */
    private function consolidadoVacio(): array
    {
        return [
            'saldo_inicial'   => 0.0,
            'ingresos'        => 0.0,
            'egresos'         => 0.0,
            'saldo_temporal'  => 0.0,
            'por_pagar'       => 0.0,
            'por_recibir'     => 0.0,
            'saldo_potencial' => 0.0,
            'saldo_final'     => null,
        ];
    }
}
