import axios from 'axios';

console.log('VITE_API_BASE_URL is:', import.meta.env.VITE_API_BASE_URL);

// Instantiate pre-configured communications client pointing to Laravel API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

console.log('Axios baseURL is set to:', api.defaults.baseURL);


// Request interceptor injecting Sanctum tokens automatically and disabling caching for GET requests
api.interceptors.request.use((config) => {
  // Strip duplicate /v1 prefix if present (since baseURL already includes /v1)
  if (config.url) {
    config.url = config.url.replace(/^\/?v1\//, '/');
    // Ensure relative URL doesn't have a leading slash so it merges correctly with baseURL subpath
    if (config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }
  }

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
    if (error.response && error.response.status === 503 && error.response.data?.maintenance) {
      // Clear local states and kick to login if system goes under maintenance
      localStorage.removeItem('redp_token');
      localStorage.removeItem('redp_user');
      alert(error.response.data.message || 'The platform is currently undergoing scheduled maintenance. Please try again later.');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
