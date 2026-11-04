/**
 * Orquestador del módulo Pendientes.
 *
 * @module features/Pendientes/PendientesModule
 */
import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import useCrudList from '../../shared/hooks/useCrudList';
import useFlatList from '../../shared/hooks/useFlatList';
import useDialogState from '../../shared/hooks/useDialogState';
import useMesStore from '../../shared/hooks/useMesStore';
import { pendientesService } from './services/pendientesService';
import { hoyParaInput } from '../../shared/utils/formatearFecha';
import { cuentasService } from '../GestionCuentas/services/cuentasService';
import PendientesListView from './views/PendientesListView';
import PendienteDialog from './components/PendienteDialog';
import ConcretarPendienteDialog from './components/ConcretarPendienteDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';
import { validateForm } from '../../shared/utils/validateForm';

/**
 * Orquestador del módulo de pendientes financieros.
 *
 * @returns {JSX.Element}
 */
export default function PendientesModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const mesAbierto = mesSeleccionado?.estado === 'abierto';
    const mesId = mesSeleccionado?.id;

    // Filtros de listado: tipo, estado y recurrente se pasan a useCrudList como params
    const [tipoFilter, setTipoFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [recurrenteFilter, setRecurrenteFilter] = useState('');

    const listHook = useCrudList({
        service: pendientesService,
        active: !!mesId,
        params: { mes_id: mesId, tipo: tipoFilter, estado: estadoFilter, recurrente: recurrenteFilter },
    });

    const cuentasFlat = useFlatList(cuentasService);
    useEffect(() => { cuentasFlat.fetch(); }, []);

    const dialogState = useDialogState(
        pendientesService,
        { cuenta_id: '', tipo: '', monto: '', cuota_actual: '', cuota_total: '', descripcion: '', fecha_estimada: '', recurrente: false },
        {
            onSuccess: [() => listHook.refresh()],
            validate: (data) => validateForm(data, {
                cuenta_id: { required: true, label: 'La cuenta' },
                tipo: { required: true, label: 'El tipo' },
                monto: { required: true, type: 'number', positive: true, label: 'El monto' },
                descripcion: { required: true, maxLength: 500, label: 'La descripción' },
            }),
        },
    );

    // Concretar dialog
    const [concretarOpen, setConcretarOpen] = useState(false);
    const [pendienteConcretar, setPendienteConcretar] = useState(null);
    const [concretarFecha, setConcretarFecha] = useState('');
    const [concretarErrors, setConcretarErrors] = useState(null);
    const [concretarSaving, setConcretarSaving] = useState(false);

    // Anular dialog
    const [anularOpen, setAnularOpen] = useState(false);
    const [pendienteAnular, setPendienteAnular] = useState(null);
    const [anularLoading, setAnularLoading] = useState(false);

    // Snackbars
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleConcretar = (item) => {
        setPendienteConcretar(item);
        setConcretarFecha(hoyParaInput());
        setConcretarErrors(null);
        setConcretarOpen(true);
    };

    const handleSaveConcretar = async () => {
        setConcretarSaving(true);
        setConcretarErrors(null);
        try {
            await pendientesService.concretar(pendienteConcretar.id, concretarFecha);
            setConcretarOpen(false);
            setPendienteConcretar(null);
            listHook.refresh();
            setSuccessMsg('Pendiente concretado. Se generó el movimiento real.');
        } catch (err) {
            const serverErrors = err.response?.data?.errors
                || { general: err.response?.data?.message || 'Error al concretar el pendiente.' };
            setConcretarErrors(serverErrors);
        } finally {
            setConcretarSaving(false);
        }
    };

    const handleAnular = (item) => {
        setPendienteAnular(item);
        setAnularOpen(true);
    };

    const handleConfirmAnular = async () => {
        setAnularLoading(true);
        try {
            await pendientesService.anular(pendienteAnular.id);
            setAnularOpen(false);
            setPendienteAnular(null);
            listHook.refresh();
            setSuccessMsg('Pendiente anulado correctamente.');
        } catch (err) {
            setAnularOpen(false);
            const msg = err.response?.data?.message || 'Error al anular el pendiente.';
            setErrorMsg(msg);
        } finally {
            setAnularLoading(false);
        }
    };

    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const res = await dialogState.save(transform);
            if (res) setSuccessMsg(dialogState.formData?.id ? 'Pendiente actualizado.' : 'Pendiente creado correctamente.');
            return res;
        },
    };

    return (
        <Box>
            <PendientesListView
                listHook={listHook}
                tipoFilter={tipoFilter}
                onTipoFilterChange={setTipoFilter}
                estadoFilter={estadoFilter}
                onEstadoFilterChange={setEstadoFilter}
                recurrenteFilter={recurrenteFilter}
                onRecurrenteFilterChange={setRecurrenteFilter}
                onNew={dialogState.openNew}
                onEdit={dialogState.openEdit}
                onConcretar={handleConcretar}
                onAnular={handleAnular}
                mesAbierto={mesAbierto}
            />

            <PendienteDialog
                dialogState={wrappedDialogState}
                cuentas={cuentasFlat.items}
            />

            <ConcretarPendienteDialog
                open={concretarOpen}
                pendiente={pendienteConcretar}
                fecha={concretarFecha}
                onFechaChange={setConcretarFecha}
                errors={concretarErrors}
                saving={concretarSaving}
                onSave={handleSaveConcretar}
                onClose={() => { setConcretarOpen(false); setPendienteConcretar(null); setConcretarErrors(null); }}
            />

            <ConfirmDialog
                open={anularOpen}
                title="Anular Pendiente"
                message={`¿Anular el pendiente "${pendienteAnular?.descripcion}"? El pendiente quedará en estado anulado.`}
                confirmLabel="Anular"
                confirmColor="warning"
                loading={anularLoading}
                onConfirm={handleConfirmAnular}
                onCancel={() => { setAnularOpen(false); setPendienteAnular(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
            <ErrorSnackbar
                message={errorMsg || listHook.error}
                onClose={() => { setErrorMsg(''); listHook.clearError(); }}
            />
        </Box>
    );
}
