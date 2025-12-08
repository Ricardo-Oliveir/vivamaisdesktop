// src/components/QuestionnaireManagerPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Button, Grid, Card, CardContent, CardActions, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
    Select, MenuItem, FormControl, InputLabel, IconButton, Chip,
    CircularProgress, Snackbar, Alert, Tooltip, List, ListItem, ListItemText, Divider 
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon, 
    AddCircle as AddPlusIcon,     // Ícone para adicionar pergunta
    Download as DownloadIcon,     // Ícone para Excel
    Visibility as ViewIcon,       // Ícone para ver perguntas
    Assignment as AssignmentIcon,
    BarChart as ChartIcon         // Ícone para ver respostas
} from '@mui/icons-material';
import * as XLSX from 'xlsx'; // Biblioteca Excel
import api from '../services/api';

// --- ESTILOS ---
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
        border: `2px solid ${themeStyles.primary}`,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }
};

function QuestionnaireManagerPage() {
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [questionnaires, setQuestionnaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    
    // Modais
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [openAddQuestionModal, setOpenAddQuestionModal] = useState(false);
    const [openViewQuestionsModal, setOpenViewQuestionsModal] = useState(false); // Modal de Ver Perguntas
    
    // Dados dos Formulários
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedQ, setSelectedQ] = useState(null);
    
    // Dados da Nova Pergunta
    const [qText, setQText] = useState('');
    const [qType, setQType] = useState('multiple_choice');
    const [options, setOptions] = useState(['']);
    const [savingQuestion, setSavingQuestion] = useState(false);

    // Feedback
    const [toast, setToast] = useState({ open: false, msg: '', type: 'success' });

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/questionnaires');
            setQuestionnaires(response.data);
        } catch (error) {
            console.error(error);
            showToast("Erro ao carregar dados", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- AÇÕES PRINCIPAIS ---

    // 1. EXPORTAR PARA EXCEL (CORRIGIDO E ROBUSTO)
    const handleExportExcel = async (questionnaire) => {
        setDownloading(true);
        try {
            console.log(`📥 Baixando dados do questionário: ${questionnaire.id}`);

            // A. Busca detalhes para mapear ID da pergunta -> Texto da pergunta
            const qDetails = await api.get(`/questionnaires/${questionnaire.id}`);
            const questionsMap = {};
            if (qDetails.data.questions) {
                qDetails.data.questions.forEach(q => questionsMap[q.id] = q.text);
            }

            // B. Busca as respostas
            // O backend deve ter a rota /api/questionnaires/:id/responses funcionando
            let responses = [];
            try {
                const rResponse = await api.get(`/questionnaires/${questionnaire.id}/responses`);
                responses = rResponse.data;
            } catch (e) {
                console.warn("Rota de respostas falhou, verificando se é array vazio...");
            }

            console.log(`📊 Respostas encontradas: ${responses ? responses.length : 0}`);

            if (!responses || responses.length === 0) {
                showToast("Este questionário ainda não tem respostas.", "warning");
                setDownloading(false);
                return;
            }

            // C. Formata para Excel
            const excelData = responses.map(resp => ({
                "ID Sessão": resp.session_id || "Anônimo",
                "Data": new Date(resp.created_at).toLocaleString('pt-BR'),
                "Pergunta": questionsMap[resp.question_id] || `Questão ${resp.question_id}`,
                "Resposta": resp.value || resp.numeric_value || "(Sem valor)"
            }));

            // D. Gera o arquivo
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Dados");
            
            const safeTitle = questionnaire.title.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
            XLSX.writeFile(wb, `Relatorio_${safeTitle}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);

            showToast("Download concluído!", "success");

        } catch (error) {
            console.error("Erro fatal no export:", error);
            showToast("Erro ao gerar arquivo Excel.", "error");
        } finally {
            setDownloading(false);
        }
    };

    // 2. Visualizar Perguntas (Modal)
    const handleViewQuestions = (q) => {
        setSelectedQ(q);
        setOpenViewQuestionsModal(true);
    };

    // 3. Abrir Modal de Adicionar Pergunta
    const handleOpenAddQuestion = (q) => {
        setSelectedQ(q);
        setQText('');
        setOptions(['']);
        setOpenAddQuestionModal(true);
    };

    // 4. Salvar Nova Pergunta
    const handleSaveQuestion = async () => {
        if (!qText.trim()) return showToast("Digite a pergunta", "warning");
        setSavingQuestion(true);
        try {
            await api.post(`/questionnaires/${selectedQ.id}/questions`, {
                text: qText, 
                type: qType, 
                options: qType === 'multiple_choice' ? options.filter(o => o.trim()) : null
            });
            showToast("Pergunta adicionada!", "success");
            setQText(''); 
            setOptions(['']);
            setOpenAddQuestionModal(false);
            loadData(); // Recarrega a lista para atualizar o contador de perguntas
        } catch (error) { 
            showToast("Erro ao salvar pergunta", "error"); 
        } finally { 
            setSavingQuestion(false); 
        }
    };

    // 5. Criar Novo Questionário
    const handleCreate = async () => {
        if (!title.trim()) return showToast("Título obrigatório", "warning");
        try {
            await api.post('/questionnaires', { title, description });
            setOpenCreateModal(false); 
            setTitle(''); 
            setDescription('');
            showToast("Questionário criado!", "success");
            loadData();
        } catch (error) { 
            showToast("Erro ao criar", "error"); 
        }
    };

    // 6. Deletar Questionário
    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir?")) return;
        try { 
            await api.delete(`/questionnaires/${id}`); 
            loadData(); 
            showToast("Questionário excluído!", "success"); 
        } catch (error) { 
            showToast("Erro ao excluir", "error"); 
        }
    };

    // --- UTILITÁRIOS ---
    const handleOptionChange = (i, v) => { const n = [...options]; n[i] = v; setOptions(n); };
    const addOpt = () => setOptions([...options, '']);
    const removeOpt = (i) => options.length > 1 && setOptions(options.filter((_, idx) => idx !== i));
    const showToast = (msg, type) => setToast({ open: true, msg, type });

    return (
        <Box sx={styles.pageContainer}>
            {/* CABEÇALHO */}
            <Box sx={styles.header}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: themeStyles.primary }}>
                    Gerenciar Questionários
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => setOpenCreateModal(true)}
                    sx={{ backgroundColor: themeStyles.primary, borderRadius: '12px' }}
                >
                    Novo Questionário
                </Button>
            </Box>

            {/* LISTA DE CARDS */}
            {loading ? <CircularProgress sx={{ color: themeStyles.primary }} /> : (
                <Grid container spacing={3}>
                    {questionnaires.map((q) => (
                        <Grid item xs={12} md={6} lg={4} key={q.id}>
                            <Card sx={styles.card}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: themeStyles.primary, fontWeight: 'bold' }}>
                                        {q.title}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, minHeight: '40px' }}>
                                        {q.description || "Sem descrição"}
                                    </Typography>
                                    
                                    {/* Badges de Status e Qtd Perguntas */}
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                            label={q.is_active ? "Ativo" : "Inativo"} 
                                            color={q.is_active ? "success" : "default"} 
                                            size="small" 
                                        />
                                        <Chip 
                                            label={`${q.questions ? q.questions.length : 0} Perguntas`} 
                                            size="small" 
                                            variant="outlined" 
                                        />
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 2, paddingTop: 0, justifyContent: 'space-between' }}>
                                    {/* Grupo Esquerdo: Ferramentas */}
                                    <Box>
                                        <Tooltip title="Ver Respostas (Gráficos)">
                                            <IconButton 
                                                onClick={() => navigate(`/questionarios/${q.id}/respostas`)}
                                                sx={{ color: '#7B1FA2', border: '1px solid #CE93D8', mr: 1, borderRadius: '8px' }}
                                            >
                                                <ChartIcon />
                                            </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="Baixar Respostas (Excel)">
                                            <IconButton 
                                                onClick={() => handleExportExcel(q)}
                                                disabled={downloading}
                                                sx={{ color: '#2E7D32', border: '1px solid #A5D6A7', mr: 1, borderRadius: '8px' }}
                                            >
                                                {downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                                            </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="Adicionar Nova Pergunta">
                                            <IconButton 
                                                onClick={() => handleOpenAddQuestion(q)}
                                                sx={{ color: '#F57C00', border: '1px solid #FFCC80', borderRadius: '8px' }}
                                            >
                                                <AddPlusIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Grupo Direito: Ver e Deletar */}
                                    <Box>
                                        <Button 
                                            variant="contained" 
                                            startIcon={<ViewIcon />}
                                            onClick={() => handleViewQuestions(q)}
                                            sx={{ backgroundColor: themeStyles.secondary, borderRadius: '8px', mr: 1, textTransform: 'none' }}
                                        >
                                            PERGUNTAS
                                        </Button>
                                        
                                        <IconButton onClick={() => handleDelete(q.id)} sx={{ color: '#D32F2F' }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* --- MODAL 1: VISUALIZAR PERGUNTAS (Para ver a lista) --- */}
            <Dialog open={openViewQuestionsModal} onClose={() => setOpenViewQuestionsModal(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ backgroundColor: themeStyles.primary, color: 'white' }}>
                    Perguntas: {selectedQ?.title}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedQ?.questions && selectedQ.questions.length > 0 ? (
                        <List>
                            {selectedQ.questions.map((question, index) => (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemText
                                            primary={
                                                <Typography variant="h6" sx={{ color: '#424242', fontWeight: 'bold' }}>
                                                    {index + 1}. {question.text}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip label={`Tipo: ${question.type}`} size="small" sx={{ mr: 1, backgroundColor: '#E0E0E0' }} />
                                                    {question.options && (
                                                        <Typography variant="body2" component="div" sx={{ mt: 1, color: '#666', fontStyle: 'italic' }}>
                                                            Opções: {question.options.join(', ')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography sx={{ p: 4, textAlign: 'center', color: '#999' }}>
                            Nenhuma pergunta cadastrada neste questionário.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenViewQuestionsModal(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* --- MODAL 2: CRIAR QUESTIONÁRIO --- */}
            <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>Novo Questionário</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Título" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
                    <TextField margin="dense" label="Descrição" fullWidth multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateModal(false)}>Cancelar</Button>
                    <Button onClick={handleCreate} variant="contained" sx={{ backgroundColor: themeStyles.primary }}>Criar</Button>
                </DialogActions>
            </Dialog>

            {/* --- MODAL 3: ADICIONAR PERGUNTA (O botão +) --- */}
            <Dialog open={openAddQuestionModal} onClose={() => setOpenAddQuestionModal(false)} fullWidth maxWidth="md">
                <DialogTitle>Adicionar Pergunta em: {selectedQ?.title}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Texto da Pergunta" fullWidth value={qText} onChange={e => setQText(e.target.value)} sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Tipo de Resposta</InputLabel>
                        <Select value={qType} label="Tipo de Resposta" onChange={e => setQType(e.target.value)}>
                            <MenuItem value="multiple_choice">Múltipla Escolha</MenuItem>
                            <MenuItem value="rating">Avaliação (1-5)</MenuItem>
                            <MenuItem value="yes_no">Sim / Não</MenuItem>
                            <MenuItem value="text">Texto Livre</MenuItem>
                        </Select>
                    </FormControl>
                    {qType === 'multiple_choice' && (
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Opções de Resposta:</Typography>
                            {options.map((opt, i) => (
                                <Box key={i} sx={{ display: 'flex', mb: 1 }}>
                                    <TextField fullWidth size="small" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Opção ${i+1}`} />
                                    {options.length > 1 && <IconButton onClick={() => removeOpt(i)} color="error"><DeleteIcon /></IconButton>}
                                </Box>
                            ))}
                            <Button startIcon={<AddPlusIcon />} onClick={addOpt}>Mais Opção</Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddQuestionModal(false)}>Cancelar</Button>
                    <Button onClick={handleSaveQuestion} variant="contained" disabled={savingQuestion} sx={{ backgroundColor: themeStyles.primary }}>
                        {savingQuestion ? "Salvando..." : "Adicionar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})}>
                <Alert severity={toast.type}>{toast.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

export default QuestionnaireManagerPage;