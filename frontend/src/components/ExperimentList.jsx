import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from './common/SmartBadge';

const ExperimentList = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '', reason: '', explanation: '' });
    const [analysis, setAnalysis] = useState(null); // { text: string }
    const [showModal, setShowModal] = useState(false);
    const [previewingId, setPreviewingId] = useState(null);
    const [safetyGuidelines, setSafetyGuidelines] = useState(null);
    const [loadingSafety, setLoadingSafety] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const handleFetchSafety = async (experimentId) => {
        setLoadingSafety(true);
        try {
            const response = await api.get(`/experiments/${experimentId}/safety-guidelines`);
            setSafetyGuidelines({
                guidelines: response.data.guidelines,
                source: response.data.source
            });
        } catch (err) {
            console.error('Safety guidelines fetch error:', err);
        } finally {
            setLoadingSafety(false);
        }
    };

    useEffect(() => {
        const fetchExperiments = async () => {
            try {
                const token = localStorage.getItem('token');
                let response;

                if (token) {
                    // Fetch recommendations (which are experiments + match score)
                    response = await api.get('/recommendations');
                } else {
                    response = await api.get('/experiments');
                }

                setExperiments(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching experiments:', err);
                setError('Failed to load experiments. Please try again later.');
                setLoading(false);
            }
        };

        fetchExperiments();
    }, []);

    const handlePreviewJoin = async (experimentId) => {
        setPreviewingId(experimentId);
        setMessage({ text: '', type: '', reason: '', explanation: '' });
        setSafetyGuidelines(null);
        setExpandedIndex(null);

        try {
            const response = await api.get(`/participations/preview-analysis/${experimentId}`);
            setAnalysis({ text: response.data.analysis, experimentId });
            setShowModal(true);
        } catch (err) {
            console.error('Preview error:', err);
            const data = err.response?.data || {};
            setMessage({
                text: data.message || 'Failed to generate clinical analysis.',
                type: 'error',
                reason: data.reason || '',
                explanation: data.explanation || ''
            });
        } finally {
            setPreviewingId(null);
        }
    };

    const handleJoin = async (experimentId) => {
        setJoiningId(experimentId);
        setMessage({ text: '', type: '' });

        try {
            await api.post('/participations/join', { experimentId });
            setMessage({ text: 'Successfully Enrolled!', type: 'success', reason: '', explanation: '' });

            // Update local state
            setExperiments(prev => prev.map(exp =>
                exp._id === experimentId ? { ...exp, enrolled: true, currentParticipantCount: (exp.currentParticipantCount || 0) + 1 } : exp
            ));
        } catch (err) {
            console.error('Join error:', err);
            const data = err.response?.data || {};
            const errorMsg = data.message || 'Failed to join experiment.';
            setMessage({
                text: errorMsg,
                type: 'error',
                reason: data.reason || '',
                explanation: data.explanation || ''
            });
        } finally {
            setJoiningId(null);
            setShowModal(false);
            setAnalysis(null);
            setSafetyGuidelines(null);
            setExpandedIndex(null);
        }
    };

    if (loading) return <div className="loading">Loading experiments...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list" style={{ position: 'relative', zIndex: 1, minHeight: '80vh' }}>
            <h1>Available Experiments</h1>
            {message.text && (
                <div className={`alert alert-${message.type}`} style={{ textAlign: 'left', padding: '1.5rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: message.explanation ? '0.5rem' : '0' }}>{message.text}</div>
                    {message.reason && (
                        <div style={{ fontSize: '0.9rem', color: '#721c24', marginBottom: '0.5rem' }}>
                            <strong>Justification:</strong> {message.reason}
                        </div>
                    )}
                    {message.explanation && (
                        <div style={{ fontSize: '0.85rem', color: '#555', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            {message.explanation}
                        </div>
                    )}
                </div>
            )}
            {experiments.length === 0 ? (
                <p>No experiments available at the moment.</p>
            ) : (
                <div className="experiments-grid">
                    {experiments.map((experiment) => (
                        <div key={experiment._id} className="experiment-card">
                            <SmartBadge score={experiment.matchScore} reason={experiment.matchReason} />
                            <h2>{experiment.title}</h2>
                            <p className="description">{experiment.description}</p>
                            <div className="status-badge" data-status={experiment.status}>
                                {experiment.status}
                            </div>
                            <div className="experiment-details">
                                <span>Participants: {experiment.currentParticipantCount || 0} / {experiment.participantLimit === 0 ? 'Unlimited' : experiment.participantLimit}</span>
                            </div>

                            {!localStorage.getItem('token') ? (
                                <button className="join-btn btn-secondary" onClick={() => window.location.href = '/login'}>
                                    Login to Join
                                </button>
                            ) : experiment.enrolled ? (
                                <button className="join-btn enrolled" disabled>
                                    Enrolled
                                </button>
                            ) : (
                                <button
                                    className="join-btn"
                                    onClick={() => handlePreviewJoin(experiment._id)}
                                    disabled={previewingId === experiment._id || joiningId === experiment._id}
                                >
                                    {previewingId === experiment._id ? 'Analyzing...' : 'Join Study'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* CLINICAL INSIGHT MODAL (Year 3 Clinical-Grade Feature) */}
            {showModal && analysis && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center',
                    alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white', padding: '2.5rem', borderRadius: '15px',
                        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        position: 'relative', border: '1px solid var(--primary-light)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f0f7ff', paddingBottom: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🧠</div>
                            <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.5rem' }}>Personalized Clinical Insight</h2>
                        </div>

                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#444', marginBottom: '2rem', fontStyle: 'italic' }}>
                            "{analysis.text}"
                        </p>

                        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', fontSize: '0.9rem', color: '#666' }}>
                            <strong>Note:</strong> This analysis is generated based on your medical profile (Weight, BMI, and Diseases) using our Clinical NLP engine.
                        </div>

                        {/* WGER SAFETY INTEGRATION (Year 3 System Integrity Feature) */}
                        <div style={{ marginBottom: '2rem' }}>
                            {!safetyGuidelines ? (
                                <button
                                    className="btn"
                                    onClick={() => handleFetchSafety(analysis.experimentId)}
                                    disabled={loadingSafety}
                                    style={{
                                        backgroundColor: '#e7f3ff', color: '#007bff', border: '1px solid #007bff',
                                        fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {loadingSafety ? 'Fetching Clinical Guidelines...' : '🛡️ View Activity Safety Guidelines'}
                                </button>
                            ) : (
                                <div style={{
                                    border: '1px solid #cce5ff', backgroundColor: '#f0f7ff',
                                    padding: '1rem', borderRadius: '8px', fontSize: '0.9rem'
                                }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#004085', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>📋 Activity Protocol</span>
                                    </h4>
                                    {safetyGuidelines.guidelines.map((g, idx) => (
                                        <div key={idx} style={{
                                            marginBottom: idx < safetyGuidelines.guidelines.length - 1 ? '0.75rem' : 0,
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            backgroundColor: expandedIndex === idx ? '#fff' : 'transparent',
                                            border: expandedIndex === idx ? '1px solid #dee2e6' : 'none'
                                        }}>
                                            <div
                                                style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                            >
                                                <span>{g.name}</span>
                                                <span style={{ fontSize: '0.7rem', color: '#007bff' }}>{expandedIndex === idx ? '▲ Collapse' : '▼ View Advanced Protocol'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#666' }}>
                                                <span><strong>Target:</strong> {g.muscleGroup}</span>
                                                <span><strong>Intensity:</strong> {g.intensity}</span>
                                            </div>
                                            <div style={{ color: '#856404', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                                <strong>⚠️ Safety:</strong> {g.safetyWarning}
                                            </div>

                                            {/* Advanced Protocol Drill-Down */}
                                            {expandedIndex === idx && g.advancedProtocol && (
                                                <div style={{
                                                    marginTop: '0.75rem', padding: '0.75rem', borderTop: '1px dashed #dee2e6',
                                                    fontSize: '0.8rem', color: '#444', animation: 'fadeIn 0.3s'
                                                }}>
                                                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>Engaged Muscles:</strong> {g.advancedProtocol.muscles.join(", ") || "N/A"}</p>
                                                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>Equipment:</strong> {g.advancedProtocol.equipment.join(", ")}</p>
                                                    <p style={{ margin: '0', fontStyle: 'italic', color: '#555' }}><strong>Instructions:</strong> {g.advancedProtocol.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem', textAlign: 'right' }}>
                                        Source: {safetyGuidelines.source}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowModal(false);
                                    setSafetyGuidelines(null);
                                    setExpandedIndex(null);
                                }}
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleJoin(analysis.experimentId)}
                                disabled={joiningId === analysis.experimentId}
                                style={{ padding: '0.75rem 2rem', fontWeight: 'bold' }}
                            >
                                {joiningId === analysis.experimentId ? 'Enrolling...' : 'Confirm Enrollment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperimentList;
