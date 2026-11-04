/**
 * Vista de búsqueda global de movimientos (cross-mes).
 * Estado propio: formulario de filtros + resultados.
 *
 * @module features/Movimientos/views/BuscarMovimientosView
 */
import { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Grid,
    TextField,
    Chip,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import ComboBox from '../../../shared/components/ComboBox';
import { formatearFecha, formatearMes } from '../../../shared/utils/formatearFecha';
import { formatearMoneda } from '../../../shared/utils/formatearMoneda';
import { movimientosService } from '../services/movimientosService';

const TIPO_CHIP = {
    ingreso: { label: 'Ingreso', color: 'success' },
    egreso: { label: 'Egreso', color: 'error' },
};

const EMPTY_FILTERS = {
    q: '',
    categoria_id: '',
    tipo: '',
    cuenta_id: '',
    fecha_desde: '',
    fecha_hasta: '',
};

/**
 * @param {Object} props
 * @param {Array} props.cuentas
 * @param {Array} props.categorias
 */
export default function BuscarMovimientosView({ cuentas = [], categorias = [] }) {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [searched, setSearched] = useState(false);

    const setField = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

    const doSearch = useCallback(async (currentPage = 1, overrideFilters) => {
        setLoading(true);
        setError('');
        try {
            const f = overrideFilters ?? filters;
            const res = await movimientosService.buscar({ ...f, page: currentPage });
            setItems(res.data?.data || []);
            setTotalPages(res.data?.meta?.last_page || 1);
            setTotal(res.data?.meta?.total || 0);
            setPage(currentPage);
            setSearched(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al buscar movimientos.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const columns = [
        {
            label: 'Fecha',
            key: 'fecha',
            render: (row) => formatearFecha(row.fecha),
        },
        {
            label: 'Descripción',
            key: 'descripcion',
        },
        {
            label: 'Tipo',
            key: 'tipo',
            render: (row) => {
                const c = TIPO_CHIP[row.tipo] || { label: row.tipo, color: 'default' };
                return <Chip label={c.label} color={c.color} size="small" variant="outlined" />;
            },
        },
        {
            label: 'Cuenta',
            key: 'cuenta',
            hideOnMobile: true,
            render: (row) => row.cuenta?.nombre || '-',
        },
        {
            label: 'Categoría',
            key: 'categoria',
            hideOnMobile: true,
            render: (row) => row.categoria ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: row.categoria.color || '#9E9E9E',
                        flexShrink: 0,
                    }} />
                    {row.categoria.nombre}
                </Box>
            ) : '-',
        },
        {
            label: 'Monto',
            key: 'monto',
            render: (row) => formatearMoneda(row.monto),
        },
        {
            label: 'Mes',
            key: 'mes',
            render: (row) => row.mes ? formatearMes(row.mes.anio, row.mes.mes) : '-',
        },
    ];

    return (
        <Box>
            <PageHeader title="Buscar Movimientos" subtitle="Búsqueda en toda la historia" />

            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2, border: 1, borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Texto libre"
                            size="small"
                            fullWidth
                            value={filters.q}
                            onChange={(e) => setField('q', e.target.value)}
                            placeholder="Descripción u observación..."
                            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(1); }}
                            id="buscar-input-q"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <ComboBox
                            label="Categoría"
                            size="small"
                            placeholder="Todas"
                            options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                            value={filters.categoria_id}
                            onChange={(v) => setField('categoria_id', v)}
                            testId="buscar-select-categoria"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <ComboBox
                            label="Tipo"
                            size="small"
                            placeholder="Todos"
                            options={[
                                { value: 'ingreso', label: 'Ingreso' },
                                { value: 'egreso', label: 'Egreso' },
                            ]}
                            value={filters.tipo}
                            onChange={(v) => setField('tipo', v)}
                            testId="buscar-select-tipo"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <ComboBox
                            label="Cuenta"
                            size="small"
                            placeholder="Todas"
                            options={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
                            value={filters.cuenta_id}
                            onChange={(v) => setField('cuenta_id', v)}
                            testId="buscar-select-cuenta"
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            label="Desde"
                            type="date"
                            size="small"
                            fullWidth
                            value={filters.fecha_desde}
                            onChange={(e) => setField('fecha_desde', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            id="buscar-input-fecha-desde"
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={1.5}>
                        <TextField
                            label="Hasta"
                            type="date"
                            size="small"
                            fullWidth
                            value={filters.fecha_hasta}
                            onChange={(e) => setField('fecha_hasta', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            id="buscar-input-fecha-hasta"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={() => doSearch(1)}
                            disabled={loading}
                            fullWidth
                            id="buscar-btn-buscar"
                            data-testid="buscar-btn-buscar"
                        >
                            Buscar
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <DataTable
                columns={columns}
                items={items}
                loading={loading}
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={(newPage) => doSearch(newPage)}
                emptyMessage={searched ? 'No se encontraron movimientos con esos filtros' : 'Ingresá filtros y presioná Buscar'}
            />
        </Box>
    );
}
