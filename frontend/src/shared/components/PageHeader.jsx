/**
 * Encabezado de página con título y slot de acción.
 *
 * @module shared/components/PageHeader
 */
import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Componente de encabezado de página reutilizable.
 *
 * @param {Object} props
 * @param {string} props.title - Título de la página
 * @param {React.ReactNode} [props.action] - Botón o elemento de acción
 * @param {React.ReactNode} [props.subtitle] - Subtítulo opcional
 * @returns {JSX.Element}
 */
export default function PageHeader({ title, action, subtitle }) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2,
            }}
        >
            <Box>
                <Typography variant="h5" component="h1">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action && <Box>{action}</Box>}
        </Box>
    );
}
