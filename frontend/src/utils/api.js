import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'sqa_default_key_change_me';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message;
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// ============================================
// Tenant
// ============================================
export const createTenant = (data) => api.post('/api/tenants', data);

// ============================================
// Questionnaires
// ============================================
export const createQuestionnaire = (data) => api.post('/api/questionnaires', data);
export const listQuestionnaires = () => api.get('/api/questionnaires');
export const uploadQuestionnaire = (qId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/questionnaires/${qId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getQuestions = (qId) => api.get(`/api/questionnaires/${qId}/questions`);
export const generateAnswers = (qId, questionIds = []) =>
  api.post(`/api/questionnaires/${qId}/answer`, { question_ids: questionIds });
export const validateAnswers = (qId, answerIds = []) =>
  api.post(`/api/questionnaires/${qId}/validate`, { answer_ids: answerIds });
export const approveAnswer = (qId, questionId) =>
  api.post(`/api/questionnaires/${qId}/approve/${questionId}`);
export const rejectAnswer = (qId, questionId, reason) =>
  api.post(`/api/questionnaires/${qId}/reject/${questionId}?reason=${encodeURIComponent(reason)}`);
export const exportQuestionnaire = (qId, format = 'excel') =>
  api.get(`/api/questionnaires/${qId}/export?format=${format}`, { responseType: 'blob' });

// ============================================
// Knowledge Base
// ============================================
export const ingestDocument = (data) => api.post('/api/kb/ingest', data);
export const searchKB = (query, topK = 5) => api.get(`/api/kb/search?q=${encodeURIComponent(query)}&top_k=${topK}`);
export const listKBDocs = () => api.get('/api/kb/documents');

// ============================================
// Chat
// ============================================
export const chat = (message, questionnaireId = '') =>
  api.post('/api/chat', { message, questionnaire_id: questionnaireId });

// ============================================
// Health
// ============================================
export const healthCheck = () => api.get('/health');

export default api;
