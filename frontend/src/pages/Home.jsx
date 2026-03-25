import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';

const Home = () => {
    const user = getCurrentUser();

    return (
        <div className="home-container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="hero-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                    Advance Health Science
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.6' }}>
                    Join our global community of participants and researchers.
                    Contribute to groundbreaking studies and help shape the future of healthcare.
                </p>

                {user ? (
                    <div className="action-buttons">
                        <Link to="/experiments" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Browse Experiments
                        </Link>
                    </div>
                ) : (
                    <div className="action-buttons" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <Link to="/signup" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Get Started
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Login
                        </Link>
                    </div>
                )}

                <div className="features-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem',
                    marginTop: '5rem',
                    textAlign: 'left'
                }}>
                    <div className="feature-card" style={{ padding: '2rem', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Secure Data</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Your health data is encrypted and protected with industry-standard security protocols.</p>
                    </div>
                    <div className="feature-card" style={{ padding: '2rem', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Diverse Studies</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Participate in studies ranging from sleep patterns to cognitive linguistics.</p>
                    </div>
                    <div className="feature-card" style={{ padding: '2rem', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Impactful Research</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Directly contribute to medical breakthroughs and scientific discoveries.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
