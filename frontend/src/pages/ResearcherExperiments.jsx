import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './ResearcherExperiments.css';

const STATUS_OPTIONS = ['draft', 'published', 'closed'];

// Auto-generate a safe key from a label
function generateKey(label) {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
}

const ResearcherExperiments = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingId, setViewingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [generatingAiSummaryId, setGeneratingAiSummaryId] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        status: 'draft',
        participantLimit: 0,
        startDate: '',
        endDate: '',
        applicationDeadline: '',
        conflictTagsInput: '',
        aiSummary: '',
        aiSummaryUpdatedAt: null,
        logFieldDefinitions: [
            {
                label: '',
                key: '',
                type: 'text',
                required: false,
                unit: '',
                optionsInput: '',
            },
        ],
    });

    useEffect(() => {
        if (!userId || (user.role || '').toLowerCase() !== 'researcher') {
            navigate('/login');
            return;
        }
        fetchExperiments();
    }, [userId, user.role]);

    const fetchExperiments = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/experiments');
            const mine = Array.isArray(data) ? data.filter((e) => String(e.ownerId) === String(userId)) : [];
            setExperiments(mine);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load experiments.');
            setExperiments([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setViewingId(null);
        setForm({
            title: '',
            description: '',
            status: 'draft',
            participantLimit: 0,
            startDate: '',
            endDate: '',
            applicationDeadline: '',
            conflictTagsInput: '',
            aiSummary: '',
            aiSummaryUpdatedAt: null,
            logFieldDefinitions: [
                {
                    label: '',
                    key: '',
                    type: 'text',
                    required: false,
                    unit: '',
                    optionsInput: '',
                },
            ],
        });
        setFormOpen(true);
    };

    const openEdit = (exp) => {
        setEditingId(exp._id);
        setViewingId(null);
        setForm({
            title: exp.title || '',
            description: exp.description || '',
            status: exp.status || 'draft',
            participantLimit: exp.participantLimit ?? 0,
            startDate: exp.startDate ? exp.startDate.slice(0, 10) : '',
            endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
            applicationDeadline: exp.applicationDeadline ? exp.applicationDeadline.slice(0, 10) : '',
            conflictTagsInput: Array.isArray(exp.conflictTags) ? exp.conflictTags.join(', ') : '',
            aiSummary: exp.aiSummary || '',
            aiSummaryUpdatedAt: exp.aiSummaryUpdatedAt || null,
            logFieldDefinitions:
                Array.isArray(exp.logFieldDefinitions) && exp.logFieldDefinitions.length > 0
                    ? exp.logFieldDefinitions.map((f) => ({
                        label: f.label || '',
                        key: f.key || '',
                        type: f.type || 'text',
                        required: !!f.required,
                        unit: f.unit || '',
                        optionsInput: Array.isArray(f.options) ? f.options.join(', ') : '',
                    }))
                    : [
                        {
                            label: '',
                            key: '',
                            type: 'text',
                            required: false,
                            unit: '',
                            optionsInput: '',
                        },
                    ],
        });
        setFormOpen(true);
    };

    const openView = (exp) => {
        setViewingId(exp._id);
        setEditingId(null);
        setForm({
            title: exp.title || '',
            description: exp.description || '',
            status: exp.status || 'draft',
            participantLimit: exp.participantLimit ?? 0,
            startDate: exp.startDate ? exp.startDate.slice(0, 10) : '',
            endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
            applicationDeadline: exp.applicationDeadline ? exp.applicationDeadline.slice(0, 10) : '',
            conflictTagsInput: Array.isArray(exp.conflictTags) ? exp.conflictTags.join(', ') : '',
            aiSummary: exp.aiSummary || '',
            aiSummaryUpdatedAt: exp.aiSummaryUpdatedAt || null,
            logFieldDefinitions:
                Array.isArray(exp.logFieldDefinitions) && exp.logFieldDefinitions.length > 0
                    ? exp.logFieldDefinitions.map((f) => ({
                        label: f.label || '',
                        key: f.key || '',
                        type: f.type || 'text',
                        required: !!f.required,
                        unit: f.unit || '',
                        optionsInput: Array.isArray(f.options) ? f.options.join(', ') : '',
                    }))
                    : [
                        {
                            label: '',
                            key: '',
                            type: 'text',
                            required: false,
                            unit: '',
                            optionsInput: '',
                        },
                    ],
        });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingId(null);
        setViewingId(null);
        setDeleteConfirmId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'participantLimit' ? (value === '' ? 0 : parseInt(value, 10) || 0) : value,
        }));
    };

    const handleLogFieldChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            logFieldDefinitions: prev.logFieldDefinitions.map((f, i) => {
                if (i !== index) return f;
                // When label changes, also regenerate the key automatically
                if (field === 'label') {
                    const newLabel = value;
                    const newKey = generateKey(newLabel);
                    return { ...f, label: newLabel, key: newKey };
                }
                return { ...f, [field]: value };
            }),
        }));
    };

    const handleLogFieldToggleRequired = (index) => {
        setForm((prev) => ({
            ...prev,
            logFieldDefinitions: prev.logFieldDefinitions.map((f, i) =>
                i === index ? { ...f, required: !f.required } : f
            ),
        }));
    };

    const addLogField = () => {
        setForm((prev) => ({
            ...prev,
            logFieldDefinitions: [
                ...prev.logFieldDefinitions,
                {
                    label: '',
                    key: '',
                    type: 'text',
                    required: false,
                    unit: '',
                    optionsInput: '',
                },
            ],
        }));
    };

    const removeLogField = (index) => {
        setForm((prev) => {
            if (prev.logFieldDefinitions.length === 1) return prev;
            return {
                ...prev,
                logFieldDefinitions: prev.logFieldDefinitions.filter((_, i) => i !== index),
            };
        });
    };

    const handleGenerateAiSummary = async () => {
        if (!viewingId) return;
        try {
            setGeneratingAiSummaryId(viewingId);
            setError('');
            const { data } = await api.post(`/experiments/${viewingId}/ai-summary`);
            setForm((prev) => ({
                ...prev,
                aiSummary: data.aiSummary || '',
                aiSummaryUpdatedAt: data.aiSummaryUpdatedAt || null,
            }));
            setExperiments((prev) =>
                prev.map((e) =>
                    e._id === viewingId
                        ? { ...e, aiSummary: data.aiSummary, aiSummaryUpdatedAt: data.aiSummaryUpdatedAt }
                        : e
                )
            );
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate AI summary.');
        } finally {
            setGeneratingAiSummaryId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Title is required.');
            return;
        }
        try {
            setSubmitting(true);
            setError('');
            const conflictTags = form.conflictTagsInput
                ? form.conflictTagsInput.split(',').map((t) => t.trim()).filter(Boolean)
                : [];
            const logFieldDefinitions = form.logFieldDefinitions.map((f) => ({
                label: f.label.trim(),
                key: f.key.trim(),
                type: f.type,
                required: !!f.required,
                unit: f.unit?.trim() || undefined,
                options: f.optionsInput
                    ? f.optionsInput.split(',').map((o) => o.trim()).filter(Boolean)
                    : undefined,
            }));
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                status: form.status,
                participantLimit: form.participantLimit,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
                applicationDeadline: form.applicationDeadline || undefined,
                conflictTags,
                logFieldDefinitions,
            };
            if (editingId) {
                await api.put(`/experiments/${editingId}`, payload);
            } else {
                await api.post('/experiments', payload);
            }
            closeForm();
            fetchExperiments();
        } catch (err) {
            setError(err.response?.data?.message || (editingId ? 'Failed to update experiment.' : 'Failed to create experiment.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setSubmitting(true);
            setError('');
            await api.delete(`/experiments/${id}`);
            setDeleteConfirmId(null);
            fetchExperiments();
            if (viewingId === id || editingId === id) closeForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete experiment.');
        } finally {
            setSubmitting(false);
        }
    };

    const isView = !!viewingId;
    const isEdit = !!editingId;

    if (!userId) return null;

    return (
        <div className="researcher-experiments">
            <div className="researcher-experiments-header">
                <h1>My Experiments</h1>
                <p className="subtitle">Create, edit, and manage your research experiments.</p>
                <button type="button" className="btn btn-primary create-btn" onClick={openCreate}>
                    + New Experiment
                </button>
            </div>

            {error && <div className="researcher-error">{error}</div>}

            {loading ? (
                <div className="researcher-loading">Loading your experiments...</div>
            ) : (
                <div className="researcher-table-wrap">
                    {experiments.length === 0 ? (
                        <p className="researcher-empty">You have no experiments yet. Create one to get started.</p>
                    ) : (
                        <table className="researcher-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Participants</th>
                                    <th>Dates</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {experiments.map((exp) => (
                                    <tr key={exp._id}>
                                        <td className="title-cell">{exp.title}</td>
                                        <td>
                                            <span className={`badge status-${exp.status}`}>{exp.status}</span>
                                        </td>
                                        <td>
                                            {exp.currentParticipantCount ?? 0} / {exp.participantLimit === 0 ? '∞' : exp.participantLimit}
                                        </td>
                                        <td className="dates-cell">
                                            {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '—'} – {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="actions-cell">
                                            <button type="button" className="btn btn-view" onClick={() => openView(exp)}>View</button>
                                            <button type="button" className="btn btn-edit" onClick={() => openEdit(exp)}>Edit</button>
                                            {deleteConfirmId === exp._id ? (
                                                <>
                                                    <span className="confirm-text">Delete?</span>
                                                    <button type="button" className="btn btn-delete-confirm" onClick={() => handleDelete(exp._id)} disabled={submitting}>Yes</button>
                                                    <button type="button" className="btn btn-cancel" onClick={() => setDeleteConfirmId(null)}>No</button>
                                                </>
                                            ) : (
                                                <button type="button" className="btn btn-delete" onClick={() => setDeleteConfirmId(exp._id)}>Delete</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {formOpen && (
                <div className="researcher-modal-overlay" onClick={closeForm}>
                    <div className="researcher-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="researcher-modal-header">
                            <h2>{isView ? 'View Experiment' : isEdit ? 'Edit Experiment' : 'Create Experiment'}</h2>
                            <button type="button" className="btn-close" onClick={closeForm} aria-label="Close">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="researcher-form">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input name="title" className="form-input" value={form.title} onChange={handleChange} required readOnly={isView} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-input" rows={3} value={form.description} onChange={handleChange} readOnly={isView} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled={isView}>
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Participant limit (0 = unlimited)</label>
                                <input name="participantLimit" type="number" min={0} className="form-input" value={form.participantLimit} onChange={handleChange} readOnly={isView} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Start date</label>
                                    <input name="startDate" type="date" className="form-input" value={form.startDate} onChange={handleChange} readOnly={isView} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End date</label>
                                    <input name="endDate" type="date" className="form-input" value={form.endDate} onChange={handleChange} readOnly={isView} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Application deadline</label>
                                <input name="applicationDeadline" type="date" className="form-input" value={form.applicationDeadline} onChange={handleChange} readOnly={isView} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Conflict tags (comma-separated)</label>
                                <input
                                    name="conflictTagsInput"
                                    className="form-input"
                                    placeholder="e.g. cardio, strength"
                                    value={form.conflictTagsInput}
                                    onChange={handleChange}
                                    readOnly={isView}
                                />
                            </div>
                            {isView && (
                                <div className="form-group ai-summary-section">
                                    <label className="form-label">AI Summary</label>
                                    {form.aiSummary ? (
                                        <div className="ai-summary-content">{form.aiSummary}</div>
                                    ) : (
                                        <p className="ai-summary-placeholder">No AI summary yet. Generate one from participant data.</p>
                                    )}
                                    {form.aiSummaryUpdatedAt && (
                                        <p className="ai-summary-meta">Last updated: {new Date(form.aiSummaryUpdatedAt).toLocaleString()}</p>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleGenerateAiSummary}
                                        disabled={generatingAiSummaryId === viewingId}
                                    >
                                        {generatingAiSummaryId === viewingId ? 'Generating...' : 'Generate AI summary'}
                                    </button>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Participant input fields</label>
                                <p className="helper-text">
                                    Define the fields participants will fill in their daily logs (label, key, type, etc.).
                                </p>
                                {form.logFieldDefinitions.map((field, index) => (
                                    <div key={index} className="log-field-row">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Label</label>
                                                <input
                                                    className="form-input"
                                                    value={field.label}
                                                    onChange={(e) => handleLogFieldChange(index, 'label', e.target.value)}
                                                    readOnly={isView}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Type</label>
                                                <select
                                                    className="form-select"
                                                    value={field.type}
                                                    onChange={(e) => handleLogFieldChange(index, 'type', e.target.value)}
                                                    disabled={isView}
                                                >
                                                    <option value="number">number</option>
                                                    <option value="text">text</option>
                                                    <option value="boolean">boolean</option>
                                                    <option value="date">date</option>
                                                    <option value="time">time</option>
                                                    <option value="select">select</option>
                                                    <option value="multi-select">multi-select</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Unit (optional)</label>
                                                <input
                                                    className="form-input"
                                                    value={field.unit}
                                                    onChange={(e) => handleLogFieldChange(index, 'unit', e.target.value)}
                                                    readOnly={isView}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Options (for select, comma-separated)</label>
                                                <input
                                                    className="form-input"
                                                    value={field.optionsInput}
                                                    onChange={(e) => handleLogFieldChange(index, 'optionsInput', e.target.value)}
                                                    readOnly={isView}
                                                />
                                            </div>
                                            <div className="form-group checkbox-group">
                                                <label className="form-label">Required</label>
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={() => handleLogFieldToggleRequired(index)}
                                                    disabled={isView}
                                                />
                                            </div>
                                        </div>
                                        {!isView && (
                                            <div className="log-field-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => removeLogField(index)}
                                                    disabled={form.logFieldDefinitions.length === 1}
                                                >
                                                    Remove field
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!isView && (
                                    <button type="button" className="btn btn-secondary" onClick={addLogField}>
                                        + Add field
                                    </button>
                                )}
                            </div>
                            {!isView && (
                                <div className="researcher-form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            )}
                            {isView && (
                                <div className="researcher-form-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            const exp = experiments.find((e) => e._id === viewingId);
                                            if (exp) {
                                                setViewingId(null);
                                                setEditingId(exp._id);
                                                setForm({
                                                    title: exp.title || '',
                                                    description: exp.description || '',
                                                    status: exp.status || 'draft',
                                                    participantLimit: exp.participantLimit ?? 0,
                                                    startDate: exp.startDate ? exp.startDate.slice(0, 10) : '',
                                                    endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
                                                    applicationDeadline: exp.applicationDeadline ? exp.applicationDeadline.slice(0, 10) : '',
                                                    conflictTagsInput: Array.isArray(exp.conflictTags) ? exp.conflictTags.join(', ') : '',
                                                    aiSummary: exp.aiSummary || '',
                                                    aiSummaryUpdatedAt: exp.aiSummaryUpdatedAt || null,
                                                    logFieldDefinitions:
                                                        Array.isArray(exp.logFieldDefinitions) && exp.logFieldDefinitions.length > 0
                                                            ? exp.logFieldDefinitions.map((f) => ({
                                                                label: f.label || '',
                                                                key: f.key || '',
                                                                type: f.type || 'text',
                                                                required: !!f.required,
                                                                unit: f.unit || '',
                                                                optionsInput: Array.isArray(f.options) ? f.options.join(', ') : '',
                                                            }))
                                                            : [
                                                                {
                                                                    label: '',
                                                                    key: '',
                                                                    type: 'text',
                                                                    required: false,
                                                                    unit: '',
                                                                    optionsInput: '',
                                                                },
                                                            ],
                                                });
                                            }
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={closeForm}>Close</button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResearcherExperiments;
