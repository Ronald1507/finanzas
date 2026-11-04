import React, { useState } from 'react';
import { Box } from '@mui/material';
import useCrudList from '../../shared/hooks/useCrudList';
import useDialogState from '../../shared/hooks/useDialogState';
import { categoriasService } from './services/categoriasService';
import CategoriasListView from './views/CategoriasListView';
import CategoriaDialog from './components/CategoriaDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';
import { validateForm } from '../../shared/utils/validateForm';

export default function CategoriasModule() {
    const [activaFilter, setActivaFilter] = useState('');

    const listHook = useCrudList({
        service: categoriasService,
        active: true,
        params: { activa: activaFilter },
    });

    const dialogState = useDialogState(
        categoriasService,
        { nombre: '', color: '#9E9E9E', activa: true },
        {
            onSuccess: [() => listHook.refresh()],
            validate: (data) => validateForm(data, {
                nombre: { required: true, maxLength: 100, label: 'El nombre' },
            }),
        },
    );

    const [desactivarOpen, setDesactivarOpen] = useState(false);
    const [categoriaTarget, setCategoriaTarget] = useState(null);
    const [accionLoading, setAccionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenDesactivar = (categoria) => {
        setCategoriaTarget(categoria);
        setDesactivarOpen(true);
    };

    const handleDesactivar = async () => {
        setAccionLoading(true);
        try {
            const res = await categoriasService.delete(categoriaTarget.id);
            setDesactivarOpen(false);
            setCategoriaTarget(null);
            listHook.refresh();
            setSuccessMsg(res.data?.eliminada ? 'Categoría eliminada.' : 'Categoría desactivada (tiene movimientos vinculados).');
        } catch (err) {
            setDesactivarOpen(false);
            setErrorMsg(err.response?.data?.message || 'No se pudo desactivar la categoría.');
        } finally {
            setAccionLoading(false);
        }
    };

    const handleActivar = async (categoria) => {
        try {
            await categoriasService.update(categoria.id, { activa: true });
            listHook.refresh();
            setSuccessMsg('Categoría activada.');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'No se pudo activar la categoría.');
        }
    };

    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const res = await dialogState.save(transform);
            if (res) setSuccessMsg(dialogState.formData?.id ? 'Categoría actualizada.' : 'Categoría creada.');
            return res;
        },
    };

    return (
        <Box>
            <CategoriasListView
                listHook={listHook}
                activaFilter={activaFilter}
                onActivaFilterChange={setActivaFilter}
                onNew={dialogState.openNew}
                onEdit={dialogState.openEdit}
                onDesactivar={handleOpenDesactivar}
                onActivar={handleActivar}
            />

            <CategoriaDialog dialogState={wrappedDialogState} />

            <ConfirmDialog
                open={desactivarOpen}
                title="Desactivar Categoría"
                message={`¿Desactivar la categoría "${categoriaTarget?.nombre}"? Si tiene movimientos vinculados será desactivada; si no, será eliminada permanentemente.`}
                confirmLabel="Confirmar"
                confirmColor="warning"
                loading={accionLoading}
                onConfirm={handleDesactivar}
                onCancel={() => { setDesactivarOpen(false); setCategoriaTarget(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
            <ErrorSnackbar
                message={errorMsg || listHook.error}
                onClose={() => { setErrorMsg(''); listHook.clearError(); }}
            />
        </Box>
    );
}
