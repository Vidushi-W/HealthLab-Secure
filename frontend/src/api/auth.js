import api, { BASE_URL } from './api';
let currentUser = null;
const setCurrentUser = (user) => {
    currentUser = user;
    window.dispatchEvent(new Event('auth-changed'));
};
// Remove credentials and cached identity left by pre-cookie versions.
localStorage.removeItem('token');
sessionStorage.removeItem('token');
localStorage.removeItem('user');
export const restoreSession = async () => {
    try {
        const { data } = await api.get('/auth/profile');
        setCurrentUser(data.user);
    } catch (error) {
        setCurrentUser(null);
        if (![401, 403].includes(error.response?.status)) throw error;
    }
};
export const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register-participant', userData);
    setCurrentUser(data.user);
    return data;
};
export const registerResearcher = async (formData) => {
    const response = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
export const loginUser = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setCurrentUser(data.user);
    return data;
};
export const logoutUser = async () => {
    await api.post('/auth/logout');
    setCurrentUser(null);
};
export const getCurrentUser = () => currentUser;
api.interceptors.response.use(response => response, error => {
    if (error.response?.status === 401 ||
        (error.response?.status === 403 && error.response?.data?.message === 'Account access is restricted')) setCurrentUser(null);
    return Promise.reject(error);
});
export { BASE_URL };
