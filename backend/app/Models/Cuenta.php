<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Cuenta — representa una cuenta bancaria del usuario.
 *
 * La unicidad de nombre entre cuentas activas se valida en CuentaService
 * (no a nivel BD), porque una inactiva puede compartir nombre con una activa.
 *
 * @property int    $id
 * @property string $nombre
 * @property string|null $banco
 * @property string $tipo    corriente|vista|ahorro|credito|efectivo
 * @property bool   $activa
 * @package App\Models
 */
class Cuenta extends Model
{
    /** @var string */
    protected $table = 'cuentas';

    /** @var list<string> */
    protected $fillable = [
        'nombre',
        'banco',
        'tipo',
        'activa',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'activa' => 'boolean',
    ];

    /**
     * Registros de saldo mensual de esta cuenta.
     *
     * @return HasMany<CuentaMes>
     */
    public function cuentaMeses(): HasMany
    {
        return $this->hasMany(CuentaMes::class, 'cuenta_id');
    }

    /**
     * Movimientos asociados a esta cuenta.
     *
     * @return HasMany<Movimiento>
     */
    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'cuenta_id');
    }

    /**
     * Pendientes asociados a esta cuenta.
     *
     * @return HasMany<Pendiente>
     */
    public function pendientes(): HasMany
    {
        return $this->hasMany(Pendiente::class, 'cuenta_id');
    }
}
