import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './AdminDashboard.css';

const TABS = ['Unapproved', 'All Users', 'Researchers', 'Experiments', 'Export PDF'];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('Researchers');
    const [unapproved, setUnapproved] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [researchers, setResearchers] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewModal, setReviewModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [deleteOptions, setDeleteOptions] = useState({ rejectResearcher: false, reassignToParticipant: false });

    const fetchUnapproved = async () => {
        try {
            const { data } = await api.get('/admin/users/unapproved');
            setUnapproved(data);
        } catch (e) {
            console.error(e);
        }
    };
    const fetchAllUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setAllUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };
    const fetchResearchers = async () => {
        try {
            const { data } = await api.get('/admin/researchers');
            setResearchers(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };
    const fetchExperiments = async () => {
        try {
            const { data } = await api.get('/experiments');
            setExperiments(Array.isArray(data) ? data : data?.experiments || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([fetchUnapproved(), fetchAllUsers(), fetchResearchers(), fetchExperiments()])
            .then(() => {})
            .catch(() => setError('Failed to load some data.'))
            .finally(() => setLoading(false));
    }, []);

    const refetchTab = () => {
        if (activeTab === 'Unapproved') fetchUnapproved();
        if (activeTab === 'All Users') fetchAllUsers();
        if (activeTab === 'Researchers') fetchResearchers();
        if (activeTab === 'Experiments') fetchExperiments();
    };

    const handleApproveUser = async (id) => {
        try {
            await api.patch(`/admin/users/approve/${id}`);
            setUnapproved(unapproved.filter(u => u._id !== id));
            fetchAllUsers();
            fetchResearchers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve.');
        }
    };

    const handleRejectUser = async (id) => {
        try {
            await api.patch(`/admin/users/reject/${id}`);
            setUnapproved(unapproved.filter(u => u._id !== id));
            fetchAllUsers();
            fetchResearchers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject.');
        }
    };

    const openReviewModal = (researcher, action) => setReviewModal({ researcher, action });
    const closeReviewModal = () => {
        setReviewModal(null);
        setReviewNotes('');
    };

    const handleApproveRejectResearcher = async () => {
        if (!reviewModal) return;
        try {
            const url = reviewModal.action === 'approve'
                ? `/admin/researchers/${reviewModal.researcher._id}/approve`
                : `/admin/researchers/${reviewModal.researcher._id}/reject`;
            await api.put(url, { reviewNotes: reviewNotes.trim() || undefined });
            closeReviewModal();
            fetchResearchers();
            refetchTab();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed.');
        }
    };

    const openDeleteModal = (experiment) => setDeleteModal(experiment);
    const closeDeleteModal = () => {
        setDeleteModal(null);
        setDeleteOptions({ rejectResearcher: false, reassignToParticipant: false });
    };

    const handleDeleteExperiment = async () => {
        if (!deleteModal) return;
        try {
            await api.delete(`/admin/experiments/${deleteModal._id}`, { data: deleteOptions });
            setExperiments(experiments.filter(e => e._id !== deleteModal._id));
            closeDeleteModal();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed.');
        }
    };

    const handleExportPdf = async () => {
        try {
            const response = await api.get('/admin/researchers/export/pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `researchers-report-${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || 'Export failed.');
        }
    };

    if (loading) return <div className="admin-loading">Loading...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Manage users, researchers, experiments, and export reports.</p>

            {error && <div className="error-message">{error}</div>}

            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="table-container">
                {activeTab === 'Unapproved' && (
                    <table className="approval-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unapproved.length ? unapproved.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className="badge researcher">{user.role}</span></td>
                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                                    <td className="actions">
                                        <button className="btn approve" onClick={() => handleApproveUser(user._id)}>Approve</button>
                                        <button className="btn reject" onClick={() => handleRejectUser(user._id)}>Reject</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="empty-msg">No users pending approval.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'All Users' && (
                    <table className="approval-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Researcher Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.length ? allUsers.map(u => (
                                <tr key={u._id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${(u.role || '').toLowerCase()}`}>{u.role || '—'}</span></td>
                                    <td>{u.researcherStatus != null ? <span className="badge status">{u.researcherStatus}</span> : '—'}</td>
                                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="empty-msg">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'Researchers' && (
                    <table className="approval-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>NIC</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {researchers.length ? researchers.map(r => {
                                const user = r.user || {};
                                const status = (r.status || 'pending').toLowerCase();
                                return (
                                    <tr key={r._id}>
                                        <td>{r.fullName || user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{r.nic}</td>
                                        <td>{r.researcherType}</td>
                                        <td>
                                            <span className={`badge status ${status}`}>{status}</span>
                                        </td>
                                        <td className="actions">
                                            {status === 'pending' && (
                                                <>
                                                    <button className="btn approve" onClick={() => openReviewModal(r, 'approve')}>Approve</button>
                                                    <button className="btn reject" onClick={() => openReviewModal(r, 'reject')}>Reject</button>
                                                </>
                                            )}
                                            {status !== 'pending' && <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="6" className="empty-msg">No researchers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'Experiments' && (
                    <table className="approval-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Owner / ID</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {experiments.length ? experiments.map(exp => (
                                <tr key={exp._id}>
                                    <td>{exp.title || exp.name || '—'}</td>
                                    <td>{exp.ownerId || exp._id}</td>
                                    <td>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '—'}</td>
                                    <td className="actions">
                                        <button className="btn reject" onClick={() => openDeleteModal(exp)}>Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="empty-msg">No experiments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'Export PDF' && (
                    <div className="export-section">
                        <p>Download researcher data and reports as a PDF for documentation and analysis.</p>
                        <button className="btn approve" onClick={handleExportPdf}>Download Researchers PDF</button>
                    </div>
                )}
            </div>

            {reviewModal && (
                <div className="modal-overlay" onClick={closeReviewModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{reviewModal.action === 'approve' ? 'Approve' : 'Reject'} Researcher</h3>
                        <p>Researcher: {reviewModal.researcher.fullName || reviewModal.researcher.user?.name}</p>
                        <label className="form-label">Review notes (optional)</label>
                        <textarea className="form-input" rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Notes for records" />
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={closeReviewModal}>Cancel</button>
                            <button className={reviewModal.action === 'approve' ? 'btn approve' : 'btn reject'} onClick={handleApproveRejectResearcher}>
                                {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="modal-overlay" onClick={closeDeleteModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Delete Experiment</h3>
                        <p>Title: {deleteModal.title || deleteModal.name || deleteModal._id}</p>
                        <p className="text-muted">This may be used for policy violations. Optionally reject the researcher and reassign them to a normal user.</p>
                        <label><input type="checkbox" checked={deleteOptions.rejectResearcher} onChange={e => setDeleteOptions(o => ({ ...o, rejectResearcher: e.target.checked }))} /> Reject researcher</label>
                        <label><input type="checkbox" checked={deleteOptions.reassignToParticipant} onChange={e => setDeleteOptions(o => ({ ...o, reassignToParticipant: e.target.checked }))} /> Reassign to normal user</label>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                            <button className="btn reject" onClick={handleDeleteExperiment}>Delete Experiment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
