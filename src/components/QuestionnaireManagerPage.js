// src/components/QuestionnaireManagerPage.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
// Importa as ferramentas do Firebase Firestore
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

function QuestionnaireManagerPage() {
    const [questionarios, setQuestionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [novoQuestionario, setNovoQuestionario] = useState({ title: '', description: '' });

    // Função para buscar os dados do FIRESTORE
    const fetchQuestionarios = async () => {
        setLoading(true);
        try {
            // "questionnaires" é o nome da sua coleção no Firestore
            const querySnapshot = await getDocs(collection(db, "questionnaires")); 
            const listaDeQuestionarios = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setQuestionarios(listaDeQuestionarios);
        } catch (error) {
            console.error("Erro ao buscar questionários do Firestore:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestionarios();
    }, []);

    const handleOpenDialog = () => {
        setNovoQuestionario({ title: '', description: '' });
        setOpenDialog(true);
    };
    const handleCloseDialog = () => setOpenDialog(false);

    // Função para salvar um novo questionário no FIRESTORE
    const handleSalvar = async () => {
        if (!novoQuestionario.title) return;
        try {
            await addDoc(collection(db, "questionnaires"), {
                title: novoQuestionario.title,
                description: novoQuestionario.description,
                created_at: serverTimestamp() // Adiciona a data de criação do servidor
            });
            handleCloseDialog();
            fetchQuestionarios(); // Atualiza a lista
        } catch (error) {
            console.error("Erro ao salvar questionário no Firestore:", error);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gerir Questionários</Typography>
                <Button variant="contained" color="primary" onClick={handleOpenDialog}>Criar Novo</Button>
            </Box>
            <List>
                {questionarios.map((q) => (
                    <ListItem key={q.id} divider>
                        <ListItemText primary={q.title} secondary={q.description || 'Sem descrição'} />
                    </ListItem>
                ))}
            </List>
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
                <DialogTitle>Criar Novo Questionário</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Título do Questionário" type="text" fullWidth variant="outlined" value={novoQuestionario.title} onChange={(e) => setNovoQuestionario({ ...novoQuestionario, title: e.target.value })} />
                    <TextField margin="dense" label="Descrição (Opcional)" type="text" fullWidth variant="outlined" multiline rows={4} value={novoQuestionario.description} onChange={(e) => setNovoQuestionario({ ...novoQuestionario, description: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSalvar} variant="contained">Salvar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default QuestionnaireManagerPage;