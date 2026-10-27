/**
 * Componente principal de la aplicación.
 * Combina providers, rutas y el bootstrap inicial.
 *
 * @module app/App
 */
import React, { useEffect } from 'react';
import Providers from './providers';
import AppRoutes from './routes';
import { bootstrapApp } from './bootstrap';

/**
 * Raíz de la aplicación.
 *
 * @returns {JSX.Element}
 */
export default function App() {
    useEffect(() => {
        bootstrapApp();
    }, []);

    return (
        <Providers>
            <AppRoutes />
        </Providers>
    );
}
