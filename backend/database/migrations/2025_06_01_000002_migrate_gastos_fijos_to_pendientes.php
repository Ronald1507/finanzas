<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Data migration: convierte gastos_fijos activos en pendientes recurrentes.
 *
 * Relink: movimientos vinculados al gasto fijo reciben el pendiente_id del pendiente migrado.
 * down() es no-op: la reversión real requiere restaurar backup (R6 del design).
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    public function up(): void
    {
        // No-op si la tabla no existe o no hay activos
        if (!Schema::hasTable('gastos_fijos')) {
            return;
        }

        $activos = DB::table('gastos_fijos')->where('activo', true)->get();
        if ($activos->isEmpty()) {
            return;
        }

        // Resolver mes abierto; abortar si falta (no tiene sentido migrar sin mes destino)
        $mesId = DB::table('meses')->where('estado', 'abierto')->value('id');
        if ($mesId === null) {
            throw new \Exception('No existe un mes abierto. No se pueden migrar los gastos fijos activos a pendientes.');
        }

        // Calcular el último día del mes abierto para fecha_estimada
        $mes = DB::table('meses')->where('id', $mesId)->first();
        $ultimoDia = \Carbon\Carbon::create((int) $mes->anio, (int) $mes->mes, 1)->endOfMonth()->format('Y-m-d');

        // Cuenta activa fallback para gastos fijos sin cuenta_id
        $cuentaFallbackId = DB::table('cuentas')->where('activa', true)->orderBy('id')->value('id');

        $ahora = now()->toDateTimeString();
        // Mapa gf.id → pendiente.id para el relink
        $mapa = [];

        foreach ($activos as $gf) {
            $cuentaId = $gf->cuenta_id ?? $cuentaFallbackId;
            if ($cuentaId === null) {
                throw new \Exception("No existe ninguna cuenta activa. No se puede migrar el gasto fijo ID {$gf->id}.");
            }

            $pendienteId = DB::table('pendientes')->insertGetId([
                'cuenta_id'           => $cuentaId,
                'mes_id'              => $mesId,
                'tipo'                => 'por_pagar',
                'monto'               => $gf->monto_estimado ?? 0,
                'descripcion'         => $gf->nombre,
                'fecha_estimada'      => $ultimoDia,
                'estado'              => 'pendiente',
                'recurrente'          => true,
                'movimiento_id'       => null,
                'pendiente_origen_id' => null,
                'created_at'          => $ahora,
                'updated_at'          => $ahora,
            ]);

            $mapa[$gf->id] = $pendienteId;
        }

        // Relink: movimientos que apuntaban al gasto fijo y no tienen pendiente_id aún
        foreach ($mapa as $gfId => $pendienteId) {
            DB::table('movimientos')
                ->where('gasto_fijo_id', $gfId)
                ->whereNull('pendiente_id')
                ->update(['pendiente_id' => $pendienteId]);
        }
    }

    public function down(): void
    {
        // shortcut: no reversible de forma automatica; restaurar backup para rollback completo
    }
};
