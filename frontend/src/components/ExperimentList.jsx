import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from './common/SmartBadge';

const ExperimentList = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="loading">Loading experiments...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list">
            <h1>Available Experiments</h1>
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
                                <span>Participants: {experiment.currentParticipants} / {experiment.participantLimit === 0 ? 'Unlimited' : experiment.participantLimit}</span>
                            </div>
                            {localStorage.getItem('token') ? (
                                <button className="join-btn" onClick={() => alert(`Join functionality for ${experiment.title} coming soon!`)}>
                                    Join Study
                                </button>
                            ) : (
                                <button className="join-btn btn-secondary" onClick={() => window.location.href = '/login'}>
                                    Login to Join
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
