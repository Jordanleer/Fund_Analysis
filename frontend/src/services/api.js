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

// Returns APIs
export const getReturns = async (fundId, startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get(`/returns/${fundId}`, { params });
  return response.data;
};

export const getMultipleReturns = async (fundIds, startDate = null, endDate = null) => {
  const response = await api.post('/returns/multiple', {
    fund_ids: fundIds,
    start_date: startDate,
    end_date: endDate
  });
  return response.data;
};

// Performance APIs
export const getPerformance = async (fundId, startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get(`/performance/${fundId}`, { params });
  return response.data;
};

export const getCalendarYearReturns = async (fundId) => {
  const response = await api.get(`/performance/${fundId}/calendar-years`);
  return response.data;
};

export const comparePerformance = async (fundIds, startDate = null, endDate = null) => {
  const response = await api.post('/performance/compare', {
    fund_ids: fundIds,
    start_date: startDate,
    end_date: endDate
  });
  return response.data;
};

export const getRollingReturns = async (fundIds, windowMonths = 12, startDate = null, endDate = null) => {
  const response = await api.post('/performance/rolling-returns', {
    fund_ids: fundIds,
    window_months: windowMonths,
    start_date: startDate,
    end_date: endDate
  });
  return response.data;
};

// Risk APIs
export const getRiskMetrics = async (fundId, startDate = null, endDate = null, riskFreeRate = 0) => {
  const params = { risk_free_rate: riskFreeRate };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get(`/risk/${fundId}`, { params });
  return response.data;
};

export const getDrawdownSeries = async (fundId, startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await api.get(`/risk/${fundId}/drawdown`, { params });
  return response.data;
};

export const getCorrelationMatrix = async (fundIds, startDate = null, endDate = null) => {
  const response = await api.post('/risk/correlation-matrix', {
    fund_ids: fundIds,
    start_date: startDate,
    end_date: endDate
  });
  return response.data;
};

export default api;
