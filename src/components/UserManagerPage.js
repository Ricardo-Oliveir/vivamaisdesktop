// src/components/UserManagerPage.js
import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Grid, Card, CardContent, CardActions, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    Select, MenuItem, FormControl, InputLabel, IconButton, Chip, 
    CircularProgress, Snackbar, Alert, Avatar 
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon, 
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon 
} from '@mui/icons-material';

// Usando nossa configuração de API centralizada
import api from '../services/api';

// --- ESTILOS (Mesmo padrão do QuestionnaireManager) ---
const themeStyles = {
    primary: '#2E7D32',
    secondary: '#4A90E2',
    background: '#F8F9FA',
    radius: '12px',
};

const styles = {
    pageContainer: { padding: '24px', backgroundColor: themeStyles.background, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    card: {
        borderRadius: themeStyles.radius,
        border: '1px solid #E0E0E0',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
    },
    avatarContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
    },
    avatar: {
        backgroundColor: themeStyles.primary,
        width: 50,
        height: 50,
        marginRight: '16px'
    }
};

function UserManagerPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Form States
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    
    const [toast, setToast] = useState({ open: false, msg: '', type: 'success' });

    // --- CARREGAR USUÁRIOS ---
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Nota: Precisamos garantir que o backend tenha essa rota GET /users
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error(error);
            // Se falhar, é provável que o backend não tenha a rota de listar ainda
            // Mas vamos deixar o código pronto.
            showToast("Erro ao carregar usuários. Verifique o backend.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- CRIAR USUÁRIO ---
    const handleCreateUser = async () => {
        if (!username || !password || !fullName) {
            return showToast("Preencha todos os campos obrigatórios.", "warning");
        }

        try {
            await api.post('/auth/register', {
                full_name: fullName,
                username: username.toLowerCase(),
                email: `${username.toLowerCase()}@vivamais.com`, // Gera email auto
                password,
                role
            });

            showToast("Usuário criado com sucesso!", "success");
            setOpenDialog(false);
            
            // Limpar form
            setFullName('');
            setUsername('');
            setPassword('');
            setRole('user');
            
            fetchUsers(); // Recarrega a lista
        } catch (error) {
            const msg = error.response?.data?.error || "Erro ao criar usuário.";
            showToast(msg, "error");
        }
    };

    // --- DELETAR USUÁRIO ---
    const handleDeleteUser = async (id) => {
        if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;

        try {
            await api.delete(`/users/${id}`);
            showToast("Usuário removido.", "success");
            fetchUsers();
        } catch (error) {
            showToast("Erro ao deletar usuário.", "error");
        }
    };

    const showToast = (msg, type) => setToast({ open: true, msg, type });

    return (
        <Box sx={styles.pageContainer}>
            {/* CABEÇALHO */}
            <Box sx={styles.header}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: themeStyles.primary }}>
                    Gerenciar Usuários
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ backgroundColor: themeStyles.primary, borderRadius: '12px', py: 1.5 }}
                >
                    Novo Usuário
                </Button>
            </Box>

            {/* LISTA DE USUÁRIOS */}
            {loading ? <CircularProgress sx={{ color: themeStyles.primary }} /> : (
                <Grid container spacing={3}>
                    {users.length === 0 ? (
                        <Typography sx={{ p: 3, color: '#666' }}>Nenhum usuário encontrado (ou erro na conexão).</Typography>
                    ) : (
                        users.map((user) => (
                            <Grid item xs={12} md={6} lg={4} key={user.id}>
                                <Card sx={styles.card}>
                                    <CardContent>
                                        <Box sx={styles.avatarContainer}>
                                            <Avatar sx={{ ...styles.avatar, bgcolor: user.role === 'admin' ? themeStyles.secondary : themeStyles.primary }}>
                                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : <PersonIcon />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                    {user.full_name || user.username}
                                                </Typography>
                                                <Chip 
                                                    icon={user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
                                                    label={user.role === 'admin' ? "Administrador" : "Usuário APK"} 
                                                    size="small"
                                                    color={user.role === 'admin' ? "secondary" : "default"}
                                                    sx={{ mt: 0.5 }}
                                                />
                                            </Box>
                                        </Box>
                                        
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Login:</strong> {user.username}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            <strong>Email:</strong> {user.email}
                                        </Typography>
                                    </CardContent>
                                    
                                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                        <Button 
                                            size="small" 
                                            color="error" 
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            Remover
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* MODAL DE CRIAÇÃO */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Nome Completo" fullWidth
                        value={fullName} onChange={e => setFullName(e.target.value)}
                    />
                    <TextField
                        margin="dense" label="Username (Login)" fullWidth
                        value={username} onChange={e => setUsername(e.target.value)}
                        helperText="Será usado para logar no App"
                    />
                    <TextField
                        margin="dense" label="Senha" type="password" fullWidth
                        value={password} onChange={e => setPassword(e.target.value)}
                    />
                    
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Função</InputLabel>
                        <Select value={role} label="Função" onChange={e => setRole(e.target.value)}>
                            <MenuItem value="user">Usuário Comum (Apenas responde)</MenuItem>
                            <MenuItem value="admin">Administrador (Acessa Painel)</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCreateUser} variant="contained" sx={{ bgcolor: themeStyles.primary }}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})}>
                <Alert severity={toast.type}>{toast.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

export default UserManagerPage;