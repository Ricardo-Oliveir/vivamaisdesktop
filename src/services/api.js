// src/services/api.js
import axios from 'axios';

// URL do seu Backend (Se estiver rodando local no PC)
const API_BASE_URL = 'http://localhost:3000/api'; 

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar o token automaticamente (se tiver login)
api.interceptors.request.use(async (config) => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
        const { token } = JSON.parse(storedUser);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// --- FUNÇÕES IGUAIS AO APP (Adaptadas para Web) ---

export const getAllQuestionnaires = async () => {
    const response = await api.get('/questionnaires');
    return response.data;
};

export const createQuestionnaire = async (title, description) => {
    const response = await api.post('/questionnaires', {
        title,
        description,
        created_at: new Date().toISOString()
    });
    return response.data;
};

export const deleteQuestionnaire = async (id) => {
    const response = await api.delete(`/questionnaires/${id}`);
    return response.data;
};

// Criação de perguntas (Lógica Embedded)
export const createQuestion = async (questionnaireId, text, type, options = null) => {
    // Filtra opções vazias se existirem
    const cleanOptions = options ? options.filter(o => o.trim() !== '') : null;
    
    const response = await api.post(`/questionnaires/${questionnaireId}/questions`, {
        text,
        type,
        options: cleanOptions,
        is_required: true,
        order: 0
    });
    return response.data;
};

export default api;