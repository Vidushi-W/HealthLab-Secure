import React, { useState, useEffect } from 'react';
import api from '../api/api';
import {
  Button,
  Card,
  Badge,
  Modal,
  Textarea,
  ErrorMessage,
  EmptyState,
  TableRowSkeleton,
} from '../components/ui';

const TAB_RESEARCHERS = 'researchers';
const TAB_ALL_USERS = 'users';
const TAB_EXPERIMENTS = 'experiments';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(TAB_RESEARCHERS);
  const [researchers, setResearchers] = useState([]);
  const [researcherStatusFilter, setResearcherStatusFilter] = useState('');
  const [researchersLoading, setResearchersLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [detailModalResearcher, setDetailModalResearcher] = useState(null);
  const [deleteResearcherModal, setDeleteResearcherModal] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [experimentsLoading, setExperimentsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [error, setError] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [detailReviewNotes, setDetailReviewNotes] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id;

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

  const handleApproveResearcher = async (researcherId, notes) => {
    try {
      await api.put(`/admin/researchers/${researcherId}/approve`, { reviewNotes: notes || '' });
      setReviewModal(null);
      setDetailModalResearcher(null);
      setReviewNotes('');
      setDetailReviewNotes('');
      fetchResearchers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve researcher.');
    }
  };

  const handleRejectResearcher = async (researcherId, notes) => {
    try {
      await api.put(`/admin/researchers/${researcherId}/reject`, { reviewNotes: notes || '' });
      setReviewModal(null);
      setDetailModalResearcher(null);
      setReviewNotes('');
      setDetailReviewNotes('');
      fetchResearchers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject researcher.');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.patch(`/admin/users/approve/${userId}`);
      fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve.');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await api.patch(`/admin/users/reject/${userId}`);
      fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    const userId = deleteUserModal._id;
    try {
      await api.delete(`/admin/users/${userId}`);
      setDeleteUserModal(null);
      fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
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
      alert(err.response?.data?.message || 'Failed to delete experiment.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const params = researcherStatusFilter ? { status: researcherStatusFilter } : {};
      const response = await api.get('/admin/researchers/export/pdf', { responseType: 'blob', params });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `researchers-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF.');
    }
  };

  const getStatusVariant = (status) => {
    if (!status) return 'pending';
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'approved';
    if (s === 'rejected') return 'rejected';
    return 'pending';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Manage researchers (approve/reject), view all users, delete experiments if needed, and export reports.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          [TAB_RESEARCHERS, 'Researchers'],
          [TAB_ALL_USERS, 'All Users'],
          [TAB_EXPERIMENTS, 'Experiments'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-4" />}

      {activeTab === TAB_RESEARCHERS && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <label htmlFor="researcher-status-filter" className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="researcher-status-filter"
                value={researcherStatusFilter}
                onChange={(e) => setResearcherStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px]"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <Button variant="secondary" onClick={handleExportPdf}>
              Download PDF Report
            </Button>
          </div>
          <Card padding={false} className="overflow-hidden border border-slate-200 bg-[#F8FAFC]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Qualification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider max-w-[200px]">
                      Purpose
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#F8FAFC] divide-y divide-slate-200">
                  {researchersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={6} />
                    ))
                  ) : researchers.length > 0 ? (
                    researchers.map((r) => {
                      const s = (r.status || '').toLowerCase();
                      const isPending = s === 'pending' || s === '';
                      return (
                        <tr
                          key={r._id}
                          onClick={() => setDetailModalResearcher(r)}
                          className="hover:bg-white/80 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{r.fullName || (r.user && r.user.name) || '—'}</span>
                              {r.isFlagged && <Badge status="rejected">Flagged</Badge>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {r.user?.email || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {r.highestAcademicQualification || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={r.purpose}>
                            {r.purpose ? (r.purpose.length > 60 ? r.purpose.slice(0, 60) + '…' : r.purpose) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={getStatusVariant(r.status)}>{r.status || 'pending'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap justify-end gap-1">
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => setReviewModal({ type: 'approve', researcher: r })}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setReviewModal({ type: 'reject', researcher: r })}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setDeleteResearcherModal(r)}
                                title="Remove researcher; user becomes ordinary user"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <EmptyState
                          title="No researchers found"
                          description="Try changing the status filter."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === TAB_ALL_USERS && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
              Filter by role:
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[160px]"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="researcher">Researcher</option>
              <option value="participant">Participant</option>
            </select>
          </div>
          <Card padding={false} className="overflow-hidden border border-slate-200 bg-[#F8FAFC]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Researcher Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#F8FAFC] divide-y divide-slate-200">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={6} />
                    ))
                  ) : allUsers.length > 0 ? (
                    allUsers.map((user) => {
                      const role = (user.role || '').toLowerCase();
                      const resStatus = (user.researcherStatus || '').toLowerCase();
                      const isResearcherPending = role === 'researcher' && (resStatus === 'pending' || resStatus === '');
                      return (
                        <tr key={user._id} className="hover:bg-white/80 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <Badge role={role}>{user.role || '—'}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            {user.researcherStatus ? (
                              <Badge status={getStatusVariant(user.researcherStatus)}>{user.researcherStatus}</Badge>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-1 flex-wrap">
                              {isResearcherPending && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => handleApproveUser(user._id)}>Approve</Button>
                                  <Button size="sm" variant="danger" onClick={() => handleRejectUser(user._id)}>Reject</Button>
                                </>
                              )}
                              {String(user._id) === String(currentUserId) ? (
                                <span className="text-xs text-gray-400">(you)</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => setDeleteUserModal(user)}
                                  title="Permanently delete this user"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12">
                        <EmptyState title="No users found" description="Try changing the role filter." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === TAB_EXPERIMENTS && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            You can delete an experiment (e.g. for policy violations). Optionally reject the researcher and/or reassign them to participant.
          </p>
          <Card padding={false} className="overflow-hidden border border-slate-200 bg-[#F8FAFC]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[#F8FAFC] divide-y divide-slate-200">
                  {experimentsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={3} />
                    ))
                  ) : experiments.length > 0 ? (
                    experiments.map((exp) => (
                      <tr key={exp._id} className="hover:bg-white/80 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{exp.title || exp.name || 'Untitled'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteModal({ experiment: exp, rejectResearcher: false, reassignToParticipant: false })}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-12">
                        <EmptyState title="No experiments found" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Researcher detail modal */}
      <Modal
        open={!!detailModalResearcher}
        onClose={() => { setDetailModalResearcher(null); setDetailReviewNotes(''); }}
        title={<span className="text-indigo-700">Researcher details</span>}
        size="lg"
      >
        {detailModalResearcher && (
          <div className="space-y-4">
            {detailModalResearcher.isFlagged && detailModalResearcher.flags?.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-red-800 font-semibold text-sm">Flagged Researcher</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {detailModalResearcher.flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      <span className="font-medium text-red-900">{flag.reason}</span>
                      <span className="text-xs text-red-500 ml-2">({new Date(flag.createdAt).toLocaleDateString()})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Name', detailModalResearcher.fullName || (detailModalResearcher.user && detailModalResearcher.user.name) || '—'],
                ['Email', detailModalResearcher.user?.email || '—'],
                ['NIC', detailModalResearcher.nic || '—'],
                ['Gender', detailModalResearcher.gender || '—'],
                ['Current workplace', detailModalResearcher.currentWorkplace || '—'],
                ['Highest qualification', detailModalResearcher.highestAcademicQualification || '—'],
                ['Researcher type', detailModalResearcher.researcherType || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {detailModalResearcher.researcherType === 'Other' && detailModalResearcher.otherResearcherTypeExplanation && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other (explanation)</p>
                <p className="text-sm text-gray-900 mt-0.5">{detailModalResearcher.otherResearcherTypeExplanation}</p>
              </div>
            )}
            {detailModalResearcher.researcherType === 'Affiliated to Organization' && detailModalResearcher.affiliationProof && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Affiliation Proof</p>
                <a 
                  href={detailModalResearcher.affiliationProof} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-0.5 hover:underline block truncate"
                  title="View attached document or image"
                >
                  View Document / Image
                </a>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Published research</p>
              <p className="text-sm text-gray-900 mt-0.5">{detailModalResearcher.hasPublishedResearch ? 'Yes' : 'No'}</p>
            </div>
            {detailModalResearcher.hasPublishedResearch && detailModalResearcher.publicationSiteOrLink && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Publication site / link</p>
                <a 
                  href={detailModalResearcher.publicationSiteOrLink.includes('://') ? detailModalResearcher.publicationSiteOrLink : `https://${detailModalResearcher.publicationSiteOrLink}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-indigo-600 hover:text-indigo-800 mt-0.5 hover:underline block truncate"
                  title={detailModalResearcher.publicationSiteOrLink}
                >
                  {detailModalResearcher.publicationSiteOrLink}
                </a>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</p>
              <p className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">{detailModalResearcher.purpose || '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
              <Badge status={getStatusVariant(detailModalResearcher.status)}>{detailModalResearcher.status || 'pending'}</Badge>
            </div>
            {detailModalResearcher.reviewNotes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review notes</p>
                <p className="text-sm text-gray-900 mt-0.5">{detailModalResearcher.reviewNotes}</p>
              </div>
            )}
            {detailModalResearcher.reviewedAt && (
              <p className="text-xs text-gray-500">Reviewed at {new Date(detailModalResearcher.reviewedAt).toLocaleString()}</p>
            )}
            {(() => {
              const s = (detailModalResearcher.status || '').toLowerCase();
              const isPending = s === 'pending' || s === '';
              return isPending ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Review notes (optional)</label>
                  <Textarea
                    rows={3}
                    placeholder="Add notes for your decision..."
                    value={detailReviewNotes}
                    onChange={(e) => setDetailReviewNotes(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                    <Button variant="danger" onClick={() => {
                      setDetailModalResearcher(null);
                      setDeleteResearcherModal(detailModalResearcher);
                    }}>
                      Delete Researcher
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => { setDetailModalResearcher(null); setDetailReviewNotes(''); }}>
                        Close
                      </Button>
                      <Button variant="success" onClick={() => handleApproveResearcher(detailModalResearcher._id, detailReviewNotes)}>
                        Approve
                      </Button>
                      <Button variant="danger" onClick={() => handleRejectResearcher(detailModalResearcher._id, detailReviewNotes)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <Button variant="danger" onClick={() => {
                    setDetailModalResearcher(null);
                    setDeleteResearcherModal(detailModalResearcher);
                  }}>
                    Delete Researcher
                  </Button>
                  <Button variant="secondary" onClick={() => { setDetailModalResearcher(null); setDetailReviewNotes(''); }}>
                    Close
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Quick review modal */}
      <Modal
        open={!!reviewModal}
        onClose={() => { setReviewModal(null); setReviewNotes(''); }}
        title={reviewModal?.type === 'approve' ? 'Approve researcher' : 'Reject researcher'}
        size="md"
      >
        {reviewModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {reviewModal.researcher.fullName || (reviewModal.researcher.user && reviewModal.researcher.user.name)} –{' '}
              {reviewModal.researcher.user?.email}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review notes (optional)</label>
              <Textarea
                rows={3}
                placeholder="Add notes for your decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setReviewModal(null); setReviewNotes(''); }}>
                Cancel
              </Button>
              {reviewModal.type === 'approve' ? (
                <Button variant="success" onClick={() => handleApproveResearcher(reviewModal.researcher._id, reviewNotes)}>
                  Approve
                </Button>
              ) : (
                <Button variant="danger" onClick={() => handleRejectResearcher(reviewModal.researcher._id, reviewNotes)}>
                  Reject
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete experiment modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete experiment"
        size="md"
      >
        {deleteModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              &ldquo;{deleteModal.experiment.title || deleteModal.experiment.name || 'Untitled'}&rdquo; will be permanently deleted.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!deleteModal.rejectResearcher}
                  onChange={(e) => setDeleteModal({ ...deleteModal, rejectResearcher: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Reject researcher (revoke researcher status)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!deleteModal.reassignToParticipant}
                  onChange={(e) => setDeleteModal({ ...deleteModal, reassignToParticipant: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Reassign creator to participant</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteExperiment}>Delete experiment</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete researcher modal */}
      <Modal
        open={!!deleteResearcherModal}
        onClose={() => setDeleteResearcherModal(null)}
        title="Remove researcher"
        size="md"
      >
        {deleteResearcherModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Remove <strong>{deleteResearcherModal.fullName || (deleteResearcherModal.user && deleteResearcherModal.user.name)}</strong> as a
              researcher? Their account will become an ordinary user (participant). The researcher record will be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteResearcherModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteResearcher}>Delete researcher</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete user modal */}
      <Modal
        open={!!deleteUserModal}
        onClose={() => setDeleteUserModal(null)}
        title="Delete user"
        size="md"
      >
        {deleteUserModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Permanently delete <strong>{deleteUserModal.name}</strong> ({deleteUserModal.email})? This will remove their account
              and, if they are a researcher, their researcher record. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteUserModal(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteUser}>Delete user</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
