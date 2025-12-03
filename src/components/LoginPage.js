// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

// --- MUDANÇA AQUI: Importando o seu logo PNG ---
// Certifique-se que o arquivo está na pasta 'src'
import logo from '../img/logo-sem-fundo.png'; 

import api from '../services/api'; 

function LoginPage({ onLoginSuccess }) {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const styles = {
        pageBackground: {
            backgroundColor: '#FFFFFF',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        paper: {
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'none',
        },
        logoContainer: {
            width: '140px', // Aumentei um pouco para o PNG caber bem
            height: '140px',
            borderRadius: '50%',
            border: '3px solid #2E7D32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            backgroundColor: '#fff', // Fundo branco para garantir que o PNG apareça bem
            overflow: 'hidden'
        },
        logoImage: {
            width: '100px', // Tamanho interno da imagem
            height: 'auto',
            objectFit: 'contain'
        },
        input: {
            marginBottom: '16px',
            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
        },
        primaryButton: {
            backgroundColor: '#2E7D32',
            color: '#FFF',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '16px',
            '&:hover': { backgroundColor: '#1B5E20' }
        },
        secondaryButton: {
            marginTop: '12px',
            color: '#4A90E2',
            textTransform: 'none',
            fontWeight: 'bold'
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!loginInput.trim() || !password) {
            setError('Preencha usuário e senha');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/login', {
                username: loginInput.toLowerCase(),
                password: password
            });

            const data = response.data;

            if (data.token) {
                const userData = {
                    token: data.token,
                    ...data.user
                };
                localStorage.setItem('user_data', JSON.stringify(userData));
                if (onLoginSuccess) onLoginSuccess(userData);
                navigate('/dashboard');
            } else {
                setError('Erro: Servidor não enviou token.');
            }

        } catch (err) {
            console.error('Erro no login:', err);
            const msg = err.response?.data?.error || 'Usuário ou senha incorretos.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box style={styles.pageBackground}>
            <Paper elevation={0} style={styles.paper}>
                
                {/* Container do Logo */}
                <Box style={styles.logoContainer}>
                    <img 
                        src={logo} 
                        alt="Logo VivaMais" 
                        style={styles.logoImage} 
                    />
                </Box>

                <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 1, color: '#2E7D32' }}>
                    VivaMais
                </Typography>
                
                <Typography variant="body1" align="center" sx={{ color: '#6C757D', mb: 4 }}>
                    Bem-vindo! Digite suas credenciais.
                </Typography>

                <form onSubmit={handleLogin}>
                    <TextField
                        label="Usuário"
                        variant="outlined"
                        fullWidth
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        sx={styles.input}
                    />

                    <TextField
                        label="Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={styles.input}
                    />

                    {error && (
                        <Typography color="error" align="center" sx={{ mt: 1, fontWeight: 'bold' }}>
                            {error}
                        </Typography>
                    )}

                    <Button 
                        type="submit" 
                        fullWidth 
                        disabled={loading}
                        sx={styles.primaryButton}
                    >
                        {loading ? 'Entrando...' : 'ENTRAR'}
                    </Button>

                    <Button 
                        fullWidth 
                        onClick={() => navigate('/register')}
                        sx={styles.secondaryButton}
                    >
                        Criar Nova Conta
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}

export default LoginPage;