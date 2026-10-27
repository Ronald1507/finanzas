/**
 * Orquestador del módulo Gestión de Cuentas.
 * Compone hooks, views, dialogs y snackbars sin JSX de UI directa.
 *
 * @module features/GestionCuentas/CuentasModule
 */
import React, { useState } from 'react';
import { Box } from '@mui/material';
import useCrudList from '../../shared/hooks/useCrudList';
import useDialogState from '../../shared/hooks/useDialogState';
import useMesStore from '../../shared/hooks/useMesStore';
import { cuentasService } from './services/cuentasService';
import CuentasListView from './views/CuentasListView';
import CuentaDialog from './components/CuentaDialog';
import SaldoInicialDialog from './components/SaldoInicialDialog';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';
import { validateForm } from '../../shared/utils/validateForm';
import { mesesService } from '../CierreMensual/services/mesesService';

/**
 * Orquestador del módulo de cuentas bancarias.
 *
 * @returns {JSX.Element}
 */
export default function CuentasModule() {
    const mesSeleccionado = useMesStore((s) => s.mesSeleccionado);
    const cargarMeses = useMesStore((s) => s.cargarMeses);
    const mesAbierto = mesSeleccionado?.estado === 'abierto';

    const [activaFilter, setActivaFilter] = useState('');

    const listHook = useCrudList({
        service: cuentasService,
        active: true,
        params: { activa: activaFilter },
    });

    const dialogState = useDialogState(
        cuentasService,
        { nombre: '', banco: '', tipo: '', saldo_inicial: '' },
        {
            onSuccess: [
                () => listHook.refresh(),
                // Recargar meses: si fue la primera cuenta, el backend bootstrapeó el primer mes.
                () => cargarMeses(mesesService.getList),
            ],
            validate: (data) => validateForm(data, {
                nombre: { required: true, maxLength: 100, label: 'El nombre' },
                tipo: { required: true, label: 'El tipo de cuenta' },
                saldo_inicial: { type: 'number', min: 0, label: 'El saldo inicial' },
            }),
        },
    );

    // Estado del dialog de saldo inicial
    const [saldoInicialOpen, setSaldoInicialOpen] = useState(false);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
    const [saldoInicialValue, setSaldoInicialValue] = useState('');
    const [saldoInicialErrors, setSaldoInicialErrors] = useState(null);
    const [saldoInicialSaving, setSaldoInicialSaving] = useState(false);

    // Estado del dialog de desactivar
    const [desactivarOpen, setDesactivarOpen] = useState(false);
    const [cuentaDesactivar, setCuentaDesactivar] = useState(null);
    const [desactivarLoading, setDesactivarLoading] = useState(false);

    // Snackbars
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleOpenSaldoInicial = (cuenta) => {
        setCuentaSeleccionada(cuenta);
        setSaldoInicialValue(cuenta.saldo_inicial ?? '');
        setSaldoInicialErrors(null);
        setSaldoInicialOpen(true);
    };

    const handleSaveSaldoInicial = async () => {
        setSaldoInicialSaving(true);
        setSaldoInicialErrors(null);
        try {
            await cuentasService.updateSaldoInicial(cuentaSeleccionada.id, parseFloat(saldoInicialValue) || 0);
            setSaldoInicialOpen(false);
            setCuentaSeleccionada(null);
            listHook.refresh();
            setSuccessMsg('Saldo inicial actualizado correctamente.');
        } catch (err) {
            const serverErrors = err.response?.data?.errors
                || { general: err.response?.data?.message || 'Error al actualizar el saldo inicial.' };
            setSaldoInicialErrors(serverErrors);
        } finally {
            setSaldoInicialSaving(false);
        }
    };

    const handleOpenDesactivar = (cuenta) => {
        setCuentaDesactivar(cuenta);
        setDesactivarOpen(true);
    };

    const handleDesactivar = async () => {
        setDesactivarLoading(true);
        try {
            await cuentasService.desactivar(cuentaDesactivar.id);
            setDesactivarOpen(false);
            setCuentaDesactivar(null);
            listHook.refresh();
            setSuccessMsg('Cuenta desactivada correctamente.');
        } catch (err) {
            setDesactivarOpen(false);
            const msg = err.response?.data?.errors?.cuenta?.[0]
                || err.response?.data?.message
                || 'No se pudo desactivar la cuenta.';
            setErrorMsg(msg);
        } finally {
            setDesactivarLoading(false);
        }
    };

    const handleSaveSuccess = () => {
        setSuccessMsg(dialogState.formData?.id ? 'Cuenta actualizada.' : 'Cuenta creada correctamente.');
    };

    // Sobreescribir onSuccess del dialogState para mostrar snackbar
    const wrappedDialogState = {
        ...dialogState,
        save: async (transform) => {
            const res = await dialogState.save(transform);
            if (res) handleSaveSuccess();
            return res;
        },
    };

    return (
        <Box>
            <CuentasListView
                listHook={listHook}
                activaFilter={activaFilter}
                onActivaFilterChange={setActivaFilter}
                onNew={dialogState.openNew}
                onEdit={dialogState.openEdit}
                onSaldoInicial={handleOpenSaldoInicial}
                onDesactivar={handleOpenDesactivar}
                mesAbierto={mesAbierto}
            />

            <CuentaDialog dialogState={wrappedDialogState} />

            <SaldoInicialDialog
                open={saldoInicialOpen}
                cuenta={cuentaSeleccionada}
                saldoInicial={saldoInicialValue}
                onSaldoChange={setSaldoInicialValue}
                errors={saldoInicialErrors}
                saving={saldoInicialSaving}
                onSave={handleSaveSaldoInicial}
                onClose={() => { setSaldoInicialOpen(false); setCuentaSeleccionada(null); setSaldoInicialErrors(null); }}
            />

            <ConfirmDialog
                open={desactivarOpen}
                title="Desactivar Cuenta"
                message={`¿Desactivar la cuenta "${cuentaDesactivar?.nombre}"? Esta acción no puede revertirse si hay pendientes activos.`}
                confirmLabel="Desactivar"
                confirmColor="warning"
                loading={desactivarLoading}
                onConfirm={handleDesactivar}
                onCancel={() => { setDesactivarOpen(false); setCuentaDesactivar(null); }}
            />

            <SuccessSnackbar
                message={successMsg}
                onClose={() => setSuccessMsg('')}
            />
            <ErrorSnackbar
                message={errorMsg || listHook.error}
                onClose={() => { setErrorMsg(''); listHook.clearError(); }}
            />
        </Box>
    );
}
