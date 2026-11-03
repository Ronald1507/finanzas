<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo Movimiento — ingreso o egreso asociado a una cuenta y mes.
 *
 * mes_id se deriva de la fecha por el Service.
 * movimiento_relacionado_id: FK autorreferencial para par de transferencia.
 * pendiente_id: FK a pendientes (movimiento nacido al concretar un pendiente).
 *
 * @property int    $id
 * @property int    $cuenta_id
 * @property int    $mes_id
 * @property string $tipo                  ingreso|egreso
 * @property float  $monto
 * @property string $fecha
 * @property string $descripcion
 * @property string $categoria
 * @property int|null $pendiente_id
 * @property int|null $movimiento_relacionado_id
 * @package App\Models
 */
class Movimiento extends Model
{
    /** @var string */
    protected $table = 'movimientos';

    /** @var list<string> */
    protected $fillable = [
        'cuenta_id',
        'mes_id',
        'tipo',
        'monto',
        'fecha',
        'descripcion',
        'categoria',
        'pendiente_id',
        'movimiento_relacionado_id',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'monto' => 'decimal:2',
        'fecha' => 'date:Y-m-d',
    ];

    /**
     * Cuenta a la que pertenece el movimiento.
     *
     * @return BelongsTo<Cuenta, self>
     */
    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class, 'cuenta_id');
    }

    /**
     * Mes en que se registra el movimiento.
     *
     * @return BelongsTo<Mes, self>
     */
    public function mes(): BelongsTo
    {
        return $this->belongsTo(Mes::class, 'mes_id');
    }

    /**
     * Pendiente que originó este movimiento (si aplica).
     *
     * @return BelongsTo<Pendiente, self>
     */
    public function pendiente(): BelongsTo
    {
        return $this->belongsTo(Pendiente::class, 'pendiente_id');
    }

    /**
     * Movimiento par vinculado (en transferencias).
     *
     * @return BelongsTo<Movimiento, self>
     */
    public function movimientoRelacionado(): BelongsTo
    {
        return $this->belongsTo(Movimiento::class, 'movimiento_relacionado_id');
    }
}
