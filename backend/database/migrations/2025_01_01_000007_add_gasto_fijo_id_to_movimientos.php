<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración que agrega gasto_fijo_id a la tabla movimientos.
 *
 * gasto_fijo_id: FK a gastos_fijos (egreso nacido al registrar el pago de un gasto fijo).
 * "¿Pagado este mes?" = existe un movimiento con ese gasto_fijo_id en ese mes.
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Agrega la columna gasto_fijo_id a movimientos.
     */
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->unsignedBigInteger('gasto_fijo_id')->nullable()->after('pendiente_id');

            $table->index('gasto_fijo_id');

            $table->foreign('gasto_fijo_id')->references('id')->on('gastos_fijos')->nullOnDelete();
        });
    }

    /**
     * Elimina la columna gasto_fijo_id de movimientos.
     */
    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropForeign(['gasto_fijo_id']);
            $table->dropColumn('gasto_fijo_id');
        });
    }
};
