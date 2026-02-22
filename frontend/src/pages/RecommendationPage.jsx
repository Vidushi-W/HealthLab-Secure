import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from '../components/common/SmartBadge';

const RecommendationPage = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="loading">Finding the best matches for you...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list">
            <div className="recommendation-header">
                <h1>Recommended For You</h1>
                <p className="subtitle">Based on your health profile and interests</p>
            </div>

            {experiments.length === 0 ? (
                <p>No recommendations found yet. Try updating your health profile!</p>
            ) : (
                <div className="experiments-grid">
                    {experiments.map((experiment) => (
                        <div key={experiment._id} className="experiment-card featured">
                            <SmartBadge score={experiment.matchScore} reason={experiment.matchReason} />
                            <h2>{experiment.title}</h2>
                            <p className="description">{experiment.description}</p>
                            <div className="experiment-details">
                                <span>Match Score: {experiment.matchScore}%</span>
                            </div>
                            <button className="join-btn" onClick={() => alert('Enrollment coming soon!')}>
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecommendationPage;
