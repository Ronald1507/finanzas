<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla gastos_fijos.
 *
 * Catálogo de gastos recurrentes mensuales (luz, agua, Netflix, tarjeta, crédito).
 * Cada mes el usuario registra el monto real, generando un egreso (movimiento) vinculado.
 * cuenta_id: cuenta por defecto sugerida al registrar el pago (nullable).
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla gastos_fijos.
     */
    public function up(): void
    {
        Schema::create('gastos_fijos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('categoria')->default('Gastos Fijos');
            $table->foreignId('cuenta_id')->nullable()->constrained('cuentas')->nullOnDelete();
            $table->decimal('monto_estimado', 15, 2)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index('activo');
        });
    }

    /**
     * Elimina la tabla gastos_fijos.
     */
    public function down(): void
    {
        Schema::dropIfExists('gastos_fijos');
    }
};
