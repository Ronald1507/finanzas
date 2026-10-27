/**
 * Store global de navegación por mes (zustand).
 * Única fuente de verdad para el mes seleccionado en la aplicación.
 * Dashboard, Movimientos y Pendientes derivan su mes_id de este store.
 *
 * @module shared/hooks/useMesStore
 */
import { create } from 'zustand';

/**
 * Store zustand para gestión del mes seleccionado.
 *
 * @typedef {Object} MesStore
 * @property {Array} meses - Lista de meses con estado abierto/cerrado
 * @property {Object|null} mesSeleccionado - Mes actualmente seleccionado
 * @property {boolean} cargando - Indicador de carga
 * @property {string|null} error - Mensaje de error
 * @property {Function} cargarMeses - Carga/recarga la lista de meses desde el backend
 * @property {Function} seleccionarMes - Selecciona un mes por id
 * @property {Function} irMesAnterior - Navega al mes anterior
 * @property {Function} irMesSiguiente - Navega al mes siguiente
 */
const useMesStore = create((set, get) => ({
    meses: [],
    mesSeleccionado: null,
    cargando: false,
    error: null,

    /**
     * Carga la lista de meses desde el backend y selecciona el mes abierto por defecto.
     * Se invoca al inicio de la app (bootstrap) y tras cerrar/reabrir un mes.
     *
     * @param {Function} getMeses - Función del service que retorna la lista de meses
     */
    cargarMeses: async (getMeses) => {
        set({ cargando: true, error: null });
        try {
            const res = await getMeses();
            if (res.success && Array.isArray(res.data)) {
                const meses = res.data;
                // El mes abierto siempre es el último por invariante del backend
                const mesAbierto = meses.find((m) => m.estado === 'abierto') || meses[meses.length - 1] || null;
                const mesActual = get().mesSeleccionado;
                // Si hay un mes ya seleccionado y sigue existiendo, mantenerlo; si no, usar el abierto
                const mesEncontrado = mesActual
                    ? meses.find((m) => m.id === mesActual.id) || mesAbierto
                    : mesAbierto;
                set({ meses, mesSeleccionado: mesEncontrado, cargando: false });
            } else {
                set({ cargando: false });
            }
        } catch (err) {
            set({ cargando: false, error: 'Error al cargar los meses' });
        }
    },

    /**
     * Selecciona un mes por su id.
     *
     * @param {number} id - ID del mes a seleccionar
     */
    seleccionarMes: (id) => {
        const mes = get().meses.find((m) => m.id === id) || null;
        set({ mesSeleccionado: mes });
    },

    /**
     * Navega al mes anterior en la lista de meses disponibles.
     * Si el mes seleccionado es el primero, no hace nada.
     */
    irMesAnterior: () => {
        const { meses, mesSeleccionado } = get();
        if (!mesSeleccionado || meses.length === 0) return;
        const idx = meses.findIndex((m) => m.id === mesSeleccionado.id);
        if (idx > 0) {
            set({ mesSeleccionado: meses[idx - 1] });
        }
    },

    /**
     * Navega al mes siguiente. Permite ir un mes más allá del último registrado
     * (para el estado MesSinDatos del dashboard).
     */
    irMesSiguiente: () => {
        const { meses, mesSeleccionado } = get();
        if (!mesSeleccionado || meses.length === 0) return;
        const idx = meses.findIndex((m) => m.id === mesSeleccionado.id);
        if (idx < meses.length - 1) {
            set({ mesSeleccionado: meses[idx + 1] });
        } else if (idx === meses.length - 1) {
            // Mes "virtual" siguiente al último (para que el dashboard muestre MesSinDatos)
            const ultimo = meses[meses.length - 1];
            let anio = ultimo.anio;
            let mes = ultimo.mes + 1;
            if (mes > 12) { mes = 1; anio++; }
            set({ mesSeleccionado: { id: null, anio, mes, estado: 'futuro' } });
        }
    },

    /**
     * Establece el mes seleccionado directamente (usado por irMesSiguiente para mes virtual).
     *
     * @param {Object} mes - Objeto de mes a seleccionar
     */
    setMesSeleccionado: (mes) => {
        set({ mesSeleccionado: mes });
    },
}));

export default useMesStore;
