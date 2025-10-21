// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import LoginPage from './components/LoginPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './components/AdminDashboardPage';
import QuestionnaireManagerPage from './components/QuestionnaireManagerPage';
import UserManagerPage from './components/UserManagerPage';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
});

function App() {
    const [user, setUser] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };
    
    const ProtectedRoute = () => {
        return user ? <AdminLayout user={user} /> : <Navigate to="/login" />;
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                    
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/questionarios" element={<QuestionnaireManagerPage />} />
                        <Route path="/usuarios" element={<UserManagerPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;