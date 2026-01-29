import axios from 'axios';

// Get the base URL from environment variables, with a fallback for local development
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.zyrax.fit/';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor to add the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional but recommended: Interceptor to handle token expiry and refresh automatically
// This is a more advanced pattern that centralizes the logic from AdminClassesPage
api.interceptors.response.use(
  (response) => response, // Simply return the successful response
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't already retried the request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we've retried this request

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Attempt to get a new access token using the refresh token
          const { data } = await axios.post(`${API_BASE_URL}/zyrax/refresh/`, {
            refresh: refreshToken,
          });

          // Store the new access token
          localStorage.setItem('accessToken', data.access);
          
          // Update the authorization header for the original request and retry it
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, log out the user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login'; // Force a redirect to login
          return Promise.reject(refreshError);
        }
      }
    }
    // For any other errors, just reject the promise
    return Promise.reject(error);
  }
);


export default api;