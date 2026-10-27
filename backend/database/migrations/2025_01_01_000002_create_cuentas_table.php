<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla cuentas.
 *
 * La unicidad de nombre entre activas se valida en el Service, no a nivel BD,
 * porque una inactiva puede compartir nombre con una activa.
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla cuentas.
     */
    public function up(): void
    {
        Schema::create('cuentas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('banco')->nullable();
            $table->string('tipo'); // corriente | vista | ahorro | credito | efectivo
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->index('nombre');
            $table->index('activa');
        });
    }

    /**
     * Elimina la tabla cuentas.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuentas');
    }
};
