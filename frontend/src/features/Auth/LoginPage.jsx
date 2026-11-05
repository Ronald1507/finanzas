import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { authService } from './services/authService';
import useAuthStore from '../../shared/hooks/useAuthStore';

export default function LoginPage() {
    const navigate  = useNavigate();
    const login     = useAuthStore((s) => s.login);
    const [form, setForm]     = useState({ email: '', password: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authService.login(form);
            if (res.success) {
                login(res.data);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Credenciales incorrectas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Card sx={{ width: '100%', maxWidth: 400 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={700} mb={3}>Iniciar sesión</Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            fullWidth
                        />
                        <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                            {loading ? 'Ingresando…' : 'Ingresar'}
                        </Button>
                    </Box>
                    <Typography variant="body2" mt={2} textAlign="center">
                        ¿No tenés cuenta?{' '}
                        <Link to="/register" style={{ color: 'inherit' }}>Registrarse</Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
