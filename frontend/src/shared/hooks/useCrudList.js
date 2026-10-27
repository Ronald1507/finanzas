/**
 * Hook reutilizable para gestionar listados CRUD con paginación de servidor,
 * búsqueda con debounce de 500ms y filtros dinámicos.
 *
 * @module shared/hooks/useCrudList
 */
import { useState, useEffect, useCallback } from 'react';
import { mapErrorResponse } from '../../services/apiResponseMapper';

/**
 * Hook para gestionar listados CRUD con paginación y búsqueda.
 *
 * @param {Object} options
 * @param {Object} options.service - Service de la feature con método getList
 * @param {boolean} [options.active=true] - Si el listado debe cargarse
 * @param {Object} [options.params={}] - Parámetros adicionales de filtro
 * @returns {Object} Estado y acciones del listado
 * @returns {Array} returns.items - Datos de la página actual
 * @returns {boolean} returns.loading - Indicador de carga
 * @returns {string} returns.searchQuery - Texto de búsqueda actual
 * @returns {Function} returns.setSearchQuery - Setter de búsqueda (dispara debounce)
 * @returns {number} returns.page - Página actual
 * @returns {Function} returns.setPage - Setter de página
 * @returns {number} returns.totalPages - Total de páginas
 * @returns {number} returns.total - Total de registros
 * @returns {Function} returns.refresh - Recarga la página actual
 */
export default function useCrudList({ service, active = true, params = {} } = {}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const paramsKey = JSON.stringify(params);

    const fetchItems = useCallback(async (p = page, q = searchQuery) => {
        try {
            setLoading(true);
            setError('');
            const res = await service.getList({ page: p, search: q, filters: params });
            if (res.success && res.data?.data) {
                setItems(res.data.data);
                setTotalPages(res.data.meta?.last_page || 1);
                setTotal(res.data.meta?.total || 0);
            } else if (res.success && Array.isArray(res.data)) {
                setItems(res.data);
                setTotalPages(1);
                setTotal(res.data.length);
            } else if (!res.success) {
                setError(res.message || 'No se pudo cargar el listado.');
            }
        } catch (err) {
            setError(mapErrorResponse(err).message);
        } finally {
            setLoading(false);
        }
    // paramsKey, page, searchQuery se incluyen como serializable para evitar rerenders infinitos
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [service, paramsKey]);

    useEffect(() => {
        if (active) fetchItems(page, searchQuery);
    // fetchItems ya captura page/searchQuery; este effect solo se dispara por cambio de page o active
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, active]);

    useEffect(() => {
        if (!active) return;
        const timer = setTimeout(() => {
            setPage(1);
            fetchItems(1, searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    useEffect(() => {
        if (!active) return;
        setPage(1);
        fetchItems(1, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey]);

    const refresh = useCallback(() => {
        fetchItems(page, searchQuery);
    }, [fetchItems, page, searchQuery]);

    const clearError = useCallback(() => setError(''), []);

    return {
        items,
        loading,
        error,
        clearError,
        searchQuery,
        setSearchQuery,
        page,
        setPage,
        totalPages,
        total,
        refresh,
    };
}
