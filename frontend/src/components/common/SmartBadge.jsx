import React from 'react';

const SmartBadge = ({ score, reason }) => {
    if (score === undefined || score === null) return null;

    let badgeClass = 'badge-score-low';
    if (score >= 80) badgeClass = 'badge-score-high';
    else if (score >= 50) badgeClass = 'badge-score-med';

    return (
        <div className="smart-badge-container">
            <div className={`smart-badge ${badgeClass}`}>
                <span className="badge-icon">✨</span>
                <span className="badge-text">{score}% Match</span>
                {reason && <span className="badge-reason">• {reason}</span>}
            </div>

            <div className="match-level-wrapper">
                <div className="match-level-bar">
                    <div
                        className={`match-level-fill ${badgeClass}`}
                        style={{ width: `${score}%` }}
                    ></div>
                </div>
                <span className="match-level-label">Compatibility</span>
            </div>
        </div>
    );
};

export default SmartBadge;
