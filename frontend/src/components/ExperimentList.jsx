import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from './common/SmartBadge';

const ExperimentList = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

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

    const handleJoin = async (experimentId) => {
        setJoiningId(experimentId);
        setMessage({ text: '', type: '' });

        try {
            await api.post('/participations/join', { experimentId });
            setMessage({ text: 'Successfully Enrolled!', type: 'success' });

            // Update local state
            setExperiments(prev => prev.map(exp =>
                exp._id === experimentId ? { ...exp, enrolled: true, currentParticipantCount: (exp.currentParticipantCount || 0) + 1 } : exp
            ));
        } catch (err) {
            console.error('Join error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to join experiment.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setJoiningId(null);
        }
    };

    if (loading) return <div className="loading">Loading experiments...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list">
            <h1>Available Experiments</h1>
            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
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
                                    onClick={() => handleJoin(experiment._id)}
                                    disabled={joiningId === experiment._id}
                                >
                                    {joiningId === experiment._id ? 'Joining...' : 'Join Study'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExperimentList;
