<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('categoria_id')
                ->nullable()
                ->after('descripcion')
                ->constrained('categorias')
                ->nullOnDelete();
        });

        // Map existing string values to FK; unrecognized strings (e.g. 'transferencia') stay NULL
        DB::statement("
            UPDATE movimientos
            SET categoria_id = categorias.id
            FROM categorias
            WHERE categorias.nombre = movimientos.categoria
        ");

        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropColumn('categoria');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->string('categoria')->nullable()->after('descripcion');
        });

        DB::statement("
            UPDATE movimientos
            SET categoria = categorias.nombre
            FROM categorias
            WHERE categorias.id = movimientos.categoria_id
        ");

        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropForeign(['categoria_id']);
            $table->dropColumn('categoria_id');
        });
    }
};
