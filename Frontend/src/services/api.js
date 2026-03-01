import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Track the in-flight refresh so all 401s share one promise
let refreshPromise = null;

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                // Agar koi refresh pahele se nahi chal raha, toh naya start kare
                if(!refreshPromise) {
                    refreshPromise = (async () => {
                        try {
                            const res = await axios.post(`${API_URL}/auth/refresh/`, {
                                refresh: refreshToken
                            });
                            const newAccessToken = res.data.access;
                            localStorage.setItem('access_token', newAccessToken);
                            return newAccessToken;
                        } catch (refreshError) {
                            // agar refresh expire ho jaye toh
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            window.location.href = '/login';
                            throw refreshError;
                        } finally {
                            refreshPromise = null;
                        }
                    })();
                }
                const newToken = await refreshPromise;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

// AUTH ENDPOINTS

/**
 * Register new user
 * POST api/auth/register/
 */
export const register = (email, username, password, passwordConfirm) => {
    return api.post('/auth/register/', {
        email,
        username,
        password,
        password_confirm: passwordConfirm,
    });
}

/**
 * Login User
 * 
 */
export const login = (email, password) => {
    return api.post('/auth/login/', {
        email,
        password,
    });
};

// logout
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// Get profile
export const getProfile = () => {
    return api.get('/auth/profile/');
};

// Resume Endpoints
export const uploadResume = (file, config = {}) => {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('file_name', file.name);
    return api.post('/resumes/', formData, {
        ...config,
        headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Get all resumes for the logged-in user history
export const getResumesHistory = () => {
    return api.get('/resumes/');
};

// Get a single resume Details by ID
export const getResumeDetail = (resumeId) => {
    return api.get(`/resumes/${resumeId}/`);
};

export const deleteResume = (resumeId) => {
    return api.delete(`/resumes/${resumeId}/`);
};

export default api;