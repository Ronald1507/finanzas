<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Mes — representa un mes calendario gestionado.
 *
 * Invariante: existe exactamente un mes abierto a la vez (siempre el último).
 * Los meses se crean únicamente por bootstrap o cierre del mes anterior.
 *
 * @property int    $id
 * @property int    $anio
 * @property int    $mes
 * @property string $estado   abierto|cerrado
 * @property string|null $fecha_cierre
 * @package App\Models
 */
class Mes extends Model
{
    /** @var string */
    protected $table = 'meses';

    /** @var list<string> */
    protected $fillable = [
        'anio',
        'mes',
        'estado',
        'fecha_cierre',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'anio'         => 'integer',
        'mes'          => 'integer',
        'fecha_cierre' => 'datetime',
    ];

    /**
     * Cuentas participantes en este mes (vía pivot cuenta_mes).
     *
     * @return HasMany<CuentaMes>
     */
    public function cuentaMeses(): HasMany
    {
        return $this->hasMany(CuentaMes::class, 'mes_id');
    }

    /**
     * Movimientos registrados en este mes.
     *
     * @return HasMany<Movimiento>
     */
    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'mes_id');
    }

    /**
     * Pendientes vigentes en este mes.
     *
     * @return HasMany<Pendiente>
     */
    public function pendientes(): HasMany
    {
        return $this->hasMany(Pendiente::class, 'mes_id');
    }
}
