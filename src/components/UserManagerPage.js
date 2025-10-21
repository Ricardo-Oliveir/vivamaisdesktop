// src/components/UserManagerPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const API_URL = 'http://localhost:8080';

function UserManagerPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [message, setMessage] = useState('');

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await axios.post(`${API_URL}/api/usuarios`, { username, password, role });
            setMessage(response.data.message);
            setUsername('');
            setPassword('');
        } catch (error) {
            setMessage(error.response.data.message || 'Ocorreu um erro.');
        }
    };

    return (
        <Box component="form" onSubmit={handleCreateUser}>
            <Typography variant="h4" gutterBottom>Gerenciar Usuários</Typography>
            <TextField label="Nome do Usuário" value={username} onChange={e => setUsername(e.target.value)} fullWidth required margin="normal" />
            <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth required margin="normal" />
            <FormControl fullWidth margin="normal">
                <InputLabel>Função</InputLabel>
                <Select value={role} label="Função" onChange={e => setRole(e.target.value)}>
                    <MenuItem value="user">Usuário (APK)</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                </Select>
            </FormControl>
            <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                Criar Usuário
            </Button>
            {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
        </Box>
    );
}

export default UserManagerPage;