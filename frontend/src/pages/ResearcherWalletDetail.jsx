import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { getExperimentWallet, getMyFundRequests } from '../api/funds';
import './ResearcherWallet.css';

const ResearcherWalletDetail = () => {
    const { experimentId } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId || (user.role || '').toLowerCase() !== 'researcher') {
            navigate('/login');
            return;
        }
        fetchDetail();
    }, [experimentId, userId]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Get experiment basic info
            const { data: experiment } = await api.get(`/experiments/${experimentId}`);

            // 2. Get wallet info
            const { data: wallet } = await getExperimentWallet(experimentId);

            // 3. Get fund request info
            const { data: myFundRequests } = await getMyFundRequests();
            const fundReq = (myFundRequests || []).find(r =>
                (r.experimentId?._id || r.experimentId) === experimentId &&
                ['OPEN_FOR_FUNDING', 'FUNDED', 'CLOSED'].includes(r.status)
            );

            setData({ experiment, wallet, fundReq });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load experiment details.');
        } finally {
            setLoading(false);
        }
    };

    const calcPct = (raised, target) => target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

    if (loading) return <div className="wallet-loading">Loading details...</div>;
    if (error) return <div className="wallet-error">{error}</div>;
    if (!data) return <div className="wallet-empty">No data found.</div>;

    const { experiment, wallet, fundReq } = data;
    const percentage = fundReq ? calcPct(fundReq.raisedAmount, fundReq.targetAmount) : 0;

    return (
        <div className="researcher-wallet-page">
            <section className="wallet-hero">
                <div className="wallet-hero-overlay" aria-hidden />
                <div className="wallet-hero-inner">
                    <div className="hero-top-nav">
                        <Link to="/researcher/wallet" className="btn-back">← Back to Wallet</Link>
                    </div>
                    <h1>📊 Funding Graph</h1>
                    <p className="subtitle">{experiment.title}</p>
                </div>
            </section>

            <div className="wallet-detail-panel standalone">
                <div className="detail-header">
                    <h3>📈 Funding Performance</h3>
                    <span className="detail-status-pill">{fundReq?.status.replace(/_/g, ' ') || experiment.status}</span>
                </div>

                <div className="funding-graph-container">
                    <div className="graph-stats">
                        <div className="stat-item">
                            <span className="stat-label">Raised Amount</span>
                            <span className="stat-value">LKR {fundReq?.raisedAmount.toLocaleString() || '0'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Target Goal</span>
                            <span className="stat-value">LKR {fundReq?.targetAmount.toLocaleString() || '—'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Completion</span>
                            <span className="stat-value highlight">{percentage}%</span>
                        </div>
                    </div>

                    <div className="funding-progress-detailed">
                        <div className="progress-track">
                            <div
                                className="progress-fill-gradient"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <div className="progress-markers">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="additional-info-grid">
                        <div className="info-box">
                            <span className="info-label">Current Balance</span>
                            <span className="info-value">LKR {wallet?.balance.toLocaleString() || '0'}</span>
                        </div>
                        <div className="info-box">
                            <span className="info-label">Currency</span>
                            <span className="info-value">{wallet?.currency || 'LKR'}</span>
                        </div>
                        <div className="info-box">
                            <span className="info-label">Last Activity</span>
                            <span className="info-value">{wallet?.lastUpdatedAt ? new Date(wallet.lastUpdatedAt).toLocaleDateString() : 'No activity'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearcherWalletDetail;
