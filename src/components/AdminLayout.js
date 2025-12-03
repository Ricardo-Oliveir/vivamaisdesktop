// src/components/AdminLayout.js
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, 
    ListItemIcon, ListItemText, Button, IconButton 
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    Assignment as AssignmentIcon, 
    People as PeopleIcon,
    ExitToApp as LogoutIcon,
    Menu as MenuIcon,
    AutoAwesome as AiIcon // Ícone da IA
} from '@mui/icons-material';

const drawerWidth = 240;

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user_data');
        window.location.href = '/login';
    };

    // --- LISTA DE MENU (Apenas uma declaração correta) ---
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Questionários', icon: <AssignmentIcon />, path: '/questionarios' },
        { text: 'Análise IA', icon: <AiIcon />, path: '/insights' }, 
        { text: 'Usuários', icon: <PeopleIcon />, path: '/usuarios' },
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ backgroundColor: '#2E7D32', color: 'white' }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    VivaMais Admin
                </Typography>
            </Toolbar>
            <List sx={{ flexGrow: 1, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text} 
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            margin: '8px 16px',
                            borderRadius: '12px',
                            width: 'auto',
                            '&.Mui-selected': {
                                backgroundColor: '#E8F5E9',
                                color: '#2E7D32',
                                '& .MuiListItemIcon-root': { color: '#2E7D32' }
                            },
                            '&:hover': { backgroundColor: '#F1F8E9' }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
                <Button 
                    fullWidth variant="outlined" color="error" startIcon={<LogoutIcon />}
                    onClick={handleLogout} sx={{ borderRadius: '12px' }}
                >
                    Sair
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Menu Mobile */}
            <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, backgroundColor: '#2E7D32', display: { sm: 'none' } }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap>Painel Administrativo</Typography>
                </Toolbar>
            </AppBar>

            {/* Navegação Lateral */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
                    {drawerContent}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Conteúdo da Página */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
                <Toolbar sx={{ display: { sm: 'none' } }} />
                <Outlet />
            </Box>
        </Box>
    );
}

export default AdminLayout;