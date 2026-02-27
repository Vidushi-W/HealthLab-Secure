import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from '../components/common/SmartBadge';

const MyStudies = () => {
    const [studies, setStudies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyStudies = async () => {
            try {
                const response = await api.get('/participations/my-studies');
                setStudies(response.data.studies);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching my studies:', err);
                setError('Failed to load your studies. Please make sure you are logged in.');
                setLoading(false);
            }
        };

        fetchMyStudies();
    }, []);

    const handleLeave = async (participationId) => {
        if (!window.confirm("Are you sure you want to leave this study? This will delete all your log data and you will be unenrolled.")) {
            return;
        }

        try {
            await api.put(`/participations/${participationId}/leave`);
            // Remove from local state
            setStudies(prev => prev.filter(p => p._id !== participationId));
        } catch (err) {
            console.error('Leave study error:', err);
            alert(err.response?.data?.message || 'Failed to leave study.');
        }
    };

    if (loading) return <div className="loading">Loading your enrolled studies...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="experiment-list">
            <div className="recommendation-header">
                <h1>My Enrolled Studies</h1>
                <p className="subtitle">Experiments you are currently participating in</p>
            </div>

            {studies.length === 0 ? (
                <div className="no-data">
                    <p>You haven't joined any studies yet.</p>
                    <a href="/recommended" className="nav-btn" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Browse Recommendations
                    </a>
                </div>
            ) : (
                <div className="experiments-grid">
                    {studies.map((participation) => {
                        const experiment = participation.experimentId;
                        if (!experiment) return null;

                        return (
                            <div key={participation._id} className="experiment-card enrolled">
                                <div className="enrolled-badge">ENROLLED</div>
                                <h2>{experiment.title}</h2>
                                <p className="description">{experiment.description}</p>
                                <div className="experiment-details">
                                    <span>Status: {participation.status}</span>
                                    <span>Joined on: {new Date(participation.dateJoined).toLocaleDateString()}</span>
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="join-btn secondary"
                                        onClick={() => window.location.href = `/dashboard/${participation._id}`}
                                    >
                                        View Dashboard
                                    </button>
                                    <button
                                        className="btn-leave"
                                        onClick={() => handleLeave(participation._id)}
                                    >
                                        Leave Study
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .card-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .card-actions .join-btn {
                    flex: 1;
                    margin-top: 0;
                }
                .btn-leave {
                    padding: 0.8rem 1.5rem;
                    border: 1px solid #dc3545;
                    color: #dc3545;
                    background: transparent;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-leave:hover {
                    background: #dc3545;
                    color: white;
                }
            `}} />
        </div>
    );
};

export default MyStudies;
