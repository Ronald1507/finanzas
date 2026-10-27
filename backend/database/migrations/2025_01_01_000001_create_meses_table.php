<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para la tabla meses.
 *
 * Registra cada mes calendario gestionado por la aplicación.
 * Invariante: existe exactamente un mes abierto a la vez (siempre el último).
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    /**
     * Crea la tabla meses.
     */
    public function up(): void
    {
        Schema::create('meses', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('anio');
            $table->unsignedTinyInteger('mes'); // 1–12
            $table->string('estado'); // abierto | cerrado
            $table->dateTime('fecha_cierre')->nullable();
            $table->timestamps();

            $table->unique(['anio', 'mes']);
            $table->index('estado');
        });
    }

    /**
     * Elimina la tabla meses.
     */
    public function down(): void
    {
        Schema::dropIfExists('meses');
    }
};
