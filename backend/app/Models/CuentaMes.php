<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo CuentaMes — saldo inicial y final de una cuenta en un mes.
 *
 * Una cuenta participa en un mes si y solo si existe una fila aquí.
 * saldo_final solo es no-null en meses cerrados (congelado al cierre).
 *
 * @property int   $id
 * @property int   $cuenta_id
 * @property int   $mes_id
 * @property float $saldo_inicial
 * @property float|null $saldo_final
 * @package App\Models
 */
class CuentaMes extends Model
{
    /** @var string */
    protected $table = 'cuenta_mes';

    /** @var list<string> */
    protected $fillable = [
        'cuenta_id',
        'mes_id',
        'saldo_inicial',
        'saldo_final',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'saldo_inicial' => 'decimal:2',
        'saldo_final'   => 'decimal:2',
    ];

    /**
     * Cuenta propietaria de este registro.
     *
     * @return BelongsTo<Cuenta, self>
     */
    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class, 'cuenta_id');
    }

    /**
     * Mes al que pertenece este registro.
     *
     * @return BelongsTo<Mes, self>
     */
    public function mes(): BelongsTo
    {
        return $this->belongsTo(Mes::class, 'mes_id');
    }
}
