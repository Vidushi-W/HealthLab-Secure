import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyContributions, devConfirmPayment } from '../api/funds';
import { getCurrentUser } from '../api/auth';
import './MyContributions.css';

const MyContributions = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchContributions();
    }, []);

    const fetchContributions = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await getMyContributions();
            setContributions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load contributions.');
            setContributions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDevConfirm = async (orderId) => {
        try {
            await devConfirmPayment(orderId);
            fetchContributions(); // Refresh the list
        } catch (err) {
            console.error('Failed to confirm payment:', err);
            alert('Failed to confirm payment. Check console for details.');
        }
    };

    // Summary stats
    const totalContributed = contributions.reduce((sum, c) => sum + (c.paymentStatus === 'SUCCESS' ? c.amount : 0), 0);
    const totalPending = contributions.reduce((sum, c) => sum + (c.paymentStatus === 'PENDING' ? c.amount : 0), 0);
    const successCount = contributions.filter((c) => c.paymentStatus === 'SUCCESS').length;

    if (!user) return null;

    return (
        <div className="my-contributions-page">
            <section className="contributions-hero">
                <div className="contributions-hero-overlay" aria-hidden />
                <div className="contributions-hero-inner">
                    <h1>📊 My Contributions</h1>
                    <p className="subtitle">Track all your contributions to research fund requests.</p>
                </div>
            </section>

            {error && <div className="contributions-error">{error}</div>}

            {!loading && contributions.length > 0 && (
                <>
                    <div className="contributions-summary">
                        <div className="summary-card success">
                            <div className="summary-card-value">LKR {totalContributed.toLocaleString()}</div>
                            <div className="summary-card-label">Total Contributed</div>
                        </div>
                        <div className="summary-card pending">
                            <div className="summary-card-value">LKR {totalPending.toLocaleString()}</div>
                            <div className="summary-card-label">Pending</div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-card-value">{successCount}</div>
                            <div className="summary-card-label">Successful Payments</div>
                        </div>
                    </div>

                    {/* DEV INFO BLOCK */}
                    <div className="dev-notif-box">
                        <strong>🛠️ Developer Tip (Localhost Testing)</strong>
                        <p>
                            In development mode, PayHere cannot send automatic status updates to <code>localhost</code>.
                            If you've completed a payment, please use the <strong>Verify</strong> button in the table below to manually confirm it.
                        </p>
                    </div>
                </>
            )}

            {loading ? (
                <div className="contributions-loading">Loading your contributions...</div>
            ) : contributions.length === 0 ? (
                <div className="contributions-empty">You haven't made any contributions yet. Visit the Fund page to support research!</div>
            ) : (
                <div className="contributions-table-wrap">
                    <table className="contributions-table">
                        <thead>
                            <tr>
                                <th>Experiment</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Reference</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contributions.map((c) => (
                                <tr key={c._id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {c.fundRequestId?.experimentId?.title || c.experimentId?.title || 'Experiment'}
                                    </td>
                                    <td className="contributions-amount">LKR {c.amount?.toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={`payment-badge status-${c.paymentStatus}`}>
                                                {c.paymentStatus}
                                            </span>
                                            {c.paymentStatus === 'PENDING' && (
                                                <button
                                                    onClick={() => handleDevConfirm(c.paymentReferenceId)}
                                                    className="btn btn-verify"
                                                    title="DEV ONLY: Manually confirm this payment"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {c.paymentReferenceId || '—'}
                                    </td>
                                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.notes || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyContributions;
