import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import PageHeader from '../../shared/components/PageHeader';
import ResumenMensualView from './views/ResumenMensualView';
import EvolucionAnualView from './views/EvolucionAnualView';
import GastosCategoriaView from './views/GastosCategoriaView';

export default function ReportesModule() {
    const [tab, setTab] = useState(0);

    return (
        <Box>
            <PageHeader title="Reportes" subtitle="Análisis de ingresos, egresos y evolución" />
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Resumen mensual" />
                <Tab label="Evolución anual" />
                <Tab label="Gastos por categoría" />
            </Tabs>
            {tab === 0 && <ResumenMensualView />}
            {tab === 1 && <EvolucionAnualView />}
            {tab === 2 && <GastosCategoriaView />}
        </Box>
    );
}
