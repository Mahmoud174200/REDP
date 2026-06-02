import axios from 'axios';

// Instantiate pre-configured communications client pointing to Laravel API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor injecting Sanctum tokens automatically and disabling caching for GET requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('redp_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor checking for token revocations or unauthenticated errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local states and kick to login if Sanctum session expires
      localStorage.removeItem('redp_token');
      localStorage.removeItem('redp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
