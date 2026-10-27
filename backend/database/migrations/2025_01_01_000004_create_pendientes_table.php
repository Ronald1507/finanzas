<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla pendientes.
 *
 * movimiento_id: movimiento real generado al concretar (FK diferida — se define después
 * de que exista la tabla movimientos para evitar dependencia circular).
 * pendiente_origen_id: si la fila es un arrastre por cierre, apunta al pendiente original.
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla pendientes.
     */
    public function up(): void
    {
        Schema::create('pendientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuenta_id')->constrained('cuentas')->restrictOnDelete();
            $table->foreignId('mes_id')->constrained('meses')->restrictOnDelete();
            $table->string('tipo'); // por_pagar | por_recibir
            $table->decimal('monto', 15, 2);
            $table->string('descripcion');
            $table->date('fecha_estimada');
            $table->string('estado'); // pendiente | realizado | anulado
            // movimiento_id se añade sin FK formal para evitar dependencia circular con movimientos
            $table->unsignedBigInteger('movimiento_id')->nullable();
            // pendiente_origen_id: FK autorreferencial (arrastre por cierre)
            $table->unsignedBigInteger('pendiente_origen_id')->nullable();
            $table->timestamps();

            $table->index(['mes_id', 'estado']);
            $table->index('tipo');
            $table->index('pendiente_origen_id');

            $table->foreign('pendiente_origen_id')->references('id')->on('pendientes')->nullOnDelete();
        });
    }

    /**
     * Elimina la tabla pendientes.
     */
    public function down(): void
    {
        Schema::dropIfExists('pendientes');
    }
};
