<?php

namespace App\Utils;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Servicio encargado de aplicar paginación, selección de campos, ordenamiento y filtrado a consultas Eloquent.
 *
 * Este servicio permite estandarizar la forma en que se procesan las solicitudes de listado,
 * garantizando consistencia, seguridad (mediante listas blancas) y flexibilidad.
 */
class PaginationUtils
{
    /**
     * Aplica paginación, selección de campos, ordenamiento y filtros a una consulta Eloquent.
     *
     * @param Builder $query Consulta base sobre la cual se aplicarán los criterios.
     * @param array $params Parámetros de entrada con opciones de paginación, selección, orden y filtros.
     * @param array $seleccionPermitidos Lista blanca de campos disponibles para selección.
     * @param array $ordenamientoPermitido Lista blanca de columnas disponibles para ordenamiento.
     * @param array $filtrosPermitidos Lista blanca de columnas disponibles para filtrado. Opcional.
     * @param int $limit Máximo número de registros permitidos por página. Por defecto 100.
     * @return array Resultados paginados con metadatos (página actual, total, etc.).
     */
    public function paginar(
        Builder $query,
        array $params,
        ?array $seleccionPermitidos = null,
        ?array $ordenamientoPermitido = null,
        ?array $filtrosPermitidos = [],
        int $limit = 100,
        ?array $likes = [],
        ?array $likesExpresiones = []
        ): array
    {
        // Reglas de validación
        $rules = [
            'per_page' => "nullable|integer|min:1|max:{$limit}",
            'page' => 'nullable|integer|min:1',
            'select' => 'nullable|array',
            'order_by' => 'nullable|array',
            'filters' => 'nullable|array',
        ];

        if (!is_null($seleccionPermitidos) && is_array($seleccionPermitidos) && !empty($seleccionPermitidos)) {
            $rules['select.*'] = 'string|in:' . implode(',', $seleccionPermitidos);
        }

        if (!is_null($ordenamientoPermitido) && is_array($ordenamientoPermitido) && !empty($ordenamientoPermitido)) {
            $rules['order_by.*.column'] = 'required_with:order_by|string|in:' . implode(',', $ordenamientoPermitido);
            $rules['order_by.*.direction'] = 'required_with:order_by|string|in:asc,desc';
        }

        // Validación de parámetros
        $validados = Validator::make($params, $rules, [
            'per_page' => "Resultados por página no puede superar los {$limit} registros",
            'page' => 'No se indicó la página actual',
        ])->validate();

        // Valores por defecto
        $perPage = $validados['per_page'] ?? 15;
        $page = $validados['page'] ?? 1;
        $select = isset($validados['select']) && is_array($validados['select']) ? $validados['select'] : $seleccionPermitidos;

        // Aplicar selección de campos
        if (!empty($select)) {
            $query->select($select);
        }

        // Operador de coincidencia insensible a mayúsculas según el motor.
        // PostgreSQL distingue mayúsculas con LIKE; ILIKE replica el comportamiento
        // case-insensitive que MySQL y SQLite tienen por defecto.
        $likeOperator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

        // Aplicar filtros
        if (!empty($validados['filters']) && is_array($filtrosPermitidos)) {
            foreach ($validados['filters'] as $campo => $valor) {
                if (in_array($campo, $filtrosPermitidos) && $valor !== null) {
                    if (is_array($likesExpresiones) && array_key_exists($campo, $likesExpresiones)) {
                        // Campo virtual con expresión SQL personalizada
                        $query->where(DB::raw($likesExpresiones[$campo]), $likeOperator, "%{$valor}%");
                    }
                    elseif (is_array($likes) && in_array($campo, $likes)) {
                        $query->where($campo, $likeOperator, "%{$valor}%");
                    }
                    else {
                        $query->where($campo, $valor);
                    }
                }
            }
        }

        // Aplicar ordenamiento
        if (!empty($validados['order_by']) && is_array($ordenamientoPermitido)) {
            foreach ($validados['order_by'] as $orden) {
                if (in_array($orden['column'], $ordenamientoPermitido)) {
                    $query->orderBy($orden['column'], $orden['direction']);
                }
            }
        }
        //dd($query->toRawSql());
        // Ejecutar paginación
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Retornar resultados formateados
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ]
        ];
    }

    /**
     * Pagina un query builder aplicando whitelists de seguridad.
     *
     * El query builder debe tener select, filtros y relaciones
     * ya aplicados antes de llamar a este metodo.
     *
     * @param  mixed  $query                Query builder de Eloquent (Builder o relacion)
     * @param  array  $params               Parametros del request
     * @param  array  $ordenamientoPermitido Columnas permitidas para ordenamiento
     * @param  string $defaultOrder         Columna de ordenamiento por defecto
     * @param  string $defaultDir           Direccion de ordenamiento por defecto ('asc'|'desc')
     * @param  int    $perPageDefault       Cantidad de registros por pagina por defecto
     * @param  int    $perPageMax           Cantidad maxima de registros por pagina
     * @return LengthAwarePaginator
     */
    public static function deprecatedPaginar(
        $query,
        array $params,
        array $ordenamientoPermitido = [],
        string $defaultOrder = 'id',
        string $defaultDir = 'desc',
        int $perPageDefault = 15,
        int $perPageMax = 100
    ): LengthAwarePaginator {
        $perPage = min(
            (int) ($params['per_page'] ?? $params['perpage'] ?? $perPageDefault),
            $perPageMax
        );

        $orderBy = $params['order_by'] ?? $defaultOrder;
        $orderDir = strtolower($params['order_dir'] ?? $defaultDir);

        if (!in_array($orderDir, ['asc', 'desc'], true)) {
            $orderDir = $defaultDir;
        }

        if (!empty($ordenamientoPermitido)) {
            if (in_array($orderBy, $ordenamientoPermitido, true)) {
                $query->orderBy($orderBy, $orderDir);
            } else {
                $query->orderBy($defaultOrder, $defaultDir);
            }
        } else {
            $query->orderBy($defaultOrder, $defaultDir);
        }

        return $query->paginate($perPage, ['*'], 'page');
    }

}
