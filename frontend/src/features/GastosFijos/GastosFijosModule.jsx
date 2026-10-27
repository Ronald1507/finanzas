/**
 * Orquestador del módulo Gastos Fijos.
 * Compone hooks, view, dialogs y snackbars sin JSX de UI directa.
 *
 * @module features/GastosFijos/GastosFijosModule
 */
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import useFlatList from '../../shared/hooks/useFlatList';
import useDialogState from '../../shared/hooks/useDialogState';
import useMesStore from '../../shared/hooks/useMesStore';
import useGastosFijosMes from './hooks/useGastosFijosMes';
import { gastosFijosService } from './services/gastosFijosService';
import { cuentasService } from '../GestionCuentas/services/cuentasService';
import { hoyParaInput } from '../../shared/utils/formatearFecha';
import { validateForm } from '../../shared/utils/validateForm';
import GastosFijosView from './views/GastosFijosView';
import GastoFijoDialog from './components/GastoFijoDialog';
import RegistrarPagoDialog from './components/RegistrarPagoDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';

/**
 * Orquestador del módulo de gastos fijos.
 *
 * @returns {JSX.Element}
 */
export default function GastosFijosModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const mesAbierto = mesSeleccionado?.estado === 'abierto';
    const mesId = mesSeleccionado?.id;

    const mesHook = useGastosFijosMes(mesId);

    const cuentasFlat = useFlatList(cuentasService);
    useEffect(() => { cuentasFlat.fetch(); }, []);

    const dialogState = useDialogState(
        gastosFijosService,
        { nombre: '', monto_estimado: '', cuenta_id: '', categoria: '' },
        {
            onSuccess: [() => mesHook.refresh()],
            validate: (data) => validateForm(data, {
                nombre: { required: true, maxLength: 255, label: 'El nombre' },
                monto_estimado: { type: 'number', min: 0, label: 'El monto estimado' },
            }),
        },
    );

    // Dialog de pago (controlado)
    const [pagoOpen, setPagoOpen] = useState(false);
    const [gastoFijoSeleccionado, setGastoFijoSeleccionado] = useState(null);
    const [pagoMonto, setPagoMonto] = useState('');
    const [pagoCuentaId, setPagoCuentaId] = useState('');
    const [pagoFecha, setPagoFecha] = useState('');
    const [pagoErrors, setPagoErrors] = useState(null);
    const [pagoSaving, setPagoSaving] = useState(false);

    // Dialog deshacer pago
    const [deshacerOpen, setDeshacerOpen] = useState(false);
    const [gastoDeshacer, setGastoDeshacer] = useState(null);
    const [deshacerLoading, setDeshacerLoading] = useState(false);

    // Dialog desactivar (eliminar del catálogo)
    const [desactivarOpen, setDesactivarOpen] = useState(false);
    const [gastoDesactivar, setGastoDesactivar] = useState(null);
    const [desactivarLoading, setDesactivarLoading] = useState(false);

    // Snackbars
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // --- Pago ---
    const handleOpenPago = (item) => {
        setGastoFijoSeleccionado(item);
        const estimado = item.monto_estimado !== null && item.monto_estimado !== undefined && item.monto_estimado !== ''
            ? String(parseFloat(item.monto_estimado))
            : '';
        setPagoMonto(estimado);
        setPagoCuentaId(item.cuenta_id || '');
        setPagoFecha(hoyParaInput());
        setPagoErrors(null);
        setPagoOpen(true);
    };

    const handleClosePago = () => {
        setPagoOpen(false);
        setGastoFijoSeleccionado(null);
        setPagoErrors(null);
    };

    const handleSavePago = async () => {
        const clientErrors = validateForm(
            { monto: pagoMonto, cuenta_id: pagoCuentaId, fecha: pagoFecha },
            {
                monto: { required: true, type: 'number', positive: true, label: 'El monto' },
                cuenta_id: { required: true, label: 'La cuenta' },
                fecha: { required: true, label: 'La fecha' },
            },
        );
        if (clientErrors) {
            setPagoErrors(clientErrors);
            return;
        }

        setPagoSaving(true);
        setPagoErrors(null);
        try {
            await gastosFijosService.pagar(gastoFijoSeleccionado.id, {
                monto: parseFloat(pagoMonto),
                fecha: pagoFecha,
                cuenta_id: parseInt(pagoCuentaId),
            });
            handleClosePago();
            mesHook.refresh();
            setSuccessMsg('Pago registrado. Se generó el movimiento real.');
        } catch (err) {
            const serverErrors = err.response?.data?.errors
                || { general: err.response?.data?.message || 'Error al registrar el pago.' };
            setPagoErrors(serverErrors);
        } finally {
            setPagoSaving(false);
        }
    };

    // --- Deshacer pago ---
    const handleOpenDeshacer = (item) => {
        setGastoDeshacer(item);
        setDeshacerOpen(true);
    };

    const handleConfirmDeshacer = async () => {
        setDeshacerLoading(true);
        try {
            await gastosFijosService.deshacerPago(gastoDeshacer.id, mesId);
            setDeshacerOpen(false);
            setGastoDeshacer(null);
            mesHook.refresh();
            setSuccessMsg('Pago deshecho correctamente.');
        } catch (err) {
            setDeshacerOpen(false);
            setErrorMsg(err.response?.data?.message || 'Error al deshacer el pago.');
        } finally {
            setDeshacerLoading(false);
        }
    };

    // --- Desactivar (eliminar del catálogo) ---
    const handleOpenDesactivar = (item) => {
        setGastoDesactivar(item);
        setDesactivarOpen(true);
    };

    const handleConfirmDesactivar = async () => {
        setDesactivarLoading(true);
        try {
            await gastosFijosService.desactivar(gastoDesactivar.id);
            setDesactivarOpen(false);
            setGastoDesactivar(null);
            mesHook.refresh();
            setSuccessMsg('Gasto fijo eliminado correctamente.');
        } catch (err) {
            setDesactivarOpen(false);
            setErrorMsg(err.response?.data?.message || 'Error al eliminar el gasto fijo.');
        } finally {
            setDesactivarLoading(false);
        }
    };

    // Wrapper para snackbar tras crear/editar el catálogo
    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const res = await dialogState.save(transform);
            if (res) setSuccessMsg(dialogState.formData?.id ? 'Gasto fijo actualizado.' : 'Gasto fijo creado correctamente.');
            return res;
        },
    };

    return (
        <Box>
            <GastosFijosView
                items={mesHook.items}
                totales={mesHook.totales}
                loading={mesHook.loading}
                mesAbierto={mesAbierto}
                onNew={dialogState.openNew}
                onEdit={dialogState.openEdit}
                onDesactivar={handleOpenDesactivar}
                onPagar={handleOpenPago}
                onDeshacer={handleOpenDeshacer}
            />

            <GastoFijoDialog
                dialogState={wrappedDialogState}
                cuentas={cuentasFlat.items}
            />

            <RegistrarPagoDialog
                open={pagoOpen}
                gastoFijo={gastoFijoSeleccionado}
                cuentas={cuentasFlat.items}
                monto={pagoMonto}
                onMontoChange={setPagoMonto}
                cuentaId={pagoCuentaId}
                onCuentaChange={setPagoCuentaId}
                fecha={pagoFecha}
                onFechaChange={setPagoFecha}
                errors={pagoErrors}
                saving={pagoSaving}
                onSave={handleSavePago}
                onClose={handleClosePago}
            />

            <ConfirmDialog
                open={deshacerOpen}
                title="Deshacer Pago"
                message={`¿Deshacer el pago de "${gastoDeshacer?.nombre}"? Se eliminará el movimiento generado.`}
                confirmLabel="Deshacer"
                confirmColor="warning"
                loading={deshacerLoading}
                onConfirm={handleConfirmDeshacer}
                onCancel={() => { setDeshacerOpen(false); setGastoDeshacer(null); }}
            />

            <ConfirmDialog
                open={desactivarOpen}
                title="Eliminar Gasto Fijo"
                message={`¿Eliminar el gasto fijo "${gastoDesactivar?.nombre}" del catálogo? Dejará de aparecer en los meses futuros.`}
                confirmLabel="Eliminar"
                confirmColor="error"
                loading={desactivarLoading}
                onConfirm={handleConfirmDesactivar}
                onCancel={() => { setDesactivarOpen(false); setGastoDesactivar(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
            <ErrorSnackbar
                message={errorMsg || mesHook.error}
                onClose={() => { setErrorMsg(''); mesHook.clearError(); }}
            />
        </Box>
    );
}
