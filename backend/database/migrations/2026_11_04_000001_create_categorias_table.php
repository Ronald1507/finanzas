<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->char('color', 7)->nullable(); // hex CSS: #RRGGBB
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->index('activa');
        });

        DB::table('categorias')->insert([
            ['nombre' => 'General',               'color' => '#9E9E9E', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Alimentación',           'color' => '#43A047', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Transporte',             'color' => '#1E88E5', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Salud',                  'color' => '#E53935', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Entretenimiento',        'color' => '#8E24AA', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Pago Tarjeta Crédito',  'color' => '#F4511E', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Servicios',              'color' => '#00ACC1', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Educación',              'color' => '#FFB300', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Vivienda',               'color' => '#6D4C41', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Otros',                  'color' => '#757575', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Transferencia',          'color' => '#546E7A', 'activa' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias');
    }
};
