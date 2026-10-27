/**
 * Barra de filtros centralizada. OBLIGATORIA en toda vista con filtros/tabla.
 * Incluye búsqueda por texto y slot para filtros extra.
 *
 * @module shared/components/FilterToolbar
 */
import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Componente centralizado de filtros para listados.
 *
 * @param {Object} props
 * @param {string} [props.searchQuery=''] - Valor actual de búsqueda
 * @param {Function} [props.onSearchChange] - Callback al cambiar búsqueda
 * @param {string} [props.placeholder='Buscar...'] - Placeholder del campo de búsqueda
 * @param {React.ReactNode} [props.extraFilters] - Filtros adicionales (selects, etc.)
 * @param {boolean} [props.showSearch=true] - Si mostrar el campo de búsqueda
 * @returns {JSX.Element}
 */
export default function FilterToolbar({
    searchQuery = '',
    onSearchChange,
    placeholder = 'Buscar...',
    extraFilters,
    showSearch = true,
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1.5,
                mb: 2.5,
                flexWrap: 'wrap',
                alignItems: 'center',
            }}
        >
            {showSearch && onSearchChange && (
                <TextField
                    size="small"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: 260 } }}
                />
            )}
            {extraFilters}
        </Box>
    );
}
