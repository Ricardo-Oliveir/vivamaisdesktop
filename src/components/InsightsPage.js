// src/components/InsightsPage.js
import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, Button, 
    Select, MenuItem, FormControl, InputLabel, CircularProgress, 
    Divider, Alert 
} from '@mui/material';
import { 
    AutoAwesome as AiIcon, 
    ThumbUp as StrongIcon, 
    TrendingDown as WeakIcon, 
    Lightbulb as IdeaIcon 
} from '@mui/icons-material';
import api from '../services/api';

const styles = {
    page: { padding: '24px', backgroundColor: '#F8F9FA', minHeight: '100vh' },
    header: { marginBottom: '24px' },
    card: { borderRadius: '16px', height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    aiButton: { 
        background: 'linear-gradient(45deg, #2E7D32 30%, #66BB6A 90%)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '50px',
        fontWeight: 'bold',
        marginTop: '20px'
    }
};

function InsightsPage() {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [selectedQ, setSelectedQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);

    // Carregar lista de questionários
    useEffect(() => {
        api.get('/questionnaires').then(res => setQuestionnaires(res.data));
    }, []);

    const generateInsights = async () => {
        if (!selectedQ) return;
        setLoading(true);
        setInsights(null); // Limpa anterior

        try {
            // CORREÇÃO AQUI: Removemos o '/api' extra pois o axios já tem a baseURL configurada
            const response = await api.post('/generate-insights', { questionnaireId: selectedQ });
            
            // Simula um tempinho de "pensando" para dar efeito de IA
            setTimeout(() => {
                setInsights(response.data.analysis);
                setLoading(false);
            }, 1000); // Reduzi um pouco o tempo para ser mais ágil
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.header}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AiIcon fontSize="large" /> Análise Inteligente (IA)
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Use inteligência artificial para descobrir padrões nas respostas.
                </Typography>
            </Box>

            <Card sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <FormControl fullWidth>
                            <InputLabel>Selecione o Questionário para Analisar</InputLabel>
                            <Select
                                value={selectedQ}
                                label="Selecione o Questionário para Analisar"
                                onChange={(e) => setSelectedQ(e.target.value)}
                            >
                                {questionnaires.map((q) => (
                                    <MenuItem key={q.id} value={q.id}>{q.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <AiIcon />}
                            onClick={generateInsights}
                            disabled={!selectedQ || loading}
                            sx={styles.aiButton}
                        >
                            {loading ? "A IA está analisando..." : "GERAR INSIGHTS"}
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            {insights && (
                <Grid container spacing={3}>
                    {/* Pontos Fortes */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ ...styles.card, borderTop: '4px solid #4CAF50' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StrongIcon /> Pontos Fortes
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                {insights.strengths.map((text, i) => (
                                    <Alert severity="success" icon={false} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
                                        {text}
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* A Melhorar */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ ...styles.card, borderTop: '4px solid #F44336' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#C62828', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WeakIcon /> Atenção Necessária
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                {insights.improvements.length > 0 ? (
                                    insights.improvements.map((text, i) => (
                                        <Alert severity="error" icon={false} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
                                            {text}
                                        </Alert>
                                    ))
                                ) : (
                                    <Typography color="textSecondary">Nenhum ponto crítico detectado.</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sugestões */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ ...styles.card, borderTop: '4px solid #2196F3' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#1565C0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IdeaIcon /> Plano de Ação
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                {insights.action_plan.map((text, i) => (
                                    <Alert severity="info" icon={false} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
                                        {text}
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default InsightsPage;