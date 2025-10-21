// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Button, Typography, Paper } from '@mui/material';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage({ onLoginSuccess }) {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        const emailParaLogin = loginInput.toLowerCase() === 'admin' 
            ? 'admin@vivamais.com' 
            : loginInput;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailParaLogin, password);
            const user = userCredential.user;

            const userData = {
                id: user.uid,
                email: user.email,
                role: 'admin',
                fullName: user.displayName || user.email,
            };
            
            onLoginSuccess(userData);
            navigate('/dashboard');
        } catch (err) {
            setError('Credenciais inválidas.');
            console.error('Erro no login com Firebase:', err.message);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ padding: 4, textAlign: 'center', borderRadius: 4 }}>
                    <Typography variant="h5" component="h1" gutterBottom>Painel Administrativo</Typography>
                    <Box component="form" onSubmit={handleLogin}>
                        <TextField label="Utilizador ou Email" type="text" variant="outlined" fullWidth margin="normal" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} required />
                        <TextField label="Senha" type="password" variant="outlined" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                        <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 2, py: 1.5 }}>Entrar</Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default LoginPage;