import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getDataStatus = async () => {
  const response = await api.get('/data-status');
  return response.data;
};

export const clearData = async () => {
  const response = await api.delete('/data');
  return response.data;
};

export const getFunds = async (filters = {}) => {
  const response = await api.get('/funds', { params: filters });
  return response.data;
};

export const getFundDetail = async (fundId) => {
  const response = await api.get(`/funds/${fundId}`);
  return response.data;
};

export const compareFunds = async (fundIds) => {
  const response = await api.post('/funds/compare', fundIds);
  return response.data;
};

export default api;
