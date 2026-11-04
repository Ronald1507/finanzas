<?php

namespace App\Services;

use App\Repositories\MesRepository;
use App\Utils\ErrorsBag;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para los endpoints de reportería.
 *
 * @package App\Services
 */
class ReporteService
{
    public function __construct(
        protected MesRepository $mesRepo,
        protected ErrorsBag     $errors
    ) {}

    /**
     * Resumen de un mes: totales y distribución de egresos por categoría.
     *
     * @param int $mesId
     * @return array<string, mixed>
     */
    public function resumenMensual(int $mesId): array
    {
        $mes = $this->mesRepo->findMes($mesId);
        if ($mes === null) {
            $this->errors->throwFast('mes_id', 'El mes no existe', 404);
        }

        $totales = DB::table('movimientos')
            ->selectRaw('tipo, SUM(monto) as total')
            ->where('mes_id', $mesId)
            ->groupBy('tipo')
            ->pluck('total', 'tipo');

        $ingresos = (float) ($totales['ingreso'] ?? 0);
        $egresos  = (float) ($totales['egreso']  ?? 0);

        $gastosCat = DB::table('movimientos')
            ->join('categorias', 'movimientos.categoria_id', '=', 'categorias.id')
            ->selectRaw('categorias.id, categorias.nombre, categorias.color, SUM(movimientos.monto) as monto')
            ->where('movimientos.mes_id', $mesId)
            ->where('movimientos.tipo', 'egreso')
            ->groupBy('categorias.id', 'categorias.nombre', 'categorias.color')
            ->orderByDesc('monto')
            ->get();

        $porCategoria = $gastosCat->map(function ($row) use ($egresos) {
            return [
                'categoria'  => ['id' => $row->id, 'nombre' => $row->nombre, 'color' => $row->color],
                'monto'      => (float) $row->monto,
                'porcentaje' => $egresos > 0 ? round(((float) $row->monto / $egresos) * 100, 1) : 0,
            ];
        })->values()->toArray();

        return [
            'ingresos_total' => $ingresos,
            'egresos_total'  => $egresos,
            'balance_neto'   => $ingresos - $egresos,
            'por_categoria'  => $porCategoria,
        ];
    }

    /**
     * Evolución anual: datos de saldo/movimientos por mes del año.
     *
     * @param int $anio
     * @return array<int, array<string, mixed>|null>  12 items (null = mes no inicializado)
     */
    public function evolucionAnual(int $anio): array
    {
        $meses = DB::table('meses')->where('anio', $anio)->get()->keyBy('mes');

        $totalesMovs = DB::table('movimientos')
            ->join('meses', 'movimientos.mes_id', '=', 'meses.id')
            ->selectRaw('meses.mes, movimientos.tipo, SUM(movimientos.monto) as total')
            ->where('meses.anio', $anio)
            ->groupBy('meses.mes', 'movimientos.tipo')
            ->get()
            ->groupBy('mes');

        $totalesSaldos = DB::table('cuenta_mes')
            ->join('meses', 'cuenta_mes.mes_id', '=', 'meses.id')
            ->selectRaw('meses.mes, SUM(cuenta_mes.saldo_inicial) as saldo_inicial, SUM(cuenta_mes.saldo_final) as saldo_final')
            ->where('meses.anio', $anio)
            ->groupBy('meses.mes')
            ->get()
            ->keyBy('mes');

        $resultado = [];
        for ($m = 1; $m <= 12; $m++) {
            $mes = $meses->get($m);
            if ($mes === null) {
                $resultado[] = null;
                continue;
            }

            $movsMes   = $totalesMovs->get($m, collect());
            $ingresos  = (float) ($movsMes->firstWhere('tipo', 'ingreso')?->total ?? 0);
            $egresos   = (float) ($movsMes->firstWhere('tipo', 'egreso')?->total  ?? 0);
            $saldos    = $totalesSaldos->get($m);

            $resultado[] = [
                'mes'           => $m,
                'anio'          => $anio,
                'saldo_inicial' => (float) ($saldos?->saldo_inicial ?? 0),
                'ingresos'      => $ingresos,
                'egresos'       => $egresos,
                'saldo_final'   => $mes->estado === 'cerrado' ? (float) ($saldos?->saldo_final ?? 0) : null,
                'estado'        => $mes->estado,
            ];
        }

        return $resultado;
    }

    /**
     * Gastos por categoría para un mes o para todo un año.
     *
     * @param int      $anio
     * @param int|null $mesId  Si se pasa, filtra por ese mes específico
     * @return array<int, array<string, mixed>>
     */
    public function gastosPorCategoria(int $anio, ?int $mesId = null): array
    {
        $query = DB::table('movimientos')
            ->join('categorias', 'movimientos.categoria_id', '=', 'categorias.id')
            ->selectRaw('categorias.id, categorias.nombre, categorias.color, SUM(movimientos.monto) as monto')
            ->where('movimientos.tipo', 'egreso');

        if ($mesId !== null) {
            $query->where('movimientos.mes_id', $mesId);
        } else {
            $query->join('meses', 'movimientos.mes_id', '=', 'meses.id')
                  ->where('meses.anio', $anio);
        }

        $rows = $query
            ->groupBy('categorias.id', 'categorias.nombre', 'categorias.color')
            ->orderByDesc('monto')
            ->get();

        $total = $rows->sum('monto');

        return $rows->map(function ($row) use ($total) {
            return [
                'categoria'  => ['id' => $row->id, 'nombre' => $row->nombre, 'color' => $row->color],
                'monto'      => (float) $row->monto,
                'porcentaje' => $total > 0 ? round(((float) $row->monto / (float) $total) * 100, 1) : 0,
            ];
        })->values()->toArray();
    }
}
