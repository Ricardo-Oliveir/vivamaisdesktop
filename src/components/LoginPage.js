// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, Button, Typography, Paper } from '@mui/material';
import bcrypt from 'bcryptjs';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function LoginPage({ onLoginSuccess }) {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!loginInput.trim()) {
            setError('Por favor, digite seu usuário');
            return;
        }

        if (!password) {
            setError('Por favor, digite sua senha');
            return;
        }

        try {
            // Buscar usuário no Firestore
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef, 
                where('username', '==', loginInput.toLowerCase())
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Usuário não encontrado ou inativo.');
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Verificar a senha usando bcrypt
            const isValidPassword = await bcrypt.compare(password, userData.password_hash);

            if (!isValidPassword) {
                setError('Senha incorreta.');
                return;
            }

            // Login bem sucedido
            const userInfo = {
                id: userDoc.id,
                email: userData.email,
                role: userData.role,
                fullName: userData.full_name,
            };

            onLoginSuccess(userInfo);
            navigate('/dashboard');

        } catch (err) {
            setError('Erro ao fazer login. Tente novamente.');
            console.error('Erro no login:', err.message);
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