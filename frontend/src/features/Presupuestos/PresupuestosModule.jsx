import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import useCrudList from '../../shared/hooks/useCrudList';
import useFlatList from '../../shared/hooks/useFlatList';
import useDialogState from '../../shared/hooks/useDialogState';
import useMesStore from '../../shared/hooks/useMesStore';
import { presupuestosService } from './services/presupuestosService';
import { categoriasService } from '../GestionCategorias/services/categoriasService';
import PresupuestosListView from './views/PresupuestosListView';
import PresupuestoDialog from './components/PresupuestoDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';
import { validateForm } from '../../shared/utils/validateForm';

export default function PresupuestosModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const mesAbierto = mesSeleccionado?.estado === 'abierto';
    const mesId = mesSeleccionado?.id;

    const listHook = useCrudList({
        service: presupuestosService,
        active: !!mesId,
        params: { mes_id: mesId },
    });

    const categoriasFlat = useFlatList(categoriasService);
    useEffect(() => { categoriasFlat.fetch(); }, []);

    const dialogState = useDialogState(
        presupuestosService,
        { categoria_id: '', monto_limite: '' },
        {
            onSuccess: [() => listHook.refresh()],
            validate: (data) => validateForm(data, {
                categoria_id: { required: true, label: 'La categoría' },
                monto_limite: { required: true, type: 'number', positive: true, label: 'El monto límite' },
            }),
        },
    );

    const [eliminarOpen, setEliminarOpen] = useState(false);
    const [presupuestoEliminar, setPresupuestoEliminar] = useState(null);
    const [eliminarLoading, setEliminarLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleDelete = (item) => { setPresupuestoEliminar(item); setEliminarOpen(true); };

    const handleConfirmEliminar = async () => {
        setEliminarLoading(true);
        try {
            await presupuestosService.delete(presupuestoEliminar.id);
            setEliminarOpen(false);
            setPresupuestoEliminar(null);
            listHook.refresh();
            setSuccessMsg('Presupuesto eliminado.');
        } catch (err) {
            setEliminarOpen(false);
            setErrorMsg(err.response?.data?.message || 'Error al eliminar el presupuesto.');
        } finally {
            setEliminarLoading(false);
        }
    };

    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const payload = typeof transform === 'function' ? transform(dialogState.formData) : dialogState.formData;
            if (mesId && !payload.mes_id) payload.mes_id = mesId;
            const res = await dialogState.save(() => payload);
            if (res) setSuccessMsg(dialogState.formData?.id ? 'Presupuesto actualizado.' : 'Presupuesto creado.');
            return res;
        },
    };

    return (
        <Box>
            <PresupuestosListView
                listHook={listHook}
                onNew={dialogState.openNew}
                onEdit={dialogState.openEdit}
                onDelete={handleDelete}
                mesAbierto={mesAbierto}
            />

            <PresupuestoDialog
                dialogState={wrappedDialogState}
                categorias={categoriasFlat.items}
            />

            <ConfirmDialog
                open={eliminarOpen}
                title="Eliminar Presupuesto"
                message={`¿Eliminar el presupuesto de "${presupuestoEliminar?.categoria?.nombre}"?`}
                confirmLabel="Eliminar"
                confirmColor="error"
                loading={eliminarLoading}
                onConfirm={handleConfirmEliminar}
                onCancel={() => { setEliminarOpen(false); setPresupuestoEliminar(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
            <ErrorSnackbar
                message={errorMsg || listHook.error}
                onClose={() => { setErrorMsg(''); listHook.clearError(); }}
            />
        </Box>
    );
}
