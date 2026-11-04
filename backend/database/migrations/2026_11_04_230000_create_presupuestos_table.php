<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presupuestos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained('categorias')->cascadeOnDelete();
            $table->foreignId('mes_id')->constrained('meses')->cascadeOnDelete();
            $table->decimal('monto_limite', 15, 2);
            $table->timestamps();

            $table->unique(['categoria_id', 'mes_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presupuestos');
    }
};
