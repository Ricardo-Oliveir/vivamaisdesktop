// src/components/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import api from '../api'; // Usando nosso 'assistente' axios
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material'; // LINHA CORRIGIDA
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registra os componentes necessários do Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // A chamada agora usa o 'api' que já tem a URL base e o token
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Erro ao buscar estatísticas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading || !stats) {
        return <CircularProgress />;
    }
    
    const chartData = {
        labels: ['Totais'],
        datasets: [
            {
                label: 'Usuários',
                data: [stats.totalUsuarios],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
            {
                label: 'Questionários',
                data: [stats.totalQuestionarios],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
        ],
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Dashboard</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Total de Usuários</Typography>
                            <Typography variant="h3">{stats.totalUsuarios}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Total de Questionários</Typography>
                            <Typography variant="h3">{stats.totalQuestionarios}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Visão Geral</Typography>
                            <Bar data={chartData} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default AdminDashboardPage;