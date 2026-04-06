import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { getExperimentWallet } from '../api/funds';
import './ResearcherWallet.css';

const ResearcherWallet = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || user.id;

    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId || (user.role || '').toLowerCase() !== 'researcher') {
            navigate('/login');
            return;
        }
        fetchWallets();
    }, [userId, user.role]);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Get researcher's own experiments
            const { data: allExperiments } = await api.get('/experiments');
            const myExperiments = Array.isArray(allExperiments)
                ? allExperiments.filter((e) => String(e.ownerId || e.createdBy) === String(userId))
                : [];

            // 2. Fetch wallet for each experiment
            const walletResults = await Promise.allSettled(
                myExperiments.map(async (exp) => {
                    try {
                        const { data } = await getExperimentWallet(exp._id);
                        return { experiment: exp, wallet: data };
                    } catch {
                        return { experiment: exp, wallet: null };
                    }
                })
            );

            const allWallets = walletResults
                .filter((r) => r.status === 'fulfilled')
                .map((r) => r.value);

            setWallets(allWallets);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load wallet information.');
        } finally {
            setLoading(false);
        }
    };

    const totalBalance = wallets.reduce((sum, w) => sum + (w.wallet?.balance || 0), 0);
    const walletsWithBalance = wallets.filter((w) => w.wallet && w.wallet.balance > 0);

    if (!userId) return null;

    return (
        <div className="researcher-wallet-page">
            <section className="wallet-hero">
                <div className="wallet-hero-overlay" aria-hidden />
                <div className="wallet-hero-inner">
                    <h1>💰 My Wallet</h1>
                    <p className="subtitle">Track funding received for your experiments.</p>
                </div>
            </section>

            {/* Total Balance Card */}
            <div className="wallet-total-card">
                <div className="wallet-total-icon">🏦</div>
                <div className="wallet-total-info">
                    <span className="wallet-total-label">Total Balance</span>
                    <span className="wallet-total-amount">LKR {totalBalance.toLocaleString()}</span>
                </div>
                <div className="wallet-total-count">
                    {walletsWithBalance.length} experiment{walletsWithBalance.length !== 1 ? 's' : ''} funded
                </div>
            </div>

            {error && <div className="wallet-error">{error}</div>}

            {loading ? (
                <div className="wallet-loading">Loading your wallet...</div>
            ) : (
                <div className="wallet-table-wrap">
                    {wallets.length === 0 ? (
                        <p className="wallet-empty">
                            You don't have any experiments yet. Create an experiment and set up funding to see your wallet here.
                        </p>
                    ) : (
                        <table className="wallet-table">
                            <thead>
                                <tr>
                                    <th>Experiment</th>
                                    <th>Status</th>
                                    <th>Wallet Balance</th>
                                    <th>Currency</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.map(({ experiment, wallet }) => (
                                    <tr key={experiment._id}>
                                        <td className="title-cell">{experiment.title}</td>
                                        <td>
                                            <span className={`wallet-badge status-${experiment.status}`}>
                                                {experiment.status}
                                            </span>
                                        </td>
                                        <td className="wallet-balance">
                                            {wallet ? (
                                                <>LKR {wallet.balance.toLocaleString()}</>
                                            ) : (
                                                <span className="no-wallet">No wallet yet</span>
                                            )}
                                        </td>
                                        <td>{wallet?.currency || '—'}</td>
                                        <td>
                                            {wallet?.lastUpdatedAt
                                                ? new Date(wallet.lastUpdatedAt).toLocaleDateString()
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResearcherWallet;
