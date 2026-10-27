/**
 * Tabla de datos reutilizable con paginación, carga y columnas personalizables.
 * Responsive: columnas secundarias ocultas en mobile, acciones siempre visibles.
 *
 * @module shared/components/DataTable
 */
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Skeleton,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Tabla de datos genérica con soporte de paginación y acciones.
 *
 * @param {Object} props
 * @param {Array} props.columns - Definición de columnas [{label, key, render?, hideOnMobile?}]
 * @param {Array} props.items - Datos a mostrar
 * @param {boolean} [props.loading=false] - Indicador de carga
 * @param {number} [props.page=1] - Página actual (1-based)
 * @param {number} [props.totalPages=1] - Total de páginas
 * @param {number} [props.total=0] - Total de registros
 * @param {Function} [props.onPageChange] - Callback al cambiar página
 * @param {Function} [props.onEdit] - Callback al editar (recibe item)
 * @param {Function} [props.onDelete] - Callback al eliminar (recibe id)
 * @param {Array} [props.extraActions] - Acciones adicionales [{label, icon, onClick, color?, disabled?}]
 * @param {string} [props.emptyMessage='No hay registros'] - Mensaje cuando no hay datos
 * @param {number} [props.rowsPerPage=15] - Filas por página
 * @returns {JSX.Element}
 */
export default function DataTable({
    columns = [],
    items = [],
    loading = false,
    page = 1,
    totalPages = 1,
    total = 0,
    onPageChange,
    onEdit,
    onDelete,
    extraActions = [],
    emptyMessage = 'No hay registros',
    rowsPerPage = 15,
}) {
    const tieneAcciones = onEdit || onDelete || extraActions.length > 0;
    const colCount = columns.length + (tieneAcciones ? 1 : 0);

    if (loading) {
        return (
            <Paper>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        sx={col.hideOnMobile ? { display: { xs: 'none', sm: 'table-cell' } } : {}}
                                    >
                                        {col.label}
                                    </TableCell>
                                ))}
                                {tieneAcciones && (
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        Acciones
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, rowIdx) => (
                                <TableRow key={rowIdx}>
                                    {Array.from({ length: colCount }).map((__, colIdx) => (
                                        <TableCell key={colIdx}>
                                            <Skeleton variant="text" animation="wave" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        );
    }

    if (!loading && items.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
            </Paper>
        );
    }

    return (
        <Paper>
            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.key}
                                    sx={col.hideOnMobile ? { display: { xs: 'none', sm: 'table-cell' } } : {}}
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                            {tieneAcciones && (
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    Acciones
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id} hover>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        sx={col.hideOnMobile ? { display: { xs: 'none', sm: 'table-cell' } } : {}}
                                    >
                                        {col.render ? col.render(item) : (item[col.key] ?? '-')}
                                    </TableCell>
                                ))}
                                {tieneAcciones && (
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        {extraActions.map((action) => (
                                            <Tooltip key={action.label} title={action.label}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color={action.color || 'default'}
                                                        onClick={() => action.onClick(item)}
                                                        disabled={action.disabled ? action.disabled(item) : false}
                                                    >
                                                        {action.icon}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        ))}
                                        {onEdit && (
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => onEdit(item)}
                                                    id={`data-table-btn-editar-${item.id}`}
                                                    data-testid={`data-table-btn-editar-${item.id}`}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {onDelete && (
                                            <Tooltip title="Eliminar">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => onDelete(item.id)}
                                                    id={`data-table-btn-eliminar-${item.id}`}
                                                    data-testid={`data-table-btn-eliminar-${item.id}`}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {totalPages > 1 && onPageChange && (
                <TablePagination
                    component="div"
                    count={total}
                    page={page - 1}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[rowsPerPage]}
                    onPageChange={(_, newPage) => onPageChange(newPage + 1)}
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                />
            )}
        </Paper>
    );
}
