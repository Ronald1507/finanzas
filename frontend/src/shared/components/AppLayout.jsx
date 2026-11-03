/**
 * Layout principal de la aplicación con barra lateral de navegación.
 *
 * @module shared/components/AppLayout
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    useMediaQuery,
    useTheme,
    Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LockIcon from '@mui/icons-material/Lock';
import { APP_CONFIG } from '../../config/app.config';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
    { label: 'Dashboard', path: APP_CONFIG.ROUTES.DASHBOARD, icon: <DashboardIcon /> },
    { label: 'Cuentas', path: APP_CONFIG.ROUTES.CUENTAS, icon: <AccountBalanceIcon /> },
    { label: 'Movimientos', path: APP_CONFIG.ROUTES.MOVIMIENTOS, icon: <SwapHorizIcon /> },
    { label: 'Pendientes', path: APP_CONFIG.ROUTES.PENDIENTES, icon: <PendingActionsIcon /> },
    { label: 'Cierre Mensual', path: APP_CONFIG.ROUTES.MESES, icon: <LockIcon /> },
];

/**
 * Layout principal con AppBar, drawer lateral y área de contenido.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido de la página
 * @returns {JSX.Element}
 */
export default function AppLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) setDrawerOpen(false);
    };

    const drawerContent = (
        <Box sx={{ width: DRAWER_WIDTH }}>
            <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #2563EB 0%, #0D9488 100%)',
                        color: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <AccountBalanceWalletIcon fontSize="small" />
                </Box>
                <Box sx={{ lineHeight: 1.1, overflow: 'hidden' }}>
                    <Typography variant="subtitle1" noWrap fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                        Finanzas
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.3 }}>
                        Personales
                    </Typography>
                </Box>
            </Toolbar>
            <Divider />
            <Typography
                variant="caption"
                sx={{ px: 3, pt: 2, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600, letterSpacing: '0.06em' }}
            >
                MENÚ
            </Typography>
            <List>
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path === APP_CONFIG.ROUTES.DASHBOARD && location.pathname === '/');
                    return (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                selected={isActive}
                                onClick={() => handleNavigation(item.path)}
                                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <ListItemIcon
                                    sx={{ color: isActive ? 'primary.main' : 'text.secondary' }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? 'primary.main' : 'text.primary',
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    display: { md: 'none' },
                }}
                elevation={1}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(true)}
                        id="app-layout-btn-menu"
                        data-testid="app-layout-btn-menu"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap ml={1}>
                        {APP_CONFIG.APP_NAME}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Drawer permanente en desktop */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? drawerOpen : true}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Contenido principal */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: { xs: 8, md: 0 },
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
