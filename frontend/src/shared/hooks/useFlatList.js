/**
 * Hook para gestionar listas planas (sin paginación) usadas en selectores de formulario.
 *
 * @module shared/hooks/useFlatList
 */
import { useState, useCallback } from 'react';

/**
 * Hook para gestionar listas planas sin paginación.
 *
 * @param {Object} service - Service de la feature con método getFlat()
 * @returns {Object}
 * @returns {Array} returns.items - Lista de elementos
 * @returns {boolean} returns.loading - Indicador de carga
 * @returns {Function} returns.fetch - Función para recargar la lista
 */
export default function useFlatList(service) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!service?.getFlat) return;
        try {
            setLoading(true);
            const res = await service.getFlat();
            if (res.success && Array.isArray(res.data)) {
                setItems(res.data);
            }
        } catch (err) {
            console.error('Error cargando lista plana', err);
        } finally {
            setLoading(false);
        }
    }, [service]);

    return { items, loading, fetch };
}
