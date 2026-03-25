import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';

const StudyDashboard = () => {
    const { participationId } = useParams();
    const [participation, setParticipation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formValues, setFormValues] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get(`/participations/${participationId}`);
                setParticipation(response.data);

                // Initialize form values with today's log if it exists
                const initialValues = {};
                const today = new Date().toISOString().split('T')[0];
                const todayLog = (response.data.logs || []).find(log => log.date === today);

                response.data.experimentId.logFieldDefinitions.forEach(field => {
                    if (todayLog && todayLog.data && todayLog.data[field.key] !== undefined) {
                        initialValues[field.key] = todayLog.data[field.key];
                    } else if (field.type === 'boolean') {
                        initialValues[field.key] = false;
                    } else {
                        initialValues[field.key] = '';
                    }
                });
                setFormValues(initialValues);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard. Please make sure you are logged in.');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [participationId]);

    const handleInputChange = (key, value) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const calculateProgress = () => {
        const start = new Date(participation.experimentId.publishedAt || participation.dateJoined);
        const end = participation.experimentId.endDate ? new Date(participation.experimentId.endDate) : null;
        const now = new Date();

        if (!end) return { percentage: 0, daysRemaining: null };

        const totalDuration = end - start;
        const elapsed = now - start;
        const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

        const percentage = Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));

        return { percentage, daysRemaining: remaining };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await api.post(`/participations/${participationId}/logs`, {
                logData: formValues
            });
            setMessage({ text: response.data.message, type: 'success' });

            // Update local participation state
            const today = new Date().toISOString().split('T')[0];
            setParticipation(prev => {
                const logs = [...prev.logs];
                const existingIdx = logs.findIndex(l => l.date === today);
                if (existingIdx !== -1) {
                    logs[existingIdx] = { ...logs[existingIdx], data: formValues, submittedAt: new Date() };
                } else {
                    logs.push({ date: today, data: formValues, submittedAt: new Date() });
                }
                return { ...prev, logs };
            });
        } catch (err) {
            console.error('Submit log error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to submit log.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLog = async () => {
        if (!window.confirm("Are you sure you want to delete today's log entry? This cannot be undone.")) {
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.delete(`/participations/${participationId}/logs/today`);
            setMessage({ text: response.data.message, type: 'success' });

            // Reset form to empty values
            const emptyValues = {};
            experiment.logFieldDefinitions.forEach(field => {
                if (field.type === 'boolean') emptyValues[field.key] = false;
                else emptyValues[field.key] = '';
            });
            setFormValues(emptyValues);

            // Update local participation state
            setParticipation(prev => ({
                ...prev,
                logs: response.data.logs
            }));
        } catch (err) {
            console.error('Delete log error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to delete log.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading study dashboard...</div>;
    if (error) return <div className="error">{error}</div>;

    const experiment = participation.experimentId;
    const today = new Date().toISOString().split('T')[0];
    const alreadyLoggedToday = participation.logs.some(log => log.date === today);

    return (
        <div className="experiment-list dashboard">
            <div className="recommendation-header">
                <a href="/my-studies" className="back-link">← Back to My Studies</a>
                <h1>{experiment.title}</h1>
                <p className="subtitle">Participant Command Center</p>
            </div>

            <div className="dashboard-content">
                <div className="study-info-card">
                    <h3>Study Overview</h3>
                    <p>{experiment.description}</p>

                    <div className="progress-tracker">
                        <div className="progress-header">
                            <span>Study Progress</span>
                            {calculateProgress().daysRemaining !== null && (
                                <span className="days-left">{calculateProgress().daysRemaining} days left</span>
                            )}
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${calculateProgress().percentage}%` }}
                            ></div>
                        </div>
                        <div className="progress-footer">
                            <span>Published: {new Date(experiment.publishedAt || participation.dateJoined).toLocaleDateString()}</span>
                            {experiment.endDate && (
                                <span>Ends: {new Date(experiment.endDate).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>

                    <div className="experiment-details">
                        <span>Joined: {new Date(participation.dateJoined).toLocaleDateString()}</span>
                        <span>Logs Submitted: {participation.logs.length}</span>
                    </div>
                </div>

                <div className="log-form-card">
                    <h2>{alreadyLoggedToday ? "Update Today's Log" : "Daily Progress Log"}</h2>
                    <p className="date-display">Date: {new Date().toLocaleDateString()}</p>

                    {message.text && (
                        <div className={`alert alert-${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="dynamic-form">
                        {experiment.logFieldDefinitions.map((field) => (
                            <div key={field.key} className="form-group">
                                <label htmlFor={field.key}>
                                    {field.label} {field.required && <span className="required">*</span>}
                                    {field.unit && <span className="unit">({field.unit})</span>}
                                </label>

                                {field.type === 'number' && (
                                    <input
                                        id={field.key}
                                        type="number"
                                        value={formValues[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        required={field.required}
                                        min={field.min}
                                        max={field.max}
                                        placeholder={field.helpText}
                                    />
                                )}

                                {field.type === 'text' && (
                                    <textarea
                                        id={field.key}
                                        value={formValues[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        required={field.required}
                                        placeholder={field.helpText}
                                    />
                                )}

                                {field.type === 'boolean' && (
                                    <div className="checkbox-group">
                                        <input
                                            id={field.key}
                                            type="checkbox"
                                            checked={formValues[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.checked)}
                                        />
                                        <span>{field.helpText || 'Yes / No'}</span>
                                    </div>
                                )}

                                {field.type === 'select' && (
                                    <select
                                        id={field.key}
                                        value={formValues[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        required={field.required}
                                    >
                                        <option value="">Select an option</option>
                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                )}
                            </div>
                        ))}

                        <button type="submit" className="join-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : alreadyLoggedToday ? 'Update Log' : 'Submit Daily Log'}
                        </button>
                    </form>

                    {alreadyLoggedToday && (
                        <div className="edit-actions">
                            <p className="edit-info">You can update your log until midnight today.</p>
                            <button
                                type="button"
                                className="delete-btn"
                                onClick={handleDeleteLog}
                                disabled={submitting}
                            >
                                {submitting ? '...' : 'Delete Today\'s Entry'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="history-section">
                <h2>Log History</h2>
                {participation.logs.length === 0 ? (
                    <p>No logs submitted yet.</p>
                ) : (
                    <div className="history-table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    {experiment.logFieldDefinitions.map(f => <th key={f.key}>{f.label}</th>)}
                                    <th>Submitted At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...participation.logs].sort((a, b) => b.date.localeCompare(a.date)).map((log, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(log.date).toLocaleDateString()}</td>
                                        {experiment.logFieldDefinitions.map(f => (
                                            <td key={f.key}>
                                                {log.data[f.key] === true ? 'Yes' : log.data[f.key] === false ? 'No' : log.data[f.key]}
                                            </td>
                                        ))}
                                        <td>{new Date(log.submittedAt).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .study-info-card, .log-form-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .back-link {
                    display: block;
                    margin-bottom: 1rem;
                    color: var(--primary-color);
                    text-decoration: none;
                }
                .progress-tracker {
                    margin: 1.5rem 0;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .days-left {
                    color: var(--primary-color);
                }
                .progress-bar-container {
                    height: 10px;
                    background: #e9ecef;
                    border-radius: 5px;
                    overflow: hidden;
                    margin-bottom: 0.5rem;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4caf50, #81c784);
                    transition: width 0.3s ease;
                }
                .progress-footer {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                .date-display {
                    font-weight: bold;
                    color: #666;
                    margin-bottom: 2rem;
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 0.8rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                }
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .checkbox-group input {
                    width: auto;
                }
                .required { color: red; }
                .unit { color: #888; font-size: 0.9rem; margin-left: 0.5rem; }
                .success-message {
                    text-align: center;
                    padding: 3rem;
                }
                .check-icon {
                    font-size: 4rem;
                    color: #28a745;
                    margin-bottom: 1rem;
                }
                @media (max-width: 768px) {
                    .dashboard-content {
                        grid-template-columns: 1fr;
                    }
                }
                .history-section {
                    margin-top: 3rem;
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .history-table-container {
                    overflow-x: auto;
                    margin-top: 1rem;
                }
                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .history-table th, .history-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #eee;
                }
                .history-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                }
                .edit-actions {
                    margin-top: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid #eee;
                }
                .delete-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: background 0.2s;
                }
                .delete-btn:hover {
                    background: #c82333;
                }
                .delete-btn:disabled {
                    background: #e4606d;
                    cursor: not-allowed;
                }
                .enrolled {
                    background: #6c757d;
                }
            `}} />
        </div>
    );
};

export default StudyDashboard;
