<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int         $id
 * @property string      $nombre
 * @property string|null $color
 * @property bool        $activa
 * @package App\Models
 */
class Categoria extends Model
{
    protected $table = 'categorias';

    /** @var list<string> */
    protected $fillable = ['nombre', 'color', 'activa'];

    /** @var array<string, string> */
    protected $casts = ['activa' => 'boolean'];

    /** @return HasMany<Movimiento> */
    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class, 'categoria_id');
    }
}
