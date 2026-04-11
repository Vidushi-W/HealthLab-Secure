import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`[API Interceptor] Request to ${config.url}. Token in localStorage: ${token ? 'YES' : 'NO'}`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Interceptor] Authorization header added`);
    } else {
      console.warn(`[API Interceptor] NO TOKEN FOUND IN LOCALSTORAGE for request: ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
