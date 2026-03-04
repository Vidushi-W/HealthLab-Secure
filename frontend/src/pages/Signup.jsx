import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, registerResearcher } from '../api/auth';

const USER_TYPE_PARTICIPANT = 'participant';
const USER_TYPE_RESEARCHER = 'researcher';
const RESEARCHER_TYPES = ['Student', 'NGO', 'Affiliated to Organization', 'Other'];

const Signup = () => {
    const navigate = useNavigate();
    const [userType, setUserType] = useState(USER_TYPE_PARTICIPANT);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        age: '',
        gender: 'Prefer not to say',
        location: '',
        height: '',
        weight: '',
        bloodGroup: 'Unknown',
        medicalConditions: '',
        medications: '',
        smokingStatus: 'Prefer not to say',
        alcoholStatus: 'Prefer not to say',
        sleepPatterns: '',
        activityLevel: 'Prefer not to say'
    });

    const [researcherData, setResearcherData] = useState({
        name: '',
        fullName: '',
        email: '',
        password: '',
        nic: '',
        gender: '',
        currentWorkplace: '',
        highestAcademicQualification: '',
        researcherType: 'Student',
        otherResearcherTypeExplanation: '',
        hasPublishedResearch: false,
        publicationSiteOrLink: '',
        purpose: '',
    });
    const [affiliationFile, setAffiliationFile] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleResearcherChange = (e) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? e.target.checked : value;
        setResearcherData(prev => ({ ...prev, [name]: val }));
    };

    const switchUserType = (type) => {
        setUserType(type);
        setError('');
        if (type === USER_TYPE_PARTICIPANT) setStep(1);
    };

    const handleNext = (e) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handlePrev = (e) => {
        e.preventDefault();
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (userType === USER_TYPE_PARTICIPANT) {
                const processedData = {
                    ...formData,
                    medicalConditions: formData.medicalConditions.split(',').map(item => item.trim()).filter(i => i),
                    medications: formData.medications.split(',').map(item => item.trim()).filter(i => i),
                    age: Number(formData.age),
                    height: formData.height ? Number(formData.height) : undefined,
                    weight: formData.weight ? Number(formData.weight) : undefined
                };
                await registerUser(processedData);
                navigate('/experiments');
            } else {
                const fd = new FormData();
                fd.append('name', researcherData.name || researcherData.fullName);
                fd.append('fullName', researcherData.fullName || researcherData.name);
                fd.append('email', researcherData.email);
                fd.append('password', researcherData.password);
                fd.append('nic', researcherData.nic);
                fd.append('gender', researcherData.gender);
                fd.append('currentWorkplace', researcherData.currentWorkplace);
                fd.append('highestAcademicQualification', researcherData.highestAcademicQualification);
                fd.append('researcherType', researcherData.researcherType);
                fd.append('hasPublishedResearch', researcherData.hasPublishedResearch);
                fd.append('purpose', researcherData.purpose);
                if (researcherData.researcherType === 'Other' && researcherData.otherResearcherTypeExplanation) {
                    fd.append('otherResearcherTypeExplanation', researcherData.otherResearcherTypeExplanation);
                }
                if (researcherData.hasPublishedResearch && researcherData.publicationSiteOrLink) {
                    fd.append('publicationSiteOrLink', researcherData.publicationSiteOrLink);
                }
                if (affiliationFile) fd.append('affiliationProof', affiliationFile);
                await registerResearcher(fd);
                navigate('/login', { state: { message: 'Researcher registration submitted. You can sign in after admin approval.' } });
            }
        } catch (err) {
            setError(err.response?.data?.message || (userType === USER_TYPE_RESEARCHER ? 'Researcher registration failed' : 'Registration failed'));
        }
    };

    const renderStep1 = () => (
        <>
            <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength="6" />
            </div>
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" name="age" className="form-input" value={formData.age} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Location (Optional)</label>
                <input type="text" name="location" className="form-input" value={formData.location} onChange={handleChange} placeholder="City, Country or 'Prefer not to say'" />
            </div>
        </>
    );

    const renderStep3 = () => (
        <>
            <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" name="height" className="form-input" value={formData.height} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" name="weight" className="form-input" value={formData.weight} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="bloodGroup" className="form-select" value={formData.bloodGroup} onChange={handleChange}>
                    <option>Unknown</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                </select>
            </div>
        </>
    );

    const renderStep4 = () => (
        <>
            <div className="form-group">
                <label className="form-label">Medical Conditions (comma separated)</label>
                <input type="text" name="medicalConditions" className="form-input" value={formData.medicalConditions} onChange={handleChange} placeholder="e.g. Asthma, Diabetes" />
            </div>
            <div className="form-group">
                <label className="form-label">Current Medications (comma separated)</label>
                <input type="text" name="medications" className="form-input" value={formData.medications} onChange={handleChange} placeholder="e.g. Aspirin, Insulin" />
            </div>
        </>
    );

    const renderStep5 = () => (
        <>
            <div className="form-group">
                <label className="form-label">Smoking Status</label>
                <select name="smokingStatus" className="form-select" value={formData.smokingStatus} onChange={handleChange}>
                    <option>Never</option>
                    <option>Former</option>
                    <option>Current</option>
                    <option>Prefer not to say</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Alcohol Consumption</label>
                <select name="alcoholStatus" className="form-select" value={formData.alcoholStatus} onChange={handleChange}>
                    <option>Never</option>
                    <option>Occasional</option>
                    <option>Regular</option>
                    <option>Prefer not to say</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Sleep Patterns</label>
                <input type="text" name="sleepPatterns" className="form-input" value={formData.sleepPatterns} onChange={handleChange} placeholder="e.g. 6-8 hours/night" />
            </div>
            <div className="form-group">
                <label className="form-label">Activity Level</label>
                <select name="activityLevel" className="form-select" value={formData.activityLevel} onChange={handleChange}>
                    <option>Sedentary</option>
                    <option>Lightly Active</option>
                    <option>Moderately Active</option>
                    <option>Very Active</option>
                    <option>Prefer not to say</option>
                </select>
            </div>
        </>
    );

    const renderResearcherForm = () => (
        <div className="researcher-signup-form">
            <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" name="fullName" className="form-input" value={researcherData.fullName} onChange={handleResearcherChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" name="email" className="form-input" value={researcherData.email} onChange={handleResearcherChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Password (min 6 characters) *</label>
                <input type="password" name="password" className="form-input" value={researcherData.password} onChange={handleResearcherChange} required minLength={6} />
            </div>
            <div className="form-group">
                <label className="form-label">NIC *</label>
                <input type="text" name="nic" className="form-input" value={researcherData.nic} onChange={handleResearcherChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Gender *</label>
                <select name="gender" className="form-select" value={researcherData.gender} onChange={handleResearcherChange} required>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Current Workplace *</label>
                <input type="text" name="currentWorkplace" className="form-input" value={researcherData.currentWorkplace} onChange={handleResearcherChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Highest Academic Qualification *</label>
                <input type="text" name="highestAcademicQualification" className="form-input" value={researcherData.highestAcademicQualification} onChange={handleResearcherChange} required placeholder="e.g. PhD, MSc" />
            </div>
            <div className="form-group">
                <label className="form-label">Researcher Type *</label>
                <select name="researcherType" className="form-select" value={researcherData.researcherType} onChange={handleResearcherChange} required>
                    {RESEARCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {researcherData.researcherType === 'Other' && (
                <div className="form-group">
                    <label className="form-label">Please specify *</label>
                    <input type="text" name="otherResearcherTypeExplanation" className="form-input" value={researcherData.otherResearcherTypeExplanation} onChange={handleResearcherChange} required />
                </div>
            )}
            {researcherData.researcherType === 'Affiliated to Organization' && (
                <div className="form-group">
                    <label className="form-label">Affiliation proof (image or PDF) *</label>
                    <input type="file" name="affiliationProof" className="form-input" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={(e) => setAffiliationFile(e.target.files?.[0] || null)} required />
                </div>
            )}
            <div className="form-group">
                <label className="form-label">
                    <input type="checkbox" name="hasPublishedResearch" checked={researcherData.hasPublishedResearch} onChange={handleResearcherChange} />
                    {' '}I have previously published research
                </label>
            </div>
            {researcherData.hasPublishedResearch && (
                <div className="form-group">
                    <label className="form-label">Publication site or reference link *</label>
                    <input type="text" name="publicationSiteOrLink" className="form-input" value={researcherData.publicationSiteOrLink} onChange={handleResearcherChange} required placeholder="URL or journal name" />
                </div>
            )}
            <div className="form-group">
                <label className="form-label">Purpose / need of research *</label>
                <textarea name="purpose" className="form-input" rows={4} value={researcherData.purpose} onChange={handleResearcherChange} required placeholder="Describe your research purpose and need" />
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-card signup-card" style={{ maxWidth: userType === USER_TYPE_RESEARCHER ? '600px' : '600px' }}>
                <h2 className="auth-title">Create Account</h2>

                <div className="signup-type-toggle">
                    <button
                        type="button"
                        className={`signup-type-btn ${userType === USER_TYPE_PARTICIPANT ? 'active' : ''}`}
                        onClick={() => switchUserType(USER_TYPE_PARTICIPANT)}
                    >
                        Participant
                    </button>
                    <button
                        type="button"
                        className={`signup-type-btn ${userType === USER_TYPE_RESEARCHER ? 'active' : ''}`}
                        onClick={() => switchUserType(USER_TYPE_RESEARCHER)}
                    >
                        Researcher
                    </button>
                </div>

                {userType === USER_TYPE_PARTICIPANT && (
                    <p className="auth-subtitle">Step {step} of 5</p>
                )}
                {userType === USER_TYPE_RESEARCHER && (
                    <p className="auth-subtitle">Register as a researcher (admin approval required)</p>
                )}

                {error && <div className="text-error text-center mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {userType === USER_TYPE_PARTICIPANT && (
                        <>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                            {step === 4 && renderStep4()}
                            {step === 5 && renderStep5()}
                        </>
                    )}
                    {userType === USER_TYPE_RESEARCHER && renderResearcherForm()}

                    <div className="signup-actions">
                        {userType === USER_TYPE_PARTICIPANT ? (
                            <>
                                {step > 1 ? (
                                    <button type="button" className="btn btn-secondary" onClick={handlePrev}>Back</button>
                                ) : (
                                    <Link to="/login" className="btn btn-secondary">Login instead</Link>
                                )}
                                {step < 5 ? (
                                    <button type="button" className="btn btn-primary" onClick={handleNext}>Next Step</button>
                                ) : (
                                    <button type="submit" className="btn btn-primary">Complete Registration</button>
                                )}
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary">Login instead</Link>
                                <button type="submit" className="btn btn-primary">Submit for Review</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
