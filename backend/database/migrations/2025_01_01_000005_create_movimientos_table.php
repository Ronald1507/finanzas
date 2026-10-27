<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla movimientos.
 *
 * El mes_id se deriva de la fecha por el Service (no lo envía el cliente).
 * pendiente_id: FK a pendientes (movimiento nacido al concretar un pendiente).
 * movimiento_relacionado_id: FK autorreferencial para el par de una transferencia.
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla movimientos.
     */
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas')->restrictOnDelete();
            $table->foreignId('mes_id')->constrained('meses')->restrictOnDelete();
            $table->string('tipo'); // ingreso | egreso
            $table->decimal('monto', 15, 2);
            $table->date('fecha');
            $table->string('descripcion');
            $table->string('categoria');
            $table->unsignedBigInteger('pendiente_id')->nullable();
            $table->unsignedBigInteger('movimiento_relacionado_id')->nullable();
            $table->timestamps();

            $table->index(['mes_id', 'cuenta_id']);
            $table->index('fecha');
            $table->index('tipo');
            $table->index('categoria');

            $table->foreign('pendiente_id')->references('id')->on('pendientes')->nullOnDelete();
            $table->foreign('movimiento_relacionado_id')->references('id')->on('movimientos')->nullOnDelete();
        });
    }

    /**
     * Elimina la tabla movimientos.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
