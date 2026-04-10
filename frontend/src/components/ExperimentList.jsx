import React, { useEffect, useState } from 'react';
import api from '../api/api';
import SmartBadge from './common/SmartBadge';


const ExperimentList = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '', reason: '', explanation: '' });
    const [analysis, setAnalysis] = useState(null); // { text: string }
    const [showModal, setShowModal] = useState(false);
    const [previewingId, setPreviewingId] = useState(null);
    const [safetyGuidelines, setSafetyGuidelines] = useState(null);
    const [loadingSafety, setLoadingSafety] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const handleFetchSafety = async (experimentId) => {
        setLoadingSafety(true);
        try {
            const response = await api.get(`/experiments/${experimentId}/safety-guidelines`);
            setSafetyGuidelines({
                guidelines: response.data.guidelines,
                source: response.data.source
            });
        } catch (err) {
            console.error('Safety guidelines fetch error:', err);
        } finally {
            setLoadingSafety(false);
        }
    };

    useEffect(() => {
        const fetchExperiments = async () => {
            try {
                const token = localStorage.getItem('token');
                let response;

                if (token) {
                    // Fetch recommendations (which are experiments + match score)
                    response = await api.get('/recommendations');
                } else {
                    response = await api.get('/experiments');
                }

                setExperiments(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching experiments:', err);
                setError('Failed to load experiments. Please try again later.');
                setLoading(false);
            }
        };

        fetchExperiments();
    }, []);

    const handlePreviewJoin = async (experimentId) => {
        setPreviewingId(experimentId);
        setMessage({ text: '', type: '', reason: '', explanation: '' });
        setSafetyGuidelines(null);
        setExpandedIndex(null);

        try {
            const response = await api.get(`/participations/preview-analysis/${experimentId}`);
            setAnalysis({ text: response.data.analysis, experimentId });
            setShowModal(true);
        } catch (err) {
            console.error('Preview error:', err);
            const data = err.response?.data || {};
            setMessage({
                text: data.message || 'Failed to generate clinical analysis.',
                type: 'error',
                reason: data.reason || '',
                explanation: data.explanation || ''
            });
        } finally {
            setPreviewingId(null);
        }
    };

    const handleJoin = async (experimentId) => {
        setJoiningId(experimentId);
        setMessage({ text: '', type: '' });

        try {
            await api.post('/participations/join', { experimentId });
            setMessage({ text: 'Successfully Enrolled!', type: 'success', reason: '', explanation: '' });

            // Update local state
            setExperiments(prev => prev.map(exp =>
                exp._id === experimentId ? { ...exp, enrolled: true, currentParticipantCount: (exp.currentParticipantCount || 0) + 1 } : exp
            ));
        } catch (err) {
            console.error('Join error:', err);
            const data = err.response?.data || {};
            const errorMsg = data.message || 'Failed to join experiment.';
            setMessage({
                text: errorMsg,
                type: 'error',
                reason: data.reason || '',
                explanation: data.explanation || ''
            });
        } finally {
            setJoiningId(null);
            setShowModal(false);
            setAnalysis(null);
            setSafetyGuidelines(null);
            setExpandedIndex(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 text-lg">Loading experiments...</div>;
    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg mx-auto max-w-lg mt-8">{error}</div>;

    return (
        <div className="relative z-10 min-h-[calc(100vh-64px)] py-12 px-8 bg-slate-50 text-slate-700 font-sans mx-auto flex flex-col items-center">
            <h1 className="text-slate-900 font-bold text-4xl tracking-tight mb-10 text-center relative max-w-[1150px] w-full after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-16 after:h-1 after:bg-blue-600 after:rounded-sm">Available Experiments</h1>
            
            {message.text && (
                <div className={`text-left p-6 mb-8 rounded-lg max-w-[1150px] w-full ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    <div className={`font-bold ${message.explanation ? 'mb-2' : 'mb-0'}`}>{message.text}</div>
                    {message.reason && (
                        <div className="text-sm text-red-900 mb-2">
                            <strong>Justification:</strong> {message.reason}
                        </div>
                    )}
                    {message.explanation && (
                        <div className="text-sm text-slate-600 border-t border-black/10 pt-2 mt-2">
                            {message.explanation}
                        </div>
                    )}
                </div>
            )}
            <div className="max-w-[1150px] w-full">
            {experiments.length === 0 ? (
                <p className="text-slate-600">No experiments available at the moment.</p>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8">
                    {experiments.map((experiment) => (
                        <div key={experiment._id} className={`group relative flex flex-col p-8 bg-white rounded-xl shadow-sm transition-all duration-200 ${experiment.matchScore >= 80 ? 'shadow-[0_10px_25px_-5px_rgba(21,128,61,0.15),0_4px_10px_-3px_rgba(21,128,61,0.1)] -translate-y-0.5' : 'border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md'}`}>
                            {experiment.matchScore >= 80 && (
                                <>
                                    <div className="absolute inset-[-2px] bg-gradient-to-br from-green-700 to-green-500 rounded-[14px] -z-10" />
                                    <div className="absolute -top-3 right-5 bg-gradient-to-r from-green-700 to-green-500 text-white text-[0.7rem] font-extrabold py-1 px-3 rounded-xl tracking-wider shadow-[0_4px_6px_rgba(21,128,61,0.3)] z-10">
                                        ✓ TOP AI MATCH
                                    </div>
                                </>
                            )}
                            <SmartBadge score={experiment.matchScore} reason={experiment.matchReason} />
                            <h2 className="text-slate-900 font-semibold text-xl mb-2 mt-4">{experiment.title}</h2>
                            <p className="text-slate-600 font-normal leading-relaxed mb-6 grow">{experiment.description}</p>
                            <div className="text-slate-500 border-t border-slate-100 pt-4 mt-auto text-sm flex justify-between items-center">
                                <span>Participants: {experiment.currentParticipantCount || 0} / {experiment.participantLimit === 0 ? 'Unlimited' : experiment.participantLimit}</span>
                            </div>

                            {!localStorage.getItem('token') ? (
                                <button className="w-full mt-6 py-3 px-6 rounded-lg font-medium text-[0.95rem] transition-colors bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 cursor-pointer" onClick={() => window.location.href = '/login'}>
                                    Login to Join
                                </button>
                            ) : experiment.enrolled ? (
                                <button className="w-full mt-6 py-3 px-6 rounded-lg font-semibold text-[0.95rem] bg-green-50 text-green-700 border border-green-200 shadow-none cursor-not-allowed" disabled>
                                    ✓ Enrolled
                                </button>
                            ) : (
                                <button
                                    className="w-full mt-6 py-3 px-6 rounded-lg font-medium text-[0.95rem] transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                    onClick={() => handlePreviewJoin(experiment._id)}
                                    disabled={previewingId === experiment._id || joiningId === experiment._id}
                                >
                                    {previewingId === experiment._id ? 'Analyzing...' : 'Join Study'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}</div>

            {/* CLINICAL INSIGHT MODAL */}
            {showModal && analysis && (
                <div className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1000]">
                    <div className="bg-white border border-slate-200 text-slate-800 rounded-xl shadow-2xl p-10 max-w-[600px] w-[90%] max-h-[90vh] overflow-y-auto relative">
                        <div className="flex items-center mb-6 border-b-2 border-blue-50 pb-4">
                            <div className="text-3xl mr-4">🧠</div>
                            <h2 className="m-0 text-blue-600 text-2xl font-bold">Personalized Clinical Insight</h2>
                        </div>

                        <p className="text-lg leading-relaxed text-slate-600 mb-8 italic">
                            "{analysis.text}"
                        </p>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-8 text-sm text-slate-600">
                            <strong>Note:</strong> This analysis is generated based on your medical profile (Weight, BMI, and Diseases) using our Clinical NLP engine.
                        </div>

                        {/* WGER SAFETY INTEGRATION */}
                        <div className="mb-8">
                            {!safetyGuidelines ? (
                                <button
                                    className="bg-blue-50 text-blue-600 border border-blue-600 text-sm px-4 py-2 flex items-center gap-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                    onClick={() => handleFetchSafety(analysis.experimentId)}
                                    disabled={loadingSafety}
                                >
                                    {loadingSafety ? 'Fetching Clinical Guidelines...' : '🛡️ View Activity Safety Guidelines'}
                                </button>
                            ) : (
                                <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg text-sm">
                                    <h4 className="m-0 mb-2 text-blue-900 flex items-center gap-2 font-bold">
                                        <span>📋 Activity Protocol</span>
                                    </h4>
                                    {safetyGuidelines.guidelines.map((g, idx) => (
                                        <div key={idx} className={`p-2 rounded-md ${expandedIndex === idx ? 'bg-white border border-slate-200' : 'bg-transparent border-transparent'} ${idx < safetyGuidelines.guidelines.length - 1 ? 'mb-3' : ''}`}>
                                            <div
                                                className="font-bold cursor-pointer flex justify-between"
                                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                            >
                                                <span>{g.name}</span>
                                                <span className="text-xs text-blue-600">{expandedIndex === idx ? '▲ Collapse' : '▼ View Advanced Protocol'}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                                <span><strong>Target:</strong> {g.muscleGroup}</span>
                                                <span><strong>Intensity:</strong> {g.intensity}</span>
                                            </div>
                                            <div className="text-amber-700 text-sm mt-1">
                                                <strong>⚠️ Safety:</strong> {g.safetyWarning}
                                            </div>

                                            {/* Advanced Protocol Drill-Down */}
                                            {expandedIndex === idx && g.advancedProtocol && (
                                                <div className="mt-3 p-3 border-t border-dashed border-slate-300 text-xs text-slate-700 animate-[fadeIn_0.3s]">
                                                    <p className="m-0 mb-2"><strong>Engaged Muscles:</strong> {g.advancedProtocol.muscles.join(", ") || "N/A"}</p>
                                                    <p className="m-0 mb-2"><strong>Equipment:</strong> {g.advancedProtocol.equipment.join(", ")}</p>
                                                    <p className="m-0 font-italic text-slate-500"><strong>Instructions:</strong> {g.advancedProtocol.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="text-xs text-slate-400 mt-2 text-right">
                                        Source: {safetyGuidelines.source}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 py-3 px-6 rounded-lg font-medium cursor-pointer"
                                onClick={() => {
                                    setShowModal(false);
                                    setSafetyGuidelines(null);
                                    setExpandedIndex(null);
                                }}
                            >
                                Back
                            </button>
                            <button
                                className="bg-blue-600 text-white hover:bg-blue-700 py-3 px-8 rounded-lg font-bold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={() => handleJoin(analysis.experimentId)}
                                disabled={joiningId === analysis.experimentId}
                            >
                                {joiningId === analysis.experimentId ? 'Enrolling...' : 'Confirm Enrollment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperimentList;
