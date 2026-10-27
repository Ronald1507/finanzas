<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo Pendiente — cuenta por pagar o por recibir en un mes.
 *
 * Al concretarse, genera el movimiento real vinculado.
 * pendiente_origen_id: si es un arrastre por cierre, apunta al pendiente del mes cerrado.
 *
 * @property int    $id
 * @property int    $cuenta_id
 * @property int    $mes_id
 * @property string $tipo              por_pagar|por_recibir
 * @property float  $monto
 * @property string $descripcion
 * @property string $fecha_estimada
 * @property string $estado            pendiente|realizado|anulado
 * @property int|null $movimiento_id
 * @property int|null $pendiente_origen_id
 * @package App\Models
 */
class Pendiente extends Model
{
    /** @var string */
    protected $table = 'pendientes';

    /** @var list<string> */
    protected $fillable = [
        'cuenta_id',
        'mes_id',
        'tipo',
        'monto',
        'descripcion',
        'fecha_estimada',
        'estado',
        'movimiento_id',
        'pendiente_origen_id',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'monto'          => 'decimal:2',
        'fecha_estimada' => 'date',
    ];

    /**
     * Cuenta asociada al pendiente.
     *
     * @return BelongsTo<Cuenta, self>
     */
    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class, 'cuenta_id');
    }

    /**
     * Mes donde el pendiente está vigente.
     *
     * @return BelongsTo<Mes, self>
     */
    public function mes(): BelongsTo
    {
        return $this->belongsTo(Mes::class, 'mes_id');
    }

    /**
     * Movimiento real generado al concretar el pendiente.
     *
     * @return BelongsTo<Movimiento, self>
     */
    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(Movimiento::class, 'movimiento_id');
    }

    /**
     * Pendiente original del que derivó este arrastre (si aplica).
     *
     * @return BelongsTo<Pendiente, self>
     */
    public function pendienteOrigen(): BelongsTo
    {
        return $this->belongsTo(Pendiente::class, 'pendiente_origen_id');
    }
}
