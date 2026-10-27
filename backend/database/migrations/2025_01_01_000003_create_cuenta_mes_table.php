<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla cuenta_mes.
 *
 * Registra el saldo inicial y final de cada cuenta en cada mes.
 * Una cuenta participa en un mes si y solo si existe una fila aquí.
 * El saldo_final solo es no-null en meses cerrados (congelado al cierre).
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla cuenta_mes.
     */
    public function up(): void
    {
        Schema::create('cuenta_mes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas')->restrictOnDelete();
            $table->foreignId('mes_id')->constrained('meses')->restrictOnDelete();
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->decimal('saldo_final', 15, 2)->nullable();
            $table->timestamps();

            $table->unique(['cuenta_id', 'mes_id']);
            $table->index('mes_id');
        });
    }

    /**
     * Elimina la tabla cuenta_mes.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuenta_mes');
    }
};
