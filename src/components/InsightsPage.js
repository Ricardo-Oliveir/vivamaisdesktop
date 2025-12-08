// src/components/InsightsPage.js
import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Grid, Card, CardContent, Button, 
    Select, MenuItem, FormControl, InputLabel, CircularProgress, 
    Divider, Alert, Chip, LinearProgress, Accordion, AccordionSummary, 
    AccordionDetails, Paper, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { 
    AutoAwesome as AiIcon, 
    ThumbUp as StrongIcon, 
    TrendingDown as WeakIcon, 
    Lightbulb as IdeaIcon,
    ExpandMore as ExpandMoreIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingIcon,
    People as PeopleIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Speed as SpeedIcon
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
    },
    statsCard: {
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
    },
    summaryCard: {
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e0e0e0'
    },
    insightItem: {
        borderRadius: '12px',
        marginBottom: '12px',
        padding: '16px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    impactChip: {
        alto: { backgroundColor: '#f44336', color: 'white' },
        medio: { backgroundColor: '#ff9800', color: 'white' },
        baixo: { backgroundColor: '#4caf50', color: 'white' }
    }
};

function InsightsPage() {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [selectedQ, setSelectedQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState(null);
    const [detailedAnalysis, setDetailedAnalysis] = useState(null);
    const [stats, setStats] = useState(null);
    const [source, setSource] = useState(null);

    // Carregar lista de questionários
    useEffect(() => {
        api.get('/questionnaires').then(res => setQuestionnaires(res.data));
    }, []);

    const generateInsights = async () => {
        if (!selectedQ) return;
        setLoading(true);
        setInsights(null);
        setDetailedAnalysis(null);
        setStats(null);
        setSource(null);

        try {
            const response = await api.post('/generate-insights', { questionnaireId: selectedQ });
            
            setTimeout(() => {
                setInsights(response.data.analysis);
                setDetailedAnalysis(response.data.detailed);
                setStats(response.data.stats);
                setSource(response.data.source);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        if (priority <= 2) return '#f44336';
        if (priority <= 4) return '#ff9800';
        return '#4caf50';
    };

    const getPrazoLabel = (prazo) => {
        const labels = {
            'imediato': 'Imediato',
            'curto_prazo': 'Curto Prazo',
            'medio_prazo': 'Médio Prazo',
            'longo_prazo': 'Longo Prazo'
        };
        return labels[prazo] || prazo;
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

            {/* Estatísticas Rápidas */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ ...styles.statsCard, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold">{stats.totalRespondents}</Typography>
                            <Typography variant="body2">Respondentes</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ ...styles.statsCard, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <AssessmentIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold">{stats.totalResponses}</Typography>
                            <Typography variant="body2">Respostas Totais</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ ...styles.statsCard, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <SpeedIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold">
                                {stats.overallAverage || (detailedAnalysis?.metricas_chave?.satisfacao_geral) || 'N/A'}
                            </Typography>
                            <Typography variant="body2">Média Geral</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Fonte da Análise */}
            {source && (
                <Box sx={{ mb: 2 }}>
                    <Chip 
                        icon={source === 'gemini-ai' ? <AiIcon /> : <AssessmentIcon />}
                        label={source === 'gemini-ai' ? '✨ Análise por Gemini AI' : '📊 Análise Estatística'}
                        color={source === 'gemini-ai' ? 'success' : 'info'}
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>
            )}

            {/* Resumo Executivo (apenas quando tem análise detalhada) */}
            {detailedAnalysis?.resumo_executivo && (
                <Card sx={styles.summaryCard}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon color="primary" /> Resumo Executivo
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.7 }}>
                        {detailedAnalysis.resumo_executivo}
                    </Typography>
                </Card>
            )}

            {/* Cards de Insights Básicos */}
            {insights && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Pontos Fortes */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ ...styles.card, borderTop: '4px solid #4CAF50' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StrongIcon /> Pontos Fortes
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                {insights.strengths.map((text, i) => (
                                    <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
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
                                        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
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
                                    <Alert severity="info" icon={<IdeaIcon />} sx={{ mb: 1, borderRadius: '8px' }} key={i}>
                                        {text}
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Insights Detalhados (apenas com Gemini) */}
            {detailedAnalysis?.insights_detalhados && detailedAnalysis.insights_detalhados.length > 0 && (
                <Card sx={{ ...styles.card, mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingIcon color="primary" /> Insights Detalhados
                        </Typography>
                        
                        {detailedAnalysis.insights_detalhados.map((insight, i) => (
                            <Accordion key={i} sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Typography fontWeight="bold">{insight.titulo}</Typography>
                                        <Chip 
                                            label={insight.impacto?.toUpperCase()} 
                                            size="small"
                                            sx={styles.impactChip[insight.impacto] || styles.impactChip.medio}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {insight.descricao}
                                    </Typography>
                                    <Alert severity="info" sx={{ borderRadius: '8px' }}>
                                        <strong>Recomendação:</strong> {insight.recomendacao}
                                    </Alert>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Plano de Ação Detalhado (apenas com Gemini) */}
            {detailedAnalysis?.plano_acao && detailedAnalysis.plano_acao.length > 0 && (
                <Card sx={{ ...styles.card, mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IdeaIcon color="primary" /> Plano de Ação Detalhado
                        </Typography>
                        
                        <List>
                            {detailedAnalysis.plano_acao.map((acao, i) => (
                                <ListItem key={i} sx={styles.insightItem}>
                                    <ListItemIcon>
                                        <Box 
                                            sx={{ 
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                backgroundColor: getPriorityColor(acao.prioridade),
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {acao.prioridade}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography fontWeight="bold">{acao.acao}</Typography>
                                                <Chip 
                                                    label={getPrazoLabel(acao.prazo_sugerido)} 
                                                    size="small" 
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                            </Box>
                                        }
                                        secondary={acao.justificativa}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* Tendências (apenas com Gemini) */}
            {detailedAnalysis?.tendencias && detailedAnalysis.tendencias.length > 0 && (
                <Card sx={{ ...styles.card }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingIcon color="primary" /> Tendências Identificadas
                        </Typography>
                        
                        {detailedAnalysis.tendencias.map((tendencia, i) => (
                            <Alert 
                                key={i} 
                                severity="info" 
                                icon={<TrendingIcon />} 
                                sx={{ mb: 1, borderRadius: '8px' }}
                            >
                                {tendencia}
                            </Alert>
                        ))}
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default InsightsPage;