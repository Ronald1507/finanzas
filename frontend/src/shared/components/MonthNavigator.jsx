/**
 * Navegador de mes: datepicker de calendario (vistas año/mes) + flechas anterior/siguiente
 * y chip de estado. Conectado al store global useMesStore.
 *
 * El datepicker solo habilita los meses que existen en la secuencia (invariante del
 * backend: meses contiguos, uno solo abierto). Las flechas permiten además avanzar al
 * mes "virtual" siguiente para el estado MesSinDatos del dashboard.
 *
 * @module shared/components/MonthNavigator
 */
import React from 'react';
import { Box, IconButton, Chip, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useMesStore from '../hooks/useMesStore';

/**
 * Componente de navegación por mes.
 * Permite saltar a un mes existente con el datepicker o ir al anterior/siguiente con las flechas.
 *
 * @returns {JSX.Element}
 */
export default function MonthNavigator() {
    const { meses, mesSeleccionado, seleccionarMes, irMesAnterior, irMesSiguiente } = useMesStore();

    if (!mesSeleccionado) return null;

    const idx = meses.findIndex((m) => m.id === mesSeleccionado.id);
    const esPrimero = idx === 0;
    const estado = mesSeleccionado.estado;

    // Valor del datepicker derivado del mes seleccionado (día 1 del mes).
    const valor = dayjs().year(mesSeleccionado.anio).month(mesSeleccionado.mes - 1).date(1);

    const existeMes = (date) => meses.some((m) => m.anio === date.year() && m.mes === date.month() + 1);

    const handleChange = (nuevo) => {
        if (!nuevo || !nuevo.isValid()) return;
        const mes = meses.find((m) => m.anio === nuevo.year() && m.mes === nuevo.month() + 1);
        if (mes) seleccionarMes(mes.id);
    };

    const chipColor = estado === 'abierto'
        ? 'success'
        : estado === 'cerrado'
            ? 'default'
            : 'warning';

    const chipLabel = estado === 'abierto'
        ? 'Abierto'
        : estado === 'cerrado'
            ? 'Cerrado'
            : 'Sin datos';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                flexWrap: 'wrap',
            }}
            id="month-navigator"
            data-testid="month-navigator"
        >
            <Tooltip title="Mes anterior">
                <span>
                    <IconButton
                        size="small"
                        onClick={irMesAnterior}
                        disabled={esPrimero}
                        id="month-navigator-btn-anterior"
                        data-testid="month-navigator-btn-anterior"
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                </span>
            </Tooltip>

            <DatePicker
                views={['year', 'month']}
                openTo="month"
                value={valor}
                onChange={handleChange}
                format="MMMM YYYY"
                shouldDisableMonth={(date) => !existeMes(date)}
                shouldDisableYear={(date) => !meses.some((m) => m.anio === date.year())}
                slotProps={{
                    textField: {
                        size: 'small',
                        sx: { width: 200 },
                        id: 'month-navigator-datepicker',
                        inputProps: { 'data-testid': 'month-navigator-datepicker' },
                    },
                }}
            />

            <Tooltip title="Mes siguiente">
                <span>
                    <IconButton
                        size="small"
                        onClick={irMesSiguiente}
                        id="month-navigator-btn-siguiente"
                        data-testid="month-navigator-btn-siguiente"
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </span>
            </Tooltip>

            <Chip
                label={chipLabel}
                color={chipColor}
                size="small"
                variant="outlined"
                id="month-navigator-chip-estado"
                data-testid="month-navigator-chip-estado"
            />
        </Box>
    );
}
