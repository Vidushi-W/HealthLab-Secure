import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from '../components/common/SmartBadge';

const RecommendationPage = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/recommendations');
                setExperiments(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError('Failed to load recommendations. Make sure you are logged in.');
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const handleJoin = async (experimentId) => {
        setJoiningId(experimentId);
        setMessage({ text: '', type: '' });

        try {
            const response = await api.post('/participations/join', { experimentId });
            setMessage({ text: 'Successfully Enrolled!', type: 'success' });

            // Update local state to show enrolled
            setExperiments(prev => prev.map(exp =>
                exp._id === experimentId ? { ...exp, enrolled: true } : exp
            ));
        } catch (err) {
            console.error('Join error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to join experiment.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setJoiningId(null);
        }
    };

    if (loading) return <div className="loading">Finding the best matches for you...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list">
            <div className="recommendation-header">
                <h1>Recommended For You</h1>
                <p className="subtitle">Based on your health profile and interests</p>
                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>

            {experiments.length === 0 ? (
                <p>No recommendations found yet. Try updating your health profile!</p>
            ) : (
                <div className="experiments-grid">
                    {experiments.map((experiment) => (
                        <div key={experiment._id} className={`experiment-card ${experiment.featured ? 'featured' : ''}`}>
                            <SmartBadge score={experiment.matchScore} reason={experiment.matchReason} />
                            <h2>{experiment.title}</h2>
                            <p className="description">{experiment.description}</p>
                            <div className="experiment-details">
                                <span className="match-score">Match Score: {experiment.matchScore}%</span>
                                <span className="participants">
                                    Participants: {experiment.currentParticipantCount || 0} / {experiment.participantLimit || '∞'}
                                </span>
                            </div>

                            {experiment.enrolled ? (
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

export default RecommendationPage;
