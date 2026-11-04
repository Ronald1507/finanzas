import { Box, Button, Chip, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import MonthNavigator from '../../../shared/components/MonthNavigator';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';

const ESTADO_CHIP = {
    ok: { label: 'OK', color: 'success' },
    alerta: { label: 'Alerta', color: 'warning' },
    excedido: { label: 'Excedido', color: 'error' },
};

export default function PresupuestosListView({ listHook, onNew, onEdit, onDelete, mesAbierto }) {
    const columns = [
        {
            label: 'Categoría',
            key: 'categoria',
            render: (row) => row.categoria ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{
                        width: 12, height: 12, borderRadius: '50%',
                        bgcolor: row.categoria.color || '#9E9E9E', flexShrink: 0,
                    }} />
                    {row.categoria.nombre}
                </Box>
            ) : '-',
        },
        { label: 'Límite', key: 'monto_limite', render: (row) => formatearMoneda(row.monto_limite) },
        { label: 'Ejecutado', key: 'ejecutado', render: (row) => formatearMoneda(row.ejecutado) },
        {
            label: '% Usado',
            key: 'porcentaje',
            hideOnMobile: true,
            render: (row) => `${row.porcentaje}%`,
        },
        {
            label: 'Estado',
            key: 'estado',
            render: (row) => {
                const c = ESTADO_CHIP[row.estado] || { label: row.estado, color: 'default' };
                return <Chip label={c.label} color={c.color} size="small" />;
            },
        },
    ];

    const extraAcciones = [
        {
            label: 'Editar',
            icon: <EditIcon fontSize="small" />,
            color: 'primary',
            onClick: onEdit,
            disabled: () => !mesAbierto,
        },
        {
            label: 'Eliminar',
            icon: <DeleteIcon fontSize="small" />,
            color: 'error',
            onClick: onDelete,
            disabled: () => !mesAbierto,
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Presupuestos"
                subtitle="Límites de gasto mensual por categoría"
                action={
                    <Tooltip title={!mesAbierto ? 'Mes cerrado' : 'Nuevo presupuesto'}>
                        <span>
                            <Button
                                variant="contained"
                                onClick={onNew}
                                disabled={!mesAbierto}
                                id="presupuestos-btn-nuevo"
                                data-testid="presupuestos-btn-nuevo"
                            >
                                + Nuevo Presupuesto
                            </Button>
                        </span>
                    </Tooltip>
                }
            />
            <MonthNavigator />
            <DataTable
                columns={columns}
                items={listHook.items}
                loading={listHook.loading}
                page={listHook.page}
                totalPages={listHook.totalPages}
                total={listHook.total}
                onPageChange={listHook.setPage}
                extraActions={extraAcciones}
                emptyMessage="No hay presupuestos en este mes"
            />
        </Box>
    );
}
