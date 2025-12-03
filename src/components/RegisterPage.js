// src/components/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert, Container } from '@mui/material';
import axios from 'axios'; // Usaremos axios direto ou sua api.js
import api from '../services/api'; // Usando sua api configurada
import logo from '../logo.svg'; // Certifique-se que o caminho do logo está certo

function RegisterPage() {
    const navigate = useNavigate();
    
    // Estados do Formulário
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Estados de Controle
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- LÓGICA DE NEGÓCIO (Igual ao App) ---
    const generateUsername = (name) => {
        if (!name) return '';
        return name.trim()
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^a-z0-9]/g, '') // Remove especiais
            .substring(0, 30);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        // Validações
        if (!fullName.trim() || fullName.trim().length < 3) {
            return setError('Nome deve ter pelo menos 3 caracteres.');
        }
        if (!password || password.length < 6) {
            return setError('Senha deve ter pelo menos 6 caracteres.');
        }
        if (password !== confirmPassword) {
            return setError('Senhas não coincidem.');
        }

        setLoading(true);

        try {
            const username = generateUsername(fullName);
            const email = `${username}@vivamais.com`;

            // Chama a API de registro
            // Nota: O App envia role='user', vamos manter.
            await api.post('/auth/register', {
                username,
                full_name: fullName.trim(),
                email,
                password,
                role: 'user' 
            });

            setSuccessMsg(`Conta criada! Seu usuário é: "${username}".`);
            
            // Espera 2 segundinhos e manda pro login
            setTimeout(() => {
                navigate('/'); // ou '/login' dependendo da sua rota
            }, 3000);

        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Erro ao criar conta. Tente outro nome.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // --- ESTILOS (Copiados do Login para manter consistência) ---
    const styles = {
        pageBackground: {
            backgroundColor: '#F8F9FA', // Fundo levemente cinza
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        paper: {
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', // Sombra suave
        },
        logoContainer: {
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid #2E7D32',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            backgroundColor: '#fff'
        },
        input: {
            marginBottom: '20px',
            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
        },
        primaryButton: {
            backgroundColor: '#2E7D32',
            color: '#FFF',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '10px',
            textTransform: 'uppercase',
            '&:hover': { backgroundColor: '#1B5E20' }
        },
        secondaryButton: {
            marginTop: '16px',
            color: '#757575',
            textTransform: 'none',
            fontSize: '16px'
        },
        previewBox: {
            backgroundColor: '#E8F5E9', // Verdinho claro
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            borderLeft: '4px solid #2E7D32'
        }
    };

    return (
        <Box style={styles.pageBackground}>
            <Paper elevation={0} style={styles.paper}>
                
                {/* Logo */}
                <Box style={styles.logoContainer}>
                     <img src={logo} alt="Logo" style={{ width: '60px' }} />
                </Box>

                <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 1 }}>
                    Criar Nova Conta
                </Typography>
                <Typography variant="body1" align="center" sx={{ color: '#666', mb: 4 }}>
                    Cadastre-se para usar o sistema
                </Typography>

                {/* Mensagens de Feedback */}
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
                {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{successMsg}</Alert>}

                <form onSubmit={handleRegister}>
                    <TextField
                        label="Nome Completo"
                        variant="outlined"
                        fullWidth
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        sx={styles.input}
                        placeholder="Ex: Maria da Silva"
                    />

                    {/* Preview do Username (Igual ao App) */}
                    {fullName.trim().length > 0 && (
                        <Box style={styles.previewBox}>
                            <Typography variant="body2" color="textSecondary">
                                Seu usuário para login será:
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                                {generateUsername(fullName)}
                            </Typography>
                        </Box>
                    )}

                    <TextField
                        label="Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={styles.input}
                    />

                    <TextField
                        label="Confirmar Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={styles.input}
                    />

                    <Button 
                        type="submit" 
                        fullWidth 
                        disabled={loading}
                        sx={styles.primaryButton}
                    >
                        {loading ? 'Criando Conta...' : 'CRIAR CONTA'}
                    </Button>

                    <Button 
                        fullWidth 
                        onClick={() => navigate('/')} 
                        sx={styles.secondaryButton}
                    >
                        Já tenho conta - Fazer Login
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}

export default RegisterPage;