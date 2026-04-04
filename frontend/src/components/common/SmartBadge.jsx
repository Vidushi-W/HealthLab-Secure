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
                <span className="ai-badge-icon">✨</span>
                <span className="ai-badge-text">{score}% Match</span>
                {reason && <span className="ai-badge-reason">• {reason}</span>}
            </div>

            <div className="ai-match-wrapper">
                <span className="ai-match-label">AI Match</span>
                <div className="ai-match-bar-bg">
                    <div
                        className={`ai-match-fill ${fillClass}`}
                        style={{ width: `${score}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default SmartBadge;
