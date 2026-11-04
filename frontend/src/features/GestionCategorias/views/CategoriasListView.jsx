import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader';
import FilterToolbar from '../../../shared/components/FilterToolbar';
import DataTable from '../../../shared/components/DataTable';
import ComboBox from '../../../shared/components/ComboBox';

export default function CategoriasListView({
    listHook,
    activaFilter,
    onActivaFilterChange,
    onNew,
    onEdit,
    onDesactivar,
    onActivar,
}) {
    const columns = [
        {
            label: 'Nombre',
            key: 'nombre',
            render: (row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: row.color || '#9E9E9E',
                            border: '1px solid rgba(0,0,0,0.12)',
                            flexShrink: 0,
                        }}
                    />
                    <Typography variant="body2">{row.nombre}</Typography>
                </Box>
            ),
        },
        {
            label: 'Estado',
            key: 'activa',
            render: (row) => (
                <Chip
                    label={row.activa ? 'Activa' : 'Inactiva'}
                    color={row.activa ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
    ];

    const extraAcciones = [
        {
            label: 'Desactivar',
            color: 'warning',
            onClick: onDesactivar,
            disabled: (item) => !item.activa,
        },
        {
            label: 'Activar',
            color: 'success',
            onClick: onActivar,
            disabled: (item) => !!item.activa,
        },
    ];

    const filtroActiva = (
        <ComboBox
            label="Estado"
            size="small"
            placeholder="Todas"
            fullWidth={false}
            sx={{ width: { xs: '100%', sm: 180 } }}
            options={[{ value: 'true', label: 'Activas' }, { value: 'false', label: 'Inactivas' }]}
            value={activaFilter}
            onChange={onActivaFilterChange}
            testId="categorias-select-filtro-activa"
        />
    );

    return (
        <Box>
            <PageHeader
                title="Categorías"
                subtitle="Clasificá tus movimientos por categoría"
                action={
                    <Button
                        variant="contained"
                        onClick={onNew}
                        data-testid="categorias-btn-nueva"
                    >
                        + Nueva Categoría
                    </Button>
                }
            />
            <FilterToolbar
                searchQuery={listHook.searchQuery}
                onSearchChange={listHook.setSearchQuery}
                placeholder="Buscar por nombre..."
                extraFilters={filtroActiva}
            />
            <DataTable
                columns={columns}
                items={listHook.items}
                loading={listHook.loading}
                page={listHook.page}
                totalPages={listHook.totalPages}
                total={listHook.total}
                onPageChange={listHook.setPage}
                onEdit={onEdit}
                extraActions={extraAcciones}
                emptyMessage="No se encontraron categorías"
            />
        </Box>
    );
}
