/**
 * Tema MUI personalizado para Finanzas Personales.
 *
 * Dirección de diseño: "fintech confiable" — azul de confianza, verde para ingresos,
 * rojo para egresos, neutros suaves, tipografía IBM Plex Sans, esquinas redondeadas
 * y sombras suaves. Pensado para usuarios no técnicos: claro, prolijo e intuitivo.
 *
 * Colores definidos como tokens del tema; nunca usar hex directamente en componentes.
 *
 * @module styles/theme
 */
import { createTheme } from '@mui/material';

const BRAND = {
    blue: '#2563EB',
    blueDark: '#1E40AF',
    blueLight: '#60A5FA',
    teal: '#0D9488',
    emerald: '#059669',
    emeraldLight: '#34D399',
    red: '#DC2626',
    redLight: '#F87171',
    amber: '#D97706',
};

/**
 * Tema MUI de la aplicación.
 */
export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: BRAND.blue,
            dark: BRAND.blueDark,
            light: BRAND.blueLight,
            contrastText: '#ffffff',
        },
        secondary: {
            main: BRAND.teal,
            contrastText: '#ffffff',
        },
        success: {
            main: BRAND.emerald,
            light: BRAND.emeraldLight,
        },
        warning: {
            main: BRAND.amber,
        },
        error: {
            main: BRAND.red,
            light: BRAND.redLight,
        },
        background: {
            default: '#F1F5F9',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#0F172A',
            secondary: '#64748B',
        },
        divider: '#E2E8F0',
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"IBM Plex Sans", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600 },
        subtitle1: { color: '#64748B' },
        subtitle2: { fontWeight: 600 },
        button: { fontWeight: 600 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#F1F5F9',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    paddingInline: 18,
                    paddingBlock: 8,
                },
                containedPrimary: {
                    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.25)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.30)',
                    },
                },
            },
        },
        MuiCard: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
                    transition: 'box-shadow 200ms ease, transform 200ms ease',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: 'none',
                },
                outlined: {
                    borderColor: '#E2E8F0',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#FFFFFF',
                    borderRight: '1px solid #E2E8F0',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    marginInline: 8,
                    marginBlock: 2,
                    paddingBlock: 9,
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(37, 99, 235, 0.10)',
                        '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.16)',
                        },
                    },
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#F8FAFC',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #E2E8F0',
                },
                body: {
                    borderBottom: '1px solid #F1F5F9',
                    paddingTop: 12,
                    paddingBottom: 12,
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#F8FAFC',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#0F172A',
                    fontSize: '0.75rem',
                    borderRadius: 8,
                    paddingInline: 10,
                    paddingBlock: 6,
                },
            },
        },
    },
});
