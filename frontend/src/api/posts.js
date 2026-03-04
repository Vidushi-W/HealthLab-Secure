import api from './api';

export const getPosts = (params = {}) => api.get('/posts', { params });
export const getPostById = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const getSavedPosts = () => api.get('/posts/saved');

export const addComment = (postId, content) => api.post(`/posts/${postId}/comments`, { content });
export const updateComment = (postId, commentId, content) => api.put(`/posts/${postId}/comments/${commentId}`, { content });
export const deleteComment = (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`);

export const likeToggle = (postId) => api.put(`/posts/${postId}/like`);
export const sharePost = (postId) => api.post(`/posts/${postId}/share`);
export const savePost = (postId) => api.post(`/posts/${postId}/save`);
export const unsavePost = (postId) => api.delete(`/posts/${postId}/save`);
export const reportPost = (postId, reason) => api.post(`/posts/${postId}/report`, { reason });

/** Community AI chatbot: { message, history?: { role, content }[] } => { reply } */
export const sendChatMessage = (payload) => api.post('/posts/chat', payload);
