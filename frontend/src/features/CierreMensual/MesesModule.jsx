/**
 * Orquestador del módulo CierreMensual.
 *
 * @module features/CierreMensual/MesesModule
 */
import React, { useState } from 'react';
import { Box } from '@mui/material';
import useMeses from './hooks/useMeses';
import MesesListView from './views/MesesListView';
import CerrarMesDialog from './components/CerrarMesDialog';
import ReabrirMesDialog from './components/ReabrirMesDialog';
import SuccessSnackbar from '../../shared/components/SuccessSnackbar';
import ErrorSnackbar from '../../shared/components/ErrorSnackbar';

/**
 * Orquestador del módulo de cierre mensual.
 *
 * @returns {JSX.Element}
 */
export default function MesesModule() {
    const { meses, loading, cerrando, reabriendo, cerrar, reabrir } = useMeses();

    // Cerrar dialog
    const [cerrarOpen, setCerrarOpen] = useState(false);
    const [mesCerrar, setMesCerrar] = useState(null);
    const [cerrarError, setCerrarError] = useState(null);

    // Reabrir dialog
    const [reabrirOpen, setReabrirOpen] = useState(false);
    const [mesReabrir, setMesReabrir] = useState(null);
    const [reabrirError, setReabrirError] = useState(null);

    // Snackbars
    const [successMsg, setSuccessMsg] = useState('');

    const handleOpenCerrar = (mes) => {
        setMesCerrar(mes);
        setCerrarError(null);
        setCerrarOpen(true);
    };

    const handleConfirmCerrar = async () => {
        setCerrarError(null);
        const res = await cerrar(mesCerrar.id);
        if (res.success) {
            setCerrarOpen(false);
            setMesCerrar(null);
            setSuccessMsg('Mes cerrado correctamente. Se creó el mes siguiente.');
        } else {
            setCerrarError(res.message);
        }
    };

    const handleOpenReabrir = (mes) => {
        setMesReabrir(mes);
        setReabrirError(null);
        setReabrirOpen(true);
    };

    const handleConfirmReabrir = async () => {
        setReabrirError(null);
        const res = await reabrir(mesReabrir.id);
        if (res.success) {
            setReabrirOpen(false);
            setMesReabrir(null);
            setSuccessMsg('Mes reabierto correctamente.');
        } else {
            setReabrirError(res.message);
        }
    };

    return (
        <Box>
            <MesesListView
                meses={meses}
                loading={loading}
                onCerrar={handleOpenCerrar}
                onReabrir={handleOpenReabrir}
            />

            <CerrarMesDialog
                open={cerrarOpen}
                mes={mesCerrar}
                loading={cerrando}
                error={cerrarError}
                onConfirm={handleConfirmCerrar}
                onCancel={() => { setCerrarOpen(false); setMesCerrar(null); setCerrarError(null); }}
            />

            <ReabrirMesDialog
                open={reabrirOpen}
                mes={mesReabrir}
                loading={reabriendo}
                error={reabrirError}
                onConfirm={handleConfirmReabrir}
                onCancel={() => { setReabrirOpen(false); setMesReabrir(null); setReabrirError(null); }}
            />

            <SuccessSnackbar message={successMsg} onClose={() => setSuccessMsg('')} />
        </Box>
    );
}
