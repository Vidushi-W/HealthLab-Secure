import React from 'react';
import './SmartBadge.css';

const SmartBadge = ({ score, reason }) => {
    if (score === undefined || score === null) return null;

    let badgeClass = 'ai-badge-low';
    let fillClass = 'ai-fill-low';
    if (score >= 80) {
        badgeClass = 'ai-badge-high';
        fillClass = 'ai-fill-high';
    } else if (score >= 50) {
        badgeClass = 'ai-badge-med';
        fillClass = 'ai-fill-med';
    }

    return (
        <div className="ai-badge-container">
            <div className={`ai-smart-badge ${badgeClass}`}>
                <div className={`ai-badge-bg-fill ${fillClass}`} style={{ width: `${score}%` }}></div>
                <div className="ai-badge-content">
                    <span className="ai-badge-icon">✨</span>
                    <span className="ai-badge-text">{score}% Match</span>
                    {reason && <span className="ai-badge-reason">• {reason}</span>}
                </div>
            </div>
        </div>
    );
};

export default SmartBadge;
