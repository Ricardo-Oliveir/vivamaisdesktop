// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Importação das Páginas
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminLayout from './components/AdminLayout'; // O Menu Lateral fica aqui
import AdminDashboardPage from './components/AdminDashboardPage';
import QuestionnaireManagerPage from './components/QuestionnaireManagerPage';
import UserManagerPage from './components/UserManagerPage';
import InsightsPage from './components/InsightsPage'; // A Nova página de IA

// Tema "Elderly" (Verde)
const theme = createTheme({
    palette: {
        primary: { main: '#2E7D32' },
        secondary: { main: '#4A90E2' },
        background: { default: '#F8F9FA' }
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
    shape: {
        borderRadius: 12,
    }
});

function App() {
    // Tenta recuperar o usuário salvo ao abrir o site
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_data');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
    };

    // Componente que protege as rotas (Só entra se estiver logado)
    const ProtectedRoute = () => {
        if (!user) {
            return <Navigate to="/login" />;
        }
        // Se estiver logado, renderiza o Menu Lateral (Layout) envolvendo a página
        return <AdminLayout />;
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    {/* --- ROTAS PÚBLICAS --- */}
                    <Route 
                        path="/login" 
                        element={!user ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
                    />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* --- ROTAS PROTEGIDAS (Com Menu Lateral) --- */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/questionarios" element={<QuestionnaireManagerPage />} />
                        <Route path="/usuarios" element={<UserManagerPage />} />
                        <Route path="/insights" element={<InsightsPage />} /> {/* Rota da IA */}
                    </Route>

                    {/* Rota Padrão (Redireciona) */}
                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;