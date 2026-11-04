<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int   $id
 * @property int   $categoria_id
 * @property int   $mes_id
 * @property float $monto_limite
 * @package App\Models
 */
class Presupuesto extends Model
{
    protected $table = 'presupuestos';

    /** @var list<string> */
    protected $fillable = ['categoria_id', 'mes_id', 'monto_limite'];

    /** @var array<string, string> */
    protected $casts = ['monto_limite' => 'float'];

    /** @return BelongsTo<Categoria, Presupuesto> */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    /** @return BelongsTo<Mes, Presupuesto> */
    public function mes(): BelongsTo
    {
        return $this->belongsTo(Mes::class);
    }
}
