/**
 * Vista de listado de meses con acciones de cierre y reapertura.
 *
 * @module features/CierreMensual/views/MesesListView
 */
import React from 'react';
import { Box, Button, Chip, Tooltip, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import { formatearFecha, formatearMes } from '../../../shared/utils/formatearFecha';

/**
 * Vista de listado de meses.
 *
 * @param {Object} props
 * @param {Array} props.meses - Lista de meses
 * @param {boolean} props.loading - Indicador de carga
 * @param {Function} props.onCerrar - Callback para cerrar (recibe mes)
 * @param {Function} props.onReabrir - Callback para reabrir (recibe mes)
 * @returns {JSX.Element}
 */
export default function MesesListView({ meses, loading, onCerrar, onReabrir }) {
    // Identificar el mes abierto y el último cerrado
    const mesAbierto = meses.find((m) => m.estado === 'abierto');
    const mesesCerrados = meses.filter((m) => m.estado === 'cerrado');
    const ultimoCerrado = mesesCerrados.length > 0
        ? mesesCerrados[mesesCerrados.length - 1]
        : null;

    const columns = [
        {
            label: 'Mes',
            key: 'mes',
            render: (row) => formatearMes(row.anio, row.mes),
        },
        {
            label: 'Estado',
            key: 'estado',
            render: (row) => (
                <Chip
                    label={row.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                    color={row.estado === 'abierto' ? 'success' : 'default'}
                    size="small"
                    icon={row.estado === 'cerrado' ? <LockIcon sx={{ fontSize: 14 }} /> : undefined}
                />
            ),
        },
        {
            label: 'Fecha de Cierre',
            key: 'fecha_cierre',
            hideOnMobile: true,
            render: (row) => row.fecha_cierre ? formatearFecha(row.fecha_cierre) : '-',
        },
    ];

    const extraAcciones = [
        {
            label: 'Cerrar mes',
            icon: <LockIcon fontSize="small" />,
            color: 'warning',
            onClick: onCerrar,
            disabled: (item) => item.id !== mesAbierto?.id,
        },
        {
            label: 'Reabrir mes',
            icon: <LockOpenIcon fontSize="small" />,
            color: 'primary',
            onClick: onReabrir,
            disabled: (item) => item.id !== ultimoCerrado?.id,
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Cierre Mensual"
                subtitle="Gestiona el cierre y reapertura de meses"
            />
            <DataTable
                columns={columns}
                items={meses}
                loading={loading}
                extraActions={extraAcciones}
                emptyMessage="No hay meses registrados. Crea una cuenta para inicializar el primer mes."
            />
        </Box>
    );
}
