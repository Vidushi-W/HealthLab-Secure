import axios from 'axios';
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'HealthLab' },
});
export default api;
