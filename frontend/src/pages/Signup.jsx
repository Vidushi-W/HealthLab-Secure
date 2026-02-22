import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';

const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Account
        name: '',
        email: '',
        password: '',
        // Demographics
        age: '',
        gender: 'Prefer not to say',
        location: '',
        // Health
        height: '',
        weight: '',
        bloodGroup: 'Unknown',
        // Medical
        medicalConditions: '', // comma separated string input for simplicity, handled as array
        medications: '',
        // Lifestyle
        smokingStatus: 'Prefer not to say',
        alcoholStatus: 'Prefer not to say',
        sleepPatterns: '',
        activityLevel: 'Prefer not to say'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        try {
            // Process array fields
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
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
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

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Step {step} of 5</p>

                {error && <div className="text-error text-center mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        {step > 1 ? (
                            <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                                Back
                            </button>
                        ) : (
                            <Link to="/login" className="btn btn-secondary">
                                Login instead
                            </Link>
                        )}

                        {step < 5 ? (
                            <button type="button" className="btn btn-primary" onClick={handleNext}>
                                Next Step
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-primary">
                                Complete Registration
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
