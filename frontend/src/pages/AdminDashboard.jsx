import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [unapproved, setUnapproved] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUnapproved();
    }, []);

    const fetchUnapproved = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users/unapproved');
            setUnapproved(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching unapproved researchers:', err);
            setError('Failed to fetch unapproved researchers.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/admin/users/approve/${id}`);
            // Remove from list after approval
            setUnapproved(unapproved.filter(user => user._id !== id));
        } catch (err) {
            console.error('Error approving user:', err);
            alert('Failed to approve user.');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.patch(`/admin/users/reject/${id}`);
            // Remove from list after rejection or update status
            setUnapproved(unapproved.filter(user => user._id !== id));
        } catch (err) {
            console.error('Error rejecting user:', err);
            alert('Failed to reject user.');
        }
    };

    if (loading) return <div className="admin-loading">Loading approval queue...</div>;

    return (
        <div className="admin-dashboard">
            <h1>Admin Approval Queue</h1>
            <p className="subtitle">Review and approve researcher registrations to grant access to health data experiments.</p>

            {error && <div className="error-message">{error}</div>}

            <div className="table-container">
                <table className="approval-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Registration Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unapproved.length > 0 ? (
                            unapproved.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className="badge researcher">{user.role}</span></td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="actions">
                                        <button className="btn approve" onClick={() => handleApprove(user._id)}>Approve</button>
                                        <button className="btn reject" onClick={() => handleReject(user._id)}>Reject</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-msg">No researchers pending approval.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
