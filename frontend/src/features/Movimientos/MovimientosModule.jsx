/**
 * Orquestador del módulo Movimientos.
 *
 * @module features/Movimientos/MovimientosModule
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import useCrudList from '../../shared/hooks/useCrudList';
import useFlatList from '../../shared/hooks/useFlatList';
import useDialogState from '../../shared/hooks/useDialogState';
import useMesStore from '../../shared/hooks/useMesStore';
import useDashboard from '../SaldosDashboard/hooks/useDashboard';
import { movimientosService } from './services/movimientosService';
import { cuentasService } from '../GestionCuentas/services/cuentasService';
import { categoriasService } from '../GestionCategorias/services/categoriasService';
import MovimientosListView from './views/MovimientosListView';
import MovimientoDialog from './components/MovimientoDialog';
import TransferenciaDialog from './components/TransferenciaDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';
import { hoyParaInput, fechaParaInput } from '../../shared/utils/formatearFecha';
import { validateForm } from '../../shared/utils/validateForm';

/**
 * Orquestador del módulo de movimientos financieros.
 *
 * @returns {JSX.Element}
 */
export default function MovimientosModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const mesAbierto = mesSeleccionado?.estado === 'abierto';
    const mesId = mesSeleccionado?.id;

    const [cuentaFilter, setCuentaFilter] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState('');  // categoria_id

    const listHook = useCrudList({
        service: movimientosService,
        active: !!mesId,
        params: {
            mes_id: mesId,
            cuenta_id: cuentaFilter,
            tipo: tipoFilter,
            categoria_id: categoriaFilter,
        },
    });

    const dashboardHook = useDashboard();

    const cuentasFlat = useFlatList(cuentasService);
    const categoriasFlat = useFlatList(categoriasService);
    useEffect(() => { cuentasFlat.fetch(); categoriasFlat.fetch(); }, []);

    const dialogState = useDialogState(
        movimientosService,
        { cuenta_id: '', tipo: '', monto: '', fecha: hoyParaInput(), descripcion: '', observacion: '', categoria_id: '' },
        {
            onSuccess: [() => { listHook.refresh(); dashboardHook.refresh(); }],
            validate: (data) => validateForm(data, {
                cuenta_id: { required: true, label: 'La cuenta' },
                tipo: { required: true, label: 'El tipo' },
                monto: { required: true, type: 'number', positive: true, label: 'El monto' },
                fecha: { required: true, label: 'La fecha' },
                descripcion: { required: true, maxLength: 500, label: 'La descripción' },
            }),
        },
    );

    // Transferencia dialog
    const TRANSFERENCIA_INICIAL = { cuenta_origen_id: '', cuenta_destino_id: '', monto: '', fecha: hoyParaInput(), descripcion: '' };
    const [transferenciaOpen, setTransferenciaOpen] = useState(false);
    const [transferenciaForm, setTransferenciaForm] = useState(TRANSFERENCIA_INICIAL);
    const [transferenciaErrors, setTransferenciaErrors] = useState(null);
    const [transferenciaGuardando, setTransferenciaGuardando] = useState(false);

    const setTransferenciaField = (field, value) => {
        setTransferenciaForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleOpenTransferencia = () => {
        setTransferenciaForm({ ...TRANSFERENCIA_INICIAL, fecha: hoyParaInput() });
        setTransferenciaErrors(null);
        setTransferenciaOpen(true);
    };

    const handleSaveTransferencia = async () => {
        setTransferenciaErrors(null);

        // Validación cliente antes de llamar al servidor.
        const clientErrors = validateForm(transferenciaForm, {
            cuenta_origen_id: { required: true, label: 'La cuenta origen' },
            cuenta_destino_id: { required: true, label: 'La cuenta destino' },
            monto: { required: true, type: 'number', positive: true, label: 'El monto' },
            fecha: { required: true, label: 'La fecha' },
        });
        if (clientErrors) {
            setTransferenciaErrors(clientErrors);
            return;
        }
        if (String(transferenciaForm.cuenta_origen_id) === String(transferenciaForm.cuenta_destino_id)) {
            setTransferenciaErrors({ cuenta_destino_id: ['La cuenta destino debe ser distinta a la de origen.'] });
            return;
        }

        setTransferenciaGuardando(true);
        try {
            await movimientosService.transferir(transferenciaForm);
            setTransferenciaOpen(false);
            listHook.refresh();
            dashboardHook.refresh();
            setSuccessMsg('Transferencia registrada correctamente.');
        } catch (err) {
            const serverErrors = err.response?.data?.errors
                || { general: err.response?.data?.message || 'Error al registrar la transferencia.' };
            setTransferenciaErrors(serverErrors);
        } finally {
            setTransferenciaGuardando(false);
        }
    };

    // Confirm eliminar
    const [eliminarOpen, setEliminarOpen] = useState(false);
    const [movimientoEliminar, setMovimientoEliminar] = useState(null);
    const [eliminarLoading, setEliminarLoading] = useState(false);

    // Snackbars
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleDelete = (item) => {
        setMovimientoEliminar(item);
        setEliminarOpen(true);
    };

    const handleConfirmEliminar = async () => {
        setEliminarLoading(true);
        try {
            await movimientosService.delete(movimientoEliminar.id);
            setEliminarOpen(false);
            setMovimientoEliminar(null);
            listHook.refresh();
            dashboardHook.refresh();
            setSuccessMsg('Movimiento eliminado correctamente.');
        } catch (err) {
            setEliminarOpen(false);
            const msg = err.response?.data?.message || 'Error al eliminar el movimiento.';
            setErrorMsg(msg);
        } finally {
            setEliminarLoading(false);
        }
    };

    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const res = await dialogState.save(transform);
            if (res) setSuccessMsg(dialogState.formData?.id ? 'Movimiento actualizado.' : 'Movimiento registrado.');
            return res;
        },
    };

    return (
        <Box>
            <MovimientosListView
                listHook={listHook}
                cuentas={cuentasFlat.items}
                categorias={categoriasFlat.items}
                cuentaFilter={cuentaFilter}
                onCuentaFilterChange={setCuentaFilter}
                tipoFilter={tipoFilter}
                onTipoFilterChange={setTipoFilter}
                categoriaFilter={categoriaFilter}
                onCategoriaFilterChange={setCategoriaFilter}
                onNew={dialogState.openNew}
                onEdit={(item) => dialogState.openEdit({ ...item, fecha: fechaParaInput(item.fecha) })}
                onDelete={(id) => {
                    const item = listHook.items.find((m) => m.id === id);
                    if (item) handleDelete(item);
                }}
                onTransferencia={handleOpenTransferencia}
                mesAbierto={mesAbierto}
                cuentasSaldos={dashboardHook.cuentas}
                loadingSaldos={dashboardHook.loading}
            />

            <MovimientoDialog
                dialogState={wrappedDialogState}
                cuentas={cuentasFlat.items}
                categorias={categoriasFlat.items}
                mesAbierto={mesAbierto}
            />

            <TransferenciaDialog
                open={transferenciaOpen}
                cuentas={cuentasFlat.items}
                formData={transferenciaForm}
                setField={setTransferenciaField}
                errors={transferenciaErrors}
                saving={transferenciaGuardando}
                onSave={handleSaveTransferencia}
                onClose={() => { setTransferenciaOpen(false); setTransferenciaErrors(null); }}
            />

            <ConfirmDialog
                open={eliminarOpen}
                title="Eliminar Movimiento"
                message={
                    movimientoEliminar?.movimiento_relacionado_id
                        ? `Este movimiento forma parte de una transferencia. Al eliminarlo, también se eliminará su movimiento par. ¿Deseas continuar?`
                        : `¿Eliminar el movimiento "${movimientoEliminar?.descripcion}"? Esta acción no puede deshacerse.`
                }
                confirmLabel="Eliminar"
                confirmColor="error"
                loading={eliminarLoading}
                onConfirm={handleConfirmEliminar}
                onCancel={() => { setEliminarOpen(false); setMovimientoEliminar(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
            <ErrorSnackbar
                message={errorMsg || listHook.error}
                onClose={() => { setErrorMsg(''); listHook.clearError(); }}
            />
        </Box>
    );
}
