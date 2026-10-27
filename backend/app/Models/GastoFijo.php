<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo GastoFijo — gasto recurrente mensual definido en un catálogo.
 *
 * Cada mes el usuario registra el monto real, lo que genera un egreso (movimiento)
 * vinculado por gasto_fijo_id. Desactivar conserva los movimientos históricos.
 *
 * @property int    $id
 * @property string $nombre
 * @property string $categoria
 * @property int|null $cuenta_id
 * @property float|null $monto_estimado
 * @property bool   $activo
 * @package App\Models
 */
class GastoFijo extends Model
{
    /** @var string */
    protected $table = 'gastos_fijos';

    /** @var list<string> */
    protected $fillable = [
        'nombre',
        'categoria',
        'cuenta_id',
        'monto_estimado',
        'activo',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'monto_estimado' => 'decimal:2',
        'activo'         => 'boolean',
    ];

    /**
     * Cuenta por defecto sugerida para el gasto fijo.
     *
     * @return BelongsTo<Cuenta, self>
     */
    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(Cuenta::class, 'cuenta_id');
    }

    /**
     * Movimientos generados por este gasto fijo.
     *
     * @return HasMany<Movimiento>
     */
    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'gasto_fijo_id');
    }
}
