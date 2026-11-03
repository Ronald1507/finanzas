<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega la columna `recurrente` a pendientes.
 *
 * Un pendiente recurrente se clona en el cierre independientemente de su estado.
 * Un pendiente no recurrente solo se clona si está en estado 'pendiente'.
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendientes', function (Blueprint $table) {
            $table->boolean('recurrente')->default(false)->after('estado');
            $table->index(['recurrente', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::table('pendientes', function (Blueprint $table) {
            $table->dropIndex(['recurrente', 'estado']);
            $table->dropColumn('recurrente');
        });
    }
};
