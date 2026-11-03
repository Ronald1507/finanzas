<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina la tabla gastos_fijos y la columna movimientos.gasto_fijo_id.
 *
 * Debe ejecutarse DESPUÉS de migrate_gastos_fijos_to_pendientes (data migration).
 * down() recrea la estructura sin datos (rollback estructural solamente).
 *
 * @package Database\Migrations
 */
return new class extends Migration
{
    public function up(): void
    {
        // Primero quitar índice, FK y columna en movimientos, luego la tabla referenciada.
        // El dropIndex debe ir antes de dropColumn: SQLite reconstruye la tabla al hacer dropColumn
        // y fallaría al encontrar un índice que ya no tiene columna.
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropIndex(['gasto_fijo_id']);
            $table->dropForeign(['gasto_fijo_id']);
            $table->dropColumn('gasto_fijo_id');
        });

        Schema::dropIfExists('gastos_fijos');
    }

    public function down(): void
    {
        // Recrear solo estructura (sin datos — ver R6 del design)
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

        Schema::table('movimientos', function (Blueprint $table) {
            $table->unsignedBigInteger('gasto_fijo_id')->nullable()->after('pendiente_id');
            $table->index('gasto_fijo_id');
            $table->foreign('gasto_fijo_id')->references('id')->on('gastos_fijos')->nullOnDelete();
        });
    }
};
