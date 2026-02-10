import axios from 'axios';
import { Config } from './config';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('[API Error]:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
