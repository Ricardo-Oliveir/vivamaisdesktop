// src/components/AdminDashboardPage.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registra os componentes do gráfico
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboardPage() {
    // Inicializa com zeros para não dar erro de undefined
    const [stats, setStats] = useState({ totalUsers: 0, totalQuestionnaires: 0, totalResponses: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Chama a NOVA ROTA que criamos no backend
                const response = await api.get('/dashboard-data');
                
                console.log("Dados recebidos no site:", response.data); // Debug no navegador (F12)
                
                if (response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setError('Não foi possível carregar os dados.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Estilos Visuais (Verde/Elderly)
    const styles = {
        container: { padding: '24px', backgroundColor: '#F8F9FA', minHeight: '100vh' },
        card: { borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '100%' },
        title: { color: '#2E7D32', fontWeight: 'bold', marginBottom: '24px' },
        number: { fontSize: '3rem', fontWeight: 'bold' },
        label: { color: '#666', fontSize: '1.1rem' }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress sx={{ color: '#2E7D32' }} /></Box>;

    // Configuração do Gráfico
    const chartData = {
        labels: ['Totais do Sistema'],
        datasets: [
            {
                label: 'Usuários',
                data: [stats.totalUsers],
                backgroundColor: '#2E7D32',
                borderRadius: 8
            },
            {
                label: 'Questionários',
                data: [stats.totalQuestionnaires],
                backgroundColor: '#4A90E2',
                borderRadius: 8
            },
            {
                label: 'Respostas',
                data: [stats.totalResponses],
                backgroundColor: '#F57C00',
                borderRadius: 8
            }
        ]
    };

    return (
        <Box sx={styles.container}>
            <Typography variant="h4" sx={styles.title}>Painel Administrativo</Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Card Usuários */}
                <Grid item xs={12} md={4}>
                    <Card sx={styles.card}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={styles.label}>Total de Usuários</Typography>
                            <Typography sx={{ ...styles.number, color: '#2E7D32' }}>
                                {stats.totalUsers}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Card Questionários */}
                <Grid item xs={12} md={4}>
                    <Card sx={styles.card}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={styles.label}>Questionários Ativos</Typography>
                            <Typography sx={{ ...styles.number, color: '#4A90E2' }}>
                                {stats.totalQuestionnaires}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Card Respostas */}
                <Grid item xs={12} md={4}>
                    <Card sx={styles.card}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography sx={styles.label}>Respostas Coletadas</Typography>
                            <Typography sx={{ ...styles.number, color: '#F57C00' }}>
                                {stats.totalResponses}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Gráfico */}
                <Grid item xs={12}>
                    <Card sx={styles.card}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, color: '#444' }}>Visão Geral</Typography>
                            <Box height={300}>
                                <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default AdminDashboardPage;