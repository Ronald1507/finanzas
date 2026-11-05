<?php

namespace App\Repositories;

use App\Models\Pendiente;
use App\Utils\PaginationUtils;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;

/**
 * Repositorio para la entidad Pendiente.
 *
 * Solo queries; sin lógica de negocio ni transacciones.
 *
 * @package App\Repositories
 */
class PendienteRepository
{
    /**
     * @param Pendiente       $model
     * @param PaginationUtils $pagination
     */
    public function __construct(
        protected Pendiente $model,
        protected PaginationUtils $pagination
    ) {}

    /**
     * Busca un pendiente por ID.
     *
     * @param int $id
     * @return Pendiente|null
     */
    public function findPendiente(int $id): ?Pendiente
    {
        return $this->model->newQuery()->where('user_id', Auth::id())->find($id);
    }

    /**
     * Retorna pendientes paginados de un mes con filtros opcionales.
     *
     * Usado por el endpoint GET /api/pendientes.
     *
     * @param array<string, mixed> $params  Acepta: mes_id, tipo, estado, page, per_page
     * @return array{data: array<int, Pendiente>, meta: array<string, int>}
     */
    public function paginatePorMes(array $params): array
    {
        $query = $this->model->newQuery()
            ->where('user_id', Auth::id())
            ->where('mes_id', $params['mes_id'])
            ->when(isset($params['tipo']),       fn($q) => $q->where('tipo',       $params['tipo']))
            ->when(isset($params['estado']),     fn($q) => $q->where('estado',     $params['estado']))
            ->when(isset($params['recurrente']), fn($q) => $q->where('recurrente', $params['recurrente']))
            ->with(['cuenta', 'mes'])
            ->orderBy('fecha_estimada');

        return $this->pagination->paginar($query, $params, null, null, [], 100);
    }

    /**
     * Retorna pendientes de un mes con filtros opcionales de tipo, estado y recurrente.
     *
     * Uso interno (cierre mensual, reapertura). Para el endpoint API usar paginatePorMes().
     *
     * @param int         $mesId
     * @param string|null $tipo       por_pagar|por_recibir
     * @param string|null $estado     pendiente|realizado|anulado
     * @param bool|null   $recurrente true|false|null (sin filtro)
     * @return Collection<int, Pendiente>
     */
    public function getPorMes(int $mesId, ?string $tipo = null, ?string $estado = null, ?bool $recurrente = null): Collection
    {
        return $this->model->newQuery()
            ->where('user_id', Auth::id())
            ->where('mes_id', $mesId)
            ->when($tipo !== null,       fn($q) => $q->where('tipo',       $tipo))
            ->when($estado !== null,     fn($q) => $q->where('estado',     $estado))
            ->when(!is_null($recurrente), fn($q) => $q->where('recurrente', $recurrente))
            ->with(['cuenta', 'mes'])
            ->orderBy('fecha_estimada')
            ->get();
    }

    /**
     * Retorna los pendientes a clonar en el cierre mensual.
     *
     * Criterio: recurrentes (cualquier estado) + no recurrentes en estado 'pendiente'.
     *
     * @param int $mesId
     * @return Collection<int, Pendiente>
     */
    public function getClonablesPorCierre(int $mesId): Collection
    {
        return $this->model->newQuery()
            ->where('user_id', Auth::id())
            ->where('mes_id', $mesId)
            ->where(function ($q) {
                $q->where('recurrente', true)
                  ->orWhere(fn($q2) => $q2->where('recurrente', false)->where('estado', 'pendiente'));
            })
            ->with(['cuenta', 'mes'])
            ->orderBy('fecha_estimada')
            ->get();
    }

    /**
     * Retorna pendientes en estado 'pendiente' de una cuenta en un mes.
     *
     * Usado para validar desactivación de cuenta.
     *
     * @param int $cuentaId
     * @param int $mesId
     * @return Collection<int, Pendiente>
     */
    public function getPendientesAbiertosPorCuentaYMes(int $cuentaId, int $mesId): Collection
    {
        return $this->model->newQuery()
            ->where('user_id', Auth::id())
            ->where('cuenta_id', $cuentaId)
            ->where('mes_id', $mesId)
            ->where('estado', 'pendiente')
            ->get();
    }

    /**
     * Retorna totales de por_pagar y por_recibir pendientes agrupados por cuenta_id.
     *
     * Solo considera pendientes en estado 'pendiente'.
     *
     * @param int $mesId
     * @return Collection<int, object>  Cada item: {cuenta_id, total_por_pagar, total_por_recibir}
     */
    public function getTotalesPendientesPorMes(int $mesId): Collection
    {
        return $this->model->newQuery()
            ->selectRaw('cuenta_id,
                SUM(CASE WHEN tipo = ? THEN monto ELSE 0 END) as total_por_pagar,
                SUM(CASE WHEN tipo = ? THEN monto ELSE 0 END) as total_por_recibir', ['por_pagar', 'por_recibir'])
            ->where('user_id', Auth::id())
            ->where('mes_id', $mesId)
            ->where('estado', 'pendiente')
            ->groupBy('cuenta_id')
            ->get();
    }

    /**
     * Retorna los pendientes clonados (arrastres) cuyo origen pertenece a un mes.
     *
     * Usado para la reapertura: identificar los clones del mes siguiente.
     *
     * @param int $mesOrigenId  ID del mes cuyos pendientes fueron clonados
     * @return Collection<int, Pendiente>
     */
    public function getClonadosDesdeMes(int $mesOrigenId): Collection
    {
        return $this->model->newQuery()
            ->whereHas('pendienteOrigen', fn($q) => $q->where('mes_id', $mesOrigenId))
            ->get();
    }

    /**
     * Inserta múltiples pendientes en bloque (para el cierre mensual — clonación).
     *
     * @param array<int, array<string, mixed>> $rows
     * @return void
     */
    public function bulkInsert(array $rows): void
    {
        if (empty($rows)) {
            return;
        }
        $userId = Auth::id();
        $rows = array_map(fn($r) => array_merge($r, ['user_id' => $userId]), $rows);
        $this->model->newQuery()->insert($rows);
    }

    /**
     * Elimina todos los pendientes clonados cuyo origen pertenece a un mes.
     *
     * Usa un DELETE con subquery en lugar de N DELETEs individuales.
     * Empleado en la reapertura para revertir los arrastres del mes siguiente.
     *
     * @param int $mesOrigenId  ID del mes cuyos pendientes fueron clonados
     * @return void
     */
    public function deleteByOrigenMesId(int $mesOrigenId): void
    {
        $this->model->newQuery()
            ->whereIn('pendiente_origen_id', function ($query) use ($mesOrigenId) {
                $query->select('id')
                    ->from('pendientes')
                    ->where('mes_id', $mesOrigenId);
            })
            ->delete();
    }

    /**
     * Crea un nuevo pendiente.
     *
     * @param array<string, mixed> $datos
     * @return Pendiente
     */
    public function create(array $datos): Pendiente
    {
        $datos['user_id'] = Auth::id();
        return $this->model->newQuery()->create($datos);
    }

    /**
     * Actualiza un pendiente existente.
     *
     * @param Pendiente $pendiente
     * @param array<string, mixed> $datos
     * @return Pendiente
     */
    public function update(Pendiente $pendiente, array $datos): Pendiente
    {
        $pendiente->update($datos);
        return $pendiente;
    }

    /**
     * Elimina un pendiente.
     *
     * @param Pendiente $pendiente
     * @return void
     */
    public function delete(Pendiente $pendiente): void
    {
        $pendiente->delete();
    }

    /**
     * Cuenta pendientes en estado 'pendiente' de un mes excluyendo los que son clones.
     *
     * Un pendiente es clon si tiene pendiente_origen_id no-null.
     * Usado para validar reapertura: mes siguiente sin pendientes nuevos.
     *
     * @param int $mesId
     * @return int
     */
    public function countPendientesNuevosPorMes(int $mesId): int
    {
        return $this->model->newQuery()
            ->where('mes_id', $mesId)
            ->whereNull('pendiente_origen_id')
            ->count();
    }
}
