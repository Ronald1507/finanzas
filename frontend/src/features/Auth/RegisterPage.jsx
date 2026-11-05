import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { authService } from './services/authService';
import useAuthStore from '../../shared/hooks/useAuthStore';

export default function RegisterPage() {
    const navigate = useNavigate();
    const login    = useAuthStore((s) => s.login);
    const [form, setForm]     = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await authService.register(form);
            if (res.success) {
                login(res.data);
                navigate('/');
            }
        } catch (err) {
            const msgs = err.response?.data?.errors;
            if (msgs) {
                setError(Object.values(msgs).flat().join(' '));
            } else {
                setError(err.response?.data?.message || 'No se pudo crear la cuenta.');
            }
        } finally {
            setLoading(false);
        }
    };

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
            <Card sx={{ width: '100%', maxWidth: 400 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={700} mb={3}>Crear cuenta</Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField label="Nombre" value={form.name} onChange={set('name')} required fullWidth />
                        <TextField label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth />
                        <TextField label="Contraseña" type="password" value={form.password} onChange={set('password')} required fullWidth />
                        <TextField label="Confirmar contraseña" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} required fullWidth />
                        <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                            {loading ? 'Registrando…' : 'Registrarse'}
                        </Button>
                    </Box>
                    <Typography variant="body2" mt={2} textAlign="center">
                        ¿Ya tenés cuenta?{' '}
                        <Link to="/login" style={{ color: 'inherit' }}>Iniciar sesión</Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
