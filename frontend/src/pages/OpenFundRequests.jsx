import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOpenFundRequests, createPayment } from '../api/funds';
import { getCurrentUser } from '../api/auth';
import './OpenFundRequests.css';

const OpenFundRequests = () => {
    const user = getCurrentUser();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [selectedReq, setSelectedReq] = useState(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [contributeNotes, setContributeNotes] = useState('');
    const [contributing, setContributing] = useState(false);

    useEffect(() => {
        fetchOpenFundRequests();
    }, []);

    const fetchOpenFundRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await getOpenFundRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load fund requests.');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const getFundingPercentage = (raised, target) => {
        if (!target || target <= 0) return 0;
        return Math.min(100, Math.round((raised / target) * 100));
    };

    const openContributeModal = (request) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        setSelectedReq(request);
        setContributeAmount('');
        setContributeNotes('');
        setError('');
        setSuccess('');
    };

    const closeContributeModal = () => {
        setSelectedReq(null);
        setContributeAmount('');
        setContributeNotes('');
    };

    const handleContribute = async (e) => {
        e.preventDefault();

        if (!selectedReq?._id) {
            setError('Invalid fund request selected.');
            return;
        }

        const amount = Number(contributeAmount);
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        const target = Number(selectedReq.targetAmount || 0);
        const raised = Number(selectedReq.raisedAmount || 0);
        const remaining = Math.max(0, target - raised);

        if (amount > remaining) {
            setError(`Amount exceeds remaining target. Maximum: LKR ${remaining.toLocaleString()}`);
            return;
        }

        try {
            setContributing(true);
            setError('');
            setSuccess('');

            const { data } = await createPayment({
                fundRequestId: selectedReq._id,
                amount,
                notes: contributeNotes.trim(),
            });

            if (data?.checkout?.checkout_url) {
                const ck = data.checkout;

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = ck.checkout_url;

                const fields = {
                    merchant_id: ck.merchant_id,
                    return_url: ck.return_url,
                    cancel_url: ck.cancel_url,
                    notify_url: ck.notify_url,
                    order_id: ck.order_id,
                    items: ck.items,
                    currency: ck.currency,
                    amount: ck.amount,
                    first_name: ck.first_name,
                    last_name: ck.last_name,
                    email: ck.email,
                    phone: ck.phone,
                    address: ck.address,
                    city: ck.city,
                    country: ck.country,
                    hash: ck.hash,
                };

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value ?? '';
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
                return;
            }

            setSuccess('Contribution created successfully.');
            closeContributeModal();
            fetchOpenFundRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create payment.');
        } finally {
            setContributing(false);
        }
    };

    return (
        <div className="open-fund-requests-page">
            <section className="open-funds-hero">
                <div className="open-funds-hero-overlay" aria-hidden />
                <div className="open-funds-hero-inner">
                    <h1>💰 Fund Research</h1>
                    <p className="subtitle">
                        Support groundbreaking experiments by contributing to active fund requests.
                    </p>

                    <div className="open-funds-hero-links">
                        {user && (
                            <Link to="/my-contributions" className="btn btn-hero-link">
                                📊 My Contributions
                            </Link>
                        )}

                        {user && (user.role || '').toLowerCase() === 'researcher' && (
                            <Link to="/fund-requests" className="btn btn-hero-link">
                                💰 My Fund Requests
                            </Link>
                        )}

                        {user && (user.role || '').toLowerCase() === 'researcher' && (
                            <Link to="/researcher/wallet" className="btn btn-hero-link">
                                🏦 My Wallet
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {error && <div className="open-funds-error">{error}</div>}
            {success && <div className="open-funds-success">{success}</div>}

            {loading ? (
                <div className="open-funds-loading">Loading fund requests...</div>
            ) : requests.length === 0 ? (
                <div className="open-funds-empty">
                    There are no fund requests open for contributions at the moment.
                </div>
            ) : (
                <div className="open-funds-grid">
                    {requests.map((req) => {
                        const raised = Number(req.raisedAmount || 0);
                        const target = Number(req.targetAmount || 0);
                        const remaining = Math.max(0, target - raised);
                        const percentage = getFundingPercentage(raised, target);

                        return (
                            <div key={req._id} className="open-fund-card">
                                <div className="open-fund-card-title">
                                    {req.experimentId?.title || 'Untitled Experiment'}
                                </div>

                                <div className="open-fund-card-researcher">
                                    by {req.researcherId?.name || 'Researcher'}
                                </div>

                                <div className="open-fund-card-reason">
                                    {req.reason || 'No description provided.'}
                                </div>

                                <div className="open-fund-card-progress">
                                    <div className="open-fund-card-pct">{percentage}% funded</div>

                                    <div className="fund-progress-bar">
                                        <div
                                            className="fund-progress-bar-fill"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="open-fund-card-amounts">
                                        <span className="open-fund-card-raised">
                                            LKR {raised.toLocaleString()} raised
                                        </span>
                                        <span className="open-fund-card-target">
                                            of LKR {target.toLocaleString()}
                                        </span>
                                    </div>

                                    {req.aiPredictionDays !== null &&
                                        req.aiPredictionDays !== undefined &&
                                        remaining > 0 && (
                                            <div className="open-fund-card-prediction">
                                                <span className="prediction-icon">🤖</span>
                                                <span className="prediction-text">
                                                    AI Predicts:{' '}
                                                    <strong>
                                                        {req.aiPredictionDays === 0
                                                            ? 'Goal reached today!'
                                                            : `${req.aiPredictionDays} days to go`}
                                                    </strong>
                                                </span>
                                            </div>
                                        )}
                                </div>

                                <button
                                    type="button"
                                    className="open-fund-contribute-btn"
                                    onClick={() => openContributeModal(req)}
                                    disabled={remaining <= 0}
                                >
                                    {remaining <= 0
                                        ? 'Fully Funded'
                                        : `Contribute (LKR ${remaining.toLocaleString()} remaining)`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedReq && (
                <div className="contribute-modal-overlay" onClick={closeContributeModal}>
                    <div className="contribute-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="contribute-modal-header">
                            <h2>💸 Make a Contribution</h2>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeContributeModal}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="contribute-modal-body">
                            <div className="contribute-modal-info">
                                <strong>{selectedReq.experimentId?.title || 'Experiment'}</strong>
                                Remaining: LKR{' '}
                                {Math.max(
                                    0,
                                    Number(selectedReq.targetAmount || 0) -
                                        Number(selectedReq.raisedAmount || 0)
                                ).toLocaleString()}
                            </div>

                            <form onSubmit={handleContribute}>
                                <div className="form-group">
                                    <label className="form-label">Amount (LKR)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min={1}
                                        max={Math.max(
                                            0,
                                            Number(selectedReq.targetAmount || 0) -
                                                Number(selectedReq.raisedAmount || 0)
                                        )}
                                        value={contributeAmount}
                                        onChange={(e) => setContributeAmount(e.target.value)}
                                        placeholder="Enter amount to contribute"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea
                                        className="form-input"
                                        rows={2}
                                        value={contributeNotes}
                                        onChange={(e) => setContributeNotes(e.target.value)}
                                        placeholder="Leave a message for the researcher..."
                                    />
                                </div>

                                <div className="contribute-modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeContributeModal}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={contributing}
                                    >
                                        {contributing ? 'Processing...' : 'Pay with PayHere'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpenFundRequests;