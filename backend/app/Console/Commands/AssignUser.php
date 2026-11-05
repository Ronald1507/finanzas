<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Argument;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:assign-user {userId : ID del usuario al que asignar todos los registros sin user_id}')]
#[Description('Asigna todos los registros existentes (user_id NULL) al usuario indicado.')]
class AssignUser extends Command
{
    public function handle(): int
    {
        $userId = (int) $this->argument('userId');

        if (!DB::table('users')->where('id', $userId)->exists()) {
            $this->error("Usuario {$userId} no existe.");
            return self::FAILURE;
        }

        foreach (['cuentas', 'meses', 'movimientos', 'pendientes'] as $table) {
            $count = DB::table($table)->whereNull('user_id')->update(['user_id' => $userId]);
            $this->line("  {$table}: {$count} registros actualizados.");
        }

        $this->info('Listo.');
        return self::SUCCESS;
    }
}
