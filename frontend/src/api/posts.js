import api from './api';

const uploadsBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';

export const getPosts = (params = {}) => api.get('/posts', { params });
export const getPostById = (id) => api.get(`/posts/${id}`);

/** Create post. If data.imageFile is a File, sends multipart/form-data; otherwise JSON. */
export const createPost = (data) => {
  const imageFile = data && data.imageFile;
  if (imageFile instanceof File) {
    const form = new FormData();
    form.append('title', data.title ?? '');
    form.append('content', data.content ?? '');
    if (data.tags != null) {
      form.append('tags', Array.isArray(data.tags) ? data.tags.join(',') : String(data.tags));
    }
    form.append('image', imageFile);
    return api.post('/posts', form);
  }
  const { imageFile: _, ...json } = data || {};
  return api.post('/posts', json);
};

export function getPostImageUrl(imagePath) {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const base = uploadsBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/uploads/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
}
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
