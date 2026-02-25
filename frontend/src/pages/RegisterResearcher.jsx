import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerResearcher } from '../api/auth';

const RESEARCHER_TYPES = ['Student', 'NGO', 'Affiliated to Organization', 'Other'];

const RegisterResearcher = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        fullName: '',
        email: '',
        password: '',
        nic: '',
        gender: '',
        currentWorkplace: '',
        highestAcademicQualification: '',
        researcherType: '',
        otherResearcherTypeExplanation: '',
        hasPublishedResearch: false,
        publicationSiteOrLink: '',
        purpose: '',
    });
    const [affiliationFile, setAffiliationFile] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (name === 'name') setFormData(prev => ({ ...prev, fullName: value }));
    };

    const handleFileChange = (e) => {
        setAffiliationFile(e.target.files?.[0] || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = new FormData();
            data.append('name', formData.name || formData.fullName);
            data.append('fullName', formData.fullName || formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('nic', formData.nic);
            data.append('gender', formData.gender);
            data.append('currentWorkplace', formData.currentWorkplace);
            data.append('highestAcademicQualification', formData.highestAcademicQualification);
            data.append('researcherType', formData.researcherType);
            data.append('hasPublishedResearch', formData.hasPublishedResearch);
            data.append('purpose', formData.purpose);
            if (formData.researcherType === 'Other' && formData.otherResearcherTypeExplanation) {
                data.append('otherResearcherTypeExplanation', formData.otherResearcherTypeExplanation);
            }
            if (formData.hasPublishedResearch && formData.publicationSiteOrLink) {
                data.append('publicationSiteOrLink', formData.publicationSiteOrLink);
            }
            if (affiliationFile) {
                data.append('affiliationProof', affiliationFile);
            }
            await registerResearcher(data);
            navigate('/login', { state: { message: 'Researcher registration submitted. You may log in; experiments will be available after admin approval.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    const needsAffiliationProof = formData.researcherType === 'Affiliated to Organization';
    const needsOtherExplanation = formData.researcherType === 'Other';
    const needsPublicationLink = formData.hasPublishedResearch === true;

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '640px' }}>
                <h2 className="auth-title">Researcher Registration</h2>
                <p className="auth-subtitle">Create an account to submit research for admin review. You can log in after registration; publishing experiments is allowed once approved.</p>

                {error && <div className="text-error text-center mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="As on NIC" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">NIC *</label>
                        <input type="text" name="nic" className="form-input" value={formData.nic} onChange={handleChange} required placeholder="National ID" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender *</label>
                        <select name="gender" className="form-select" value={formData.gender} onChange={handleChange} required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password * (min 6 characters)</label>
                        <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Current Workplace *</label>
                        <input type="text" name="currentWorkplace" className="form-input" value={formData.currentWorkplace} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Highest Academic Qualification *</label>
                        <input type="text" name="highestAcademicQualification" className="form-input" value={formData.highestAcademicQualification} onChange={handleChange} required placeholder="e.g. PhD, MSc, BSc" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Researcher Type *</label>
                        <select name="researcherType" className="form-select" value={formData.researcherType} onChange={handleChange} required>
                            <option value="">Select</option>
                            {RESEARCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {needsOtherExplanation && (
                        <div className="form-group">
                            <label className="form-label">Explain "Other" category *</label>
                            <textarea name="otherResearcherTypeExplanation" className="form-input" value={formData.otherResearcherTypeExplanation} onChange={handleChange} required rows={2} />
                        </div>
                    )}
                    {needsAffiliationProof && (
                        <div className="form-group">
                            <label className="form-label">Affiliation proof (image or PDF) *</label>
                            <input type="file" name="affiliationProof" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={handleFileChange} required={needsAffiliationProof} />
                            <small className="text-muted">Allowed: JPEG, PNG, GIF, WebP, PDF. Max 5MB.</small>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Have you previously published research? *</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label><input type="radio" name="hasPublishedResearch" checked={formData.hasPublishedResearch === true} onChange={() => setFormData(prev => ({ ...prev, hasPublishedResearch: true }))} /> Yes</label>
                            <label><input type="radio" name="hasPublishedResearch" checked={formData.hasPublishedResearch === false} onChange={() => setFormData(prev => ({ ...prev, hasPublishedResearch: false }))} /> No</label>
                        </div>
                    </div>
                    {needsPublicationLink && (
                        <div className="form-group">
                            <label className="form-label">Publication site or reference link *</label>
                            <input type="text" name="publicationSiteOrLink" className="form-input" value={formData.publicationSiteOrLink} onChange={handleChange} required placeholder="Journal name or URL" />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Purpose / need of your research *</label>
                        <textarea name="purpose" className="form-input" value={formData.purpose} onChange={handleChange} required rows={4} placeholder="Clearly explain the need and purpose of your research" />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Submit for Review
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-secondary">
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Login</Link>
                        {' · '}
                        <Link to="/signup" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign up as Participant</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterResearcher;
