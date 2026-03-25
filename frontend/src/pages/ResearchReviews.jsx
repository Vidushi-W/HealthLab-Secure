import React, { useState, useEffect } from 'react';
import api from '../api/api';

const ResearchReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [form, setForm] = useState({
        title: '',
        summary: '',
        content: '',
        status: 'draft',
    });

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await api.get('/reviews');
                const items = res.data?.data?.items || [];
                setReviews(items);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load reviews.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm({
            title: '',
            summary: '',
            content: '',
            status: 'draft',
        });
        setFormOpen(true);
    };

    const openEdit = (review) => {
        setEditingId(review._id);
        setForm({
            title: review.title || '',
            summary: review.summary || review.abstract || '',
            content: review.content || '',
            status: review.status || 'draft',
        });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await api.put(`/reviews/${editingId}`, {
                    title: form.title.trim(),
                    summary: form.summary.trim(),
                    content: form.content.trim(),
                    status: form.status,
                });
            } else {
                await api.post('/reviews', {
                    title: form.title.trim(),
                    summary: form.summary.trim(),
                    content: form.content.trim(),
                    status: form.status,
                });
            }
            closeForm();
            const res = await api.get('/reviews');
            const items = res.data?.data?.items || [];
            setReviews(items);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save review.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            setDeletingId(id);
            setError('');
            await api.delete(`/reviews/${id}`);
            setReviews((prev) => prev.filter((r) => r._id !== id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete review.');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div className="researcher-loading">Loading your research reviews...</div>;
    }

    return (
        <div className="researcher-experiments">
            <div className="researcher-experiments-header">
                <h1>Research Reviews</h1>
                <p className="subtitle">
                    Create, edit, and publish summaries of your research findings.
                </p>
                <button
                    type="button"
                    className="btn btn-primary create-btn"
                    onClick={openCreate}
                >
                    + New Review
                </button>
            </div>

            {error && <div className="researcher-error">{error}</div>}

            {reviews.length === 0 ? (
                <p className="researcher-empty">
                    You have no research reviews yet. Create one to get started.
                </p>
            ) : (
                <div className="researcher-table-wrap">
                    <table className="researcher-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((review) => (
                                <tr key={review._id}>
                                    <td className="title-cell">{review.title}</td>
                                    <td>
                                        <span className={`badge status-${review.status}`}>
                                            {review.status}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            type="button"
                                            className="btn btn-edit"
                                            onClick={() => openEdit(review)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-delete"
                                            onClick={() => handleDelete(review._id)}
                                            disabled={deletingId === review._id}
                                        >
                                            {deletingId === review._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {formOpen && (
                <div className="researcher-modal-overlay" onClick={closeForm}>
                    <div className="researcher-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="researcher-modal-header">
                            <h2>{editingId ? 'Edit Review' : 'New Review'}</h2>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeForm}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="researcher-form">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    name="title"
                                    className="form-input"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Summary</label>
                                <textarea
                                    name="summary"
                                    className="form-input"
                                    rows={3}
                                    value={form.summary}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Content</label>
                                <textarea
                                    name="content"
                                    className="form-input"
                                    rows={6}
                                    value={form.content}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div className="researcher-form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeForm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResearchReviews;

