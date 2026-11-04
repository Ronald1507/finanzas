<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pendientes', function (Blueprint $table) {
            $table->unsignedTinyInteger('cuota_actual')->nullable()->after('monto');
            $table->unsignedTinyInteger('cuota_total')->nullable()->after('cuota_actual');
        });
    }

    public function down(): void
    {
        Schema::table('pendientes', function (Blueprint $table) {
            $table->dropColumn(['cuota_actual', 'cuota_total']);
        });
    }
};
