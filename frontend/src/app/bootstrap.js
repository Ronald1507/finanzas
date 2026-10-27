/**
 * Bootstrap de la aplicación.
 * Carga inicial del store de meses al iniciar la app.
 * Se invoca desde App.jsx al montar.
 *
 * @module app/bootstrap
 */
import useMesStore from '../shared/hooks/useMesStore';
import { mesesService } from '../features/CierreMensual/services/mesesService';

/**
 * Inicializa el estado global de meses.
 * Debe llamarse una sola vez al arrancar la aplicación.
 */
export const bootstrapApp = () => {
    const { cargarMeses } = useMesStore.getState();
    cargarMeses(mesesService.getList);
};
