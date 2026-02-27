import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './AdminDashboard.css';

const TAB_RESEARCHERS = 'researchers';
const TAB_ALL_USERS = 'users';
const TAB_EXPERIMENTS = 'experiments';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState(TAB_RESEARCHERS);

    // Researchers
    const [researchers, setResearchers] = useState([]);
    const [researcherStatusFilter, setResearcherStatusFilter] = useState('');
    const [researchersLoading, setResearchersLoading] = useState(false);
    const [reviewModal, setReviewModal] = useState(null); // { type: 'approve'|'reject', researcher }
    const [deleteResearcherModal, setDeleteResearcherModal] = useState(null); // researcher to delete

    // All Users
    const [allUsers, setAllUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [usersLoading, setUsersLoading] = useState(false);

    // Experiments
    const [experiments, setExperiments] = useState([]);
    const [experimentsLoading, setExperimentsLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null); // { experiment, rejectResearcher, reassignToParticipant }

    const [error, setError] = useState(null);

    useEffect(() => {
        if (activeTab === TAB_RESEARCHERS) fetchResearchers();
    }, [activeTab, researcherStatusFilter]);

    useEffect(() => {
        if (activeTab === TAB_ALL_USERS) fetchAllUsers();
    }, [activeTab, roleFilter]);

    useEffect(() => {
        if (activeTab === TAB_EXPERIMENTS) fetchExperiments();
    }, [activeTab]);

    const fetchResearchers = async () => {
        try {
            setResearchersLoading(true);
            const params = researcherStatusFilter ? { status: researcherStatusFilter } : {};
            const response = await api.get('/admin/researchers', { params });
            setResearchers(Array.isArray(response.data) ? response.data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching researchers:', err);
            setError('Failed to fetch researchers.');
        } finally {
            setResearchersLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            setUsersLoading(true);
            const params = roleFilter ? { role: roleFilter } : {};
            const response = await api.get('/admin/users', { params });
            setAllUsers(Array.isArray(response.data) ? response.data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users.');
        } finally {
            setUsersLoading(false);
        }
    };

    const fetchExperiments = async () => {
        try {
            setExperimentsLoading(true);
            const response = await api.get('/experiments');
            setExperiments(Array.isArray(response.data) ? response.data : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching experiments:', err);
            setError('Failed to fetch experiments.');
        } finally {
            setExperimentsLoading(false);
        }
    };

    const handleApproveResearcher = async (researcherId, reviewNotes) => {
        try {
            await api.put(`/admin/researchers/${researcherId}/approve`, { reviewNotes: reviewNotes || '' });
            setReviewModal(null);
            fetchResearchers();
        } catch (err) {
            console.error('Error approving researcher:', err);
            alert(err.response?.data?.message || 'Failed to approve researcher.');
        }
    };

    const handleRejectResearcher = async (researcherId, reviewNotes) => {
        try {
            await api.put(`/admin/researchers/${researcherId}/reject`, { reviewNotes: reviewNotes || '' });
            setReviewModal(null);
            fetchResearchers();
        } catch (err) {
            console.error('Error rejecting researcher:', err);
            alert(err.response?.data?.message || 'Failed to reject researcher.');
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            await api.patch(`/admin/users/approve/${userId}`);
            fetchAllUsers();
        } catch (err) {
            console.error('Error approving user:', err);
            alert(err.response?.data?.message || 'Failed to approve.');
        }
    };

    const handleRejectUser = async (userId) => {
        try {
            await api.patch(`/admin/users/reject/${userId}`);
            fetchAllUsers();
        } catch (err) {
            console.error('Error rejecting user:', err);
            alert(err.response?.data?.message || 'Failed to reject.');
        }
    };

    const handleDeleteResearcher = async () => {
        if (!deleteResearcherModal) return;
        const researcherId = deleteResearcherModal._id;
        try {
            await api.delete(`/admin/researchers/${researcherId}`);
            setDeleteResearcherModal(null);
            fetchResearchers();
        } catch (err) {
            console.error('Error deleting researcher:', err);
            alert(err.response?.data?.message || 'Failed to remove researcher.');
        }
    };

    const handleDeleteExperiment = async () => {
        if (!deleteModal) return;
        const { experiment, rejectResearcher, reassignToParticipant } = deleteModal;
        try {
            await api.delete(`/admin/experiments/${experiment._id}`, {
                data: { rejectResearcher: !!rejectResearcher, reassignToParticipant: !!reassignToParticipant },
            });
            setDeleteModal(null);
            fetchExperiments();
        } catch (err) {
            console.error('Error deleting experiment:', err);
            alert(err.response?.data?.message || 'Failed to delete experiment.');
        }
    };

    const handleExportPdf = async () => {
        try {
            const params = researcherStatusFilter ? { status: researcherStatusFilter } : {};
            const response = await api.get('/admin/researchers/export/pdf', {
                responseType: 'blob',
                params,
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `researchers-report-${new Date().toISOString().slice(0, 10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting PDF:', err);
            alert('Failed to download PDF.');
        }
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s === 'approved') return 'status-approved';
        if (s === 'rejected') return 'status-rejected';
        return 'status-pending';
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <p className="subtitle">
                Manage researchers (approve/reject), view all users, delete experiments if needed, and export reports.
            </p>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === TAB_RESEARCHERS ? 'active' : ''}`}
                    onClick={() => setActiveTab(TAB_RESEARCHERS)}
                >
                    Researchers
                </button>
                <button
                    className={`tab-btn ${activeTab === TAB_ALL_USERS ? 'active' : ''}`}
                    onClick={() => setActiveTab(TAB_ALL_USERS)}
                >
                    All Users
                </button>
                <button
                    className={`tab-btn ${activeTab === TAB_EXPERIMENTS ? 'active' : ''}`}
                    onClick={() => setActiveTab(TAB_EXPERIMENTS)}
                >
                    Experiments
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Researchers tab */}
            {activeTab === TAB_RESEARCHERS && (
                <>
                    <div className="admin-toolbar">
                        <div className="admin-filters">
                            <label htmlFor="researcher-status-filter">Status:</label>
                            <select
                                id="researcher-status-filter"
                                value={researcherStatusFilter}
                                onChange={(e) => setResearcherStatusFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <button type="button" className="btn btn-export" onClick={handleExportPdf}>
                            Download PDF Report
                        </button>
                    </div>
                    {researchersLoading ? (
                        <div className="admin-loading">Loading researchers...</div>
                    ) : (
                        <div className="table-container table-scroll">
                            <table className="approval-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Workplace</th>
                                        <th>Qualification</th>
                                        <th>Type</th>
                                        <th>Published?</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {researchers.length > 0 ? (
                                        researchers.map((r) => (
                                            <tr key={r._id}>
                                                <td>{r.fullName || (r.user && r.user.name) || '—'}</td>
                                                <td>{r.user && r.user.email ? r.user.email : '—'}</td>
                                                <td>{r.currentWorkplace || '—'}</td>
                                                <td>{r.highestAcademicQualification || '—'}</td>
                                                <td>{r.researcherType || '—'}</td>
                                                <td>{r.hasPublishedResearch ? 'Yes' : 'No'}</td>
                                                <td className="cell-purpose">{r.purpose ? (r.purpose.length > 50 ? r.purpose.slice(0, 50) + '…' : r.purpose) : '—'}</td>
                                                <td>
                                                    <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                                                        {r.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="actions">
                                                    {(() => {
                                                        const s = (r.status || '').toLowerCase();
                                                        const isPending = s === 'pending' || s === '';
                                                        return (
                                                            <>
                                                                {isPending && (
                                                                    <>
                                                                        <button
                                                                            className="btn approve"
                                                                            onClick={() => setReviewModal({ type: 'approve', researcher: r })}
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            className="btn reject"
                                                                            onClick={() => setReviewModal({ type: 'reject', researcher: r })}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => setDeleteResearcherModal(r)}
                                                                    title="Remove researcher; user becomes ordinary user"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="empty-msg">No researchers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* All Users tab */}
            {activeTab === TAB_ALL_USERS && (
                <>
                    <div className="admin-filters">
                        <label htmlFor="role-filter">Filter by role:</label>
                        <select id="role-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="researcher">Researcher</option>
                            <option value="participant">Participant</option>
                        </select>
                    </div>
                    {usersLoading ? (
                        <div className="admin-loading">Loading users...</div>
                    ) : (
                        <div className="table-container">
                            <table className="approval-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Researcher Status</th>
                                        <th>Registered</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.length > 0 ? (
                                        allUsers.map((user) => {
                                            const role = (user.role || '').toLowerCase();
                                            const resStatus = (user.researcherStatus || '').toLowerCase();
                                            const isResearcherPending = role === 'researcher' && (resStatus === 'pending' || resStatus === '');
                                            return (
                                                <tr key={user._id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        <span className={`badge role-${role}`}>
                                                            {user.role || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {user.researcherStatus ? (
                                                            <span className={`badge ${getStatusBadgeClass(user.researcherStatus)}`}>
                                                                {user.researcherStatus}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                                                    <td className="actions">
                                                        {isResearcherPending ? (
                                                            <>
                                                                <button className="btn approve" onClick={() => handleApproveUser(user._id)}>Approve</button>
                                                                <button className="btn reject" onClick={() => handleRejectUser(user._id)}>Reject</button>
                                                            </>
                                                        ) : (
                                                            role === 'researcher' ? <span className="no-edit">Reviewed</span> : '—'
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="empty-msg">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Experiments tab */}
            {activeTab === TAB_EXPERIMENTS && (
                <>
                    <p className="section-note">
                        You can delete an experiment (e.g. for policy violations). Optionally reject the researcher and/or reassign them to participant.
                    </p>
                    {experimentsLoading ? (
                        <div className="admin-loading">Loading experiments...</div>
                    ) : (
                        <div className="table-container">
                            <table className="approval-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {experiments.length > 0 ? (
                                        experiments.map((exp) => (
                                            <tr key={exp._id}>
                                                <td>{exp.title || exp.name || 'Untitled'}</td>
                                                <td>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '—'}</td>
                                                <td className="actions">
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => setDeleteModal({ experiment: exp, rejectResearcher: false, reassignToParticipant: false })}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="empty-msg">No experiments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Review modal (approve/reject researcher) */}
            {reviewModal && (
                <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{reviewModal.type === 'approve' ? 'Approve' : 'Reject'} researcher</h3>
                        <p>
                            {reviewModal.researcher.fullName || (reviewModal.researcher.user && reviewModal.researcher.user.name)} –{' '}
                            {reviewModal.researcher.user && reviewModal.researcher.user.email}
                        </p>
                        <label>Review notes (optional)</label>
                        <textarea
                            id="review-notes"
                            rows={3}
                            placeholder="Add notes for your decision..."
                            className="modal-textarea"
                        />
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setReviewModal(null)}>Cancel</button>
                            {reviewModal.type === 'approve' ? (
                                <button
                                    className="btn approve"
                                    onClick={() =>
                                        handleApproveResearcher(
                                            reviewModal.researcher._id,
                                            document.getElementById('review-notes')?.value
                                        )
                                    }
                                >
                                    Approve
                                </button>
                            ) : (
                                <button
                                    className="btn reject"
                                    onClick={() =>
                                        handleRejectResearcher(
                                            reviewModal.researcher._id,
                                            document.getElementById('review-notes')?.value
                                        )
                                    }
                                >
                                    Reject
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete experiment modal */}
            {deleteModal && (
                <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete experiment</h3>
                        <p>“{deleteModal.experiment.title || deleteModal.experiment.name || 'Untitled'}” will be permanently deleted.</p>
                        <div className="modal-checkboxes">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!deleteModal.rejectResearcher}
                                    onChange={(e) =>
                                        setDeleteModal({ ...deleteModal, rejectResearcher: e.target.checked })
                                    }
                                />
                                Reject researcher (revoke researcher status)
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!deleteModal.reassignToParticipant}
                                    onChange={(e) =>
                                        setDeleteModal({ ...deleteModal, reassignToParticipant: e.target.checked })
                                    }
                                />
                                Reassign creator to participant
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteExperiment}>
                                Delete experiment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete researcher modal – user becomes ordinary user */}
            {deleteResearcherModal && (
                <div className="modal-overlay" onClick={() => setDeleteResearcherModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Remove researcher</h3>
                        <p>
                            Remove <strong>{deleteResearcherModal.fullName || (deleteResearcherModal.user && deleteResearcherModal.user.name)}</strong> as a researcher?
                            Their account will become an ordinary user (participant). The researcher record will be deleted.
                        </p>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setDeleteResearcherModal(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDeleteResearcher}>
                                Delete researcher
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
