import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log out user if token is invalid (401 Unauthorized)
    if (error.response?.status === 401) {
      // Only log out if not trying to login or register
      const isAuthRoute =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register');

      if (!isAuthRoute) {
        localStorage.removeItem('token');
        // Reload the page to reset application state
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;