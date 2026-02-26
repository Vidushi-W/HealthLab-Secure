import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_URL}/register-participant`, userData);
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};
