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
import { Users, UserCheck, UserX, Clock, Search, Download, Calendar, Filter, FileSpreadsheet, PieChart as PieChartIcon, LayoutDashboard, Database, Activity } from 'lucide-react';
import StatCard from '../components/admin/StatCard';
import { TrendChart, DistributionChart, QualificationChart } from '../components/admin/DashboardCharts';

const TAB_OVERVIEW = 'overview';
const TAB_RESEARCHERS = 'researchers';
const TAB_ALL_USERS = 'users';
const TAB_EXPERIMENTS = 'experiments';

const toObjectCounts = (value) => {
  if (!value) return {};
  if (Array.isArray(value)) {
    return value.reduce((acc, row) => {
      const key = String(row?.name || row?._id || '').trim();
      if (!key) return acc;
      const count = Number(row?.value ?? row?.count ?? 0);
      acc[key] = Number.isFinite(count) ? count : 0;
      return acc;
    }, {});
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [k, v]) => {
      const count = Number(v ?? 0);
      acc[k] = Number.isFinite(count) ? count : 0;
      return acc;
    }, {});
  }
  return {};
};

const normalizeOverviewAnalytics = (raw) => {
  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  if (!payload || typeof payload !== 'object') return null;

  const userRoles = toObjectCounts(payload.userRoles || payload.roleDistribution || {});
  const researcherStatus = toObjectCounts(payload.researcherStatus || payload.statusCounts || {});

  const statusKeys = Object.keys(researcherStatus);
  const approvedResearchers = statusKeys.reduce((sum, key) => (
    key.toLowerCase() === 'approved' ? sum + Number(researcherStatus[key] || 0) : sum
  ), 0);
  const pendingResearchers = statusKeys.reduce((sum, key) => (
    key.toLowerCase() === 'pending' ? sum + Number(researcherStatus[key] || 0) : sum
  ), 0);
  const rejectedResearchers = statusKeys.reduce((sum, key) => (
    key.toLowerCase() === 'rejected' ? sum + Number(researcherStatus[key] || 0) : sum
  ), 0);

  const summary = {
    totalUsers: Number(payload.summary?.totalUsers ?? payload.totalUsers ?? 0),
    totalResearchers: Number(payload.summary?.totalResearchers ?? payload.totalResearchers ?? 0),
    pendingResearchers: Number(payload.summary?.pendingResearchers ?? pendingResearchers ?? 0),
    approvedResearchers: Number(payload.summary?.approvedResearchers ?? approvedResearchers ?? 0),
    rejectedResearchers: Number(payload.summary?.rejectedResearchers ?? rejectedResearchers ?? 0),
    growthRate: Number(payload.summary?.growthRate ?? payload.growthRate ?? 0),
    newUsersThisWeek: Number(payload.summary?.newUsersThisWeek ?? payload.newUsersThisWeek ?? 0),
  };

  const registrationTrendRaw = Array.isArray(payload.registrationTrend)
    ? payload.registrationTrend
    : Array.isArray(payload.trend)
      ? payload.trend
      : [];

  const registrationTrend = registrationTrendRaw.map((row) => ({
    date: row?.date || row?._id || row?.label || '',
    count: Number(row?.count ?? row?.value ?? 0),
  })).filter((row) => row.date);

  const qualificationsRaw = Array.isArray(payload.qualifications)
    ? payload.qualifications
    : Array.isArray(payload.qualificationDistribution)
      ? payload.qualificationDistribution
      : [];

  const qualifications = qualificationsRaw.map((row) => ({
    name: row?.name || row?._id || 'Unspecified',
    count: Number(row?.count ?? row?.value ?? 0),
  }));

  return {
    summary,
    registrationTrend,
    userRoles,
    researcherStatus,
    qualifications,
  };
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
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

  // New states for expanded functionality
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30'); // '7', '30', 'all'

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id;

  useEffect(() => {
    if (activeTab === TAB_OVERVIEW) fetchAnalytics();
    if (activeTab === TAB_RESEARCHERS) fetchResearchers();
    if (activeTab === TAB_ALL_USERS) fetchAllUsers();
    if (activeTab === TAB_EXPERIMENTS) fetchExperiments();
  }, [activeTab, researcherStatusFilter, roleFilter, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const days = dateRange === 'all' ? 365 : parseInt(dateRange);
      const response = await api.get(`/admin/analytics?days=${days}`);
      setAnalytics(normalizeOverviewAnalytics(response.data));
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics statistics.');
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

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

  const handleExportCsv = () => {
    const dataToExport = activeTab === TAB_RESEARCHERS ? filteredResearchers : allUsers;
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = activeTab === TAB_RESEARCHERS 
      ? ['ID', 'Name', 'Email', 'Qualification', 'Type', 'Status', 'Registered At']
      : ['Name', 'Email', 'Role', 'Status', 'Registered At'];

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => {
        if (activeTab === TAB_RESEARCHERS) {
          return [
            `"${item.status === 'approved' ? (item.researcherId || '') : ''}"`,
            `"${item.fullName || item.user?.name || ''}"`,
            `"${item.user?.email || ''}"`,
            `"${item.highestAcademicQualification || ''}"`,
            `"${item.researcherType || ''}"`,
            `"${item.status || ''}"`,
            `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}"`
          ].join(',');
        } else {
          return [
            `"${item.name || ''}"`,
            `"${item.email || ''}"`,
            `"${item.role || ''}"`,
            `"${item.researcherStatus || 'N/A'}"`,
            `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}"`
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportOverviewPdf = async () => {
    try {
      const days = dateRange === 'all' ? 365 : parseInt(dateRange, 10);
      const response = await api.get(`/admin/analytics/export/pdf?days=${days}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `overview-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting overview PDF:', err);
      alert(err.response?.data?.message || 'Failed to export overview PDF.');
    }
  };

  const filteredResearchers = researchers.filter(r => {
    const researcherCode = (r.researcherId || '').toLowerCase();
    const name = (r.fullName || r.user?.name || '').toLowerCase();
    const email = (r.user?.email || '').toLowerCase();
    const matchSearch = researcherCode.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const filteredUsers = allUsers.filter(u => {
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    return matchSearch;
  });

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

      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          [TAB_OVERVIEW, 'Overview', LayoutDashboard],
          [TAB_RESEARCHERS, 'Researchers', Users],
          [TAB_ALL_USERS, 'All Users', UserCheck],
          [TAB_EXPERIMENTS, 'Experiments', Database],
        ].map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-4" />}

      {activeTab === TAB_OVERVIEW && (
        <div className="space-y-8 px-2 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Platform Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Key metrics and platform trends</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportOverviewPdf} className="flex items-center gap-2">
                <Download size={16} /> Export PDF
              </Button>
              <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                {[
                  { label: '7D', value: '7' },
                  { label: '30D', value: '30' },
                  { label: '90D', value: '90' },
                  { label: 'All', value: 'all' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDateRange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      dateRange === opt.value
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Users" 
                  value={analytics.summary?.totalUsers || 0} 
                  icon={Users} 
                  trend={(analytics.summary?.growthRate || 0) >= 0 ? 'up' : 'down'} 
                  trendValue={Math.abs(analytics.summary?.growthRate || 0)}
                  description="Total registered in system"
                />
                <StatCard 
                  title="Pending" 
                  value={analytics.summary?.pendingResearchers || 0} 
                  icon={Clock} 
                  description="Researchers awaiting review"
                />
                <StatCard 
                  title="Approved" 
                  value={analytics.summary?.approvedResearchers || 0} 
                  icon={UserCheck} 
                  description="Verified medical experts"
                />
                <StatCard 
                  title="Growth" 
                  value={analytics.summary?.newUsersThisWeek || 0} 
                  icon={Activity} 
                  trend={(analytics.summary?.newUsersThisWeek || 0) > 0 ? 'up' : undefined}
                  trendValue={analytics.summary?.growthRate || 0}
                  description={`Last ${dateRange === 'all' ? '30' : dateRange} days`}
                />
              </div>

              {/* Charts Section */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-sm text-indigo-900">
                Analyzed {analytics.summary?.totalUsers || 0} users and {analytics.summary?.totalResearchers || 0} researchers across {analytics.registrationTrend?.length || 0} days of trend data.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
                  <h3 className="font-bold text-slate-800 mb-6">Registration Trend</h3>
                  <div className="h-72 w-full">
                    <TrendChart data={analytics.registrationTrend} />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
                  <h3 className="font-bold text-slate-800 mb-6">Researcher Status</h3>
                  <div className="h-72 w-full">
                    <DistributionChart data={[
                      { name: 'Approved', value: analytics.summary?.approvedResearchers || 0 },
                      { name: 'Pending', value: analytics.summary?.pendingResearchers || 0 },
                      { name: 'Rejected', value: analytics.summary?.rejectedResearchers || 0 },
                    ].filter(d => d.value > 0)} variant="pie" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
                  <h3 className="font-bold text-slate-800 mb-6">User Role Distribution</h3>
                  <div className="h-72 w-full">
                    <DistributionChart data={Object.entries(analytics.userRoles || {}).map(([name, value]) => ({
                      name: name.charAt(0).toUpperCase() + name.slice(1),
                      value
                    }))} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[350px]">
                  <h3 className="font-bold text-slate-800 mb-6">Top Qualifications</h3>
                  <div className="h-72 w-full">
                    <QualificationChart data={(analytics.qualifications || []).slice(0, 8)} />
                  </div>
                </div>
              </div>

            </>
          ) : (
            <EmptyState title="No analytics data" description="Could not load statistics." />
          )}
        </div>
      )}

      {activeTab === TAB_RESEARCHERS && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search researchers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
                />
              </div>
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
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="flex items-center gap-2">
                <FileSpreadsheet size={16} /> Export CSV
              </Button>
            </div>
          </div>
          <Card padding={false} className="overflow-hidden border border-slate-200 bg-[#F8FAFC] shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px] border-b border-slate-100">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px] border-b border-slate-100">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Qualification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider max-w-[200px] border-b border-slate-100">
                      Purpose
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {researchersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={7} />
                    ))
                  ) : filteredResearchers.length > 0 ? (
                    filteredResearchers.map((r) => {
                      const s = (r.status || '').toLowerCase();
                      const isPending = s === 'pending' || s === '';
                      return (
                        <tr
                          key={r._id}
                          onClick={() => setDetailModalResearcher(r)}
                          className="hover:bg-white/80 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {s === 'approved' ? (r.researcherId || '—') : '—'}
                          </td>
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
                      <td colSpan={7} className="px-4 py-12 text-center">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                  Role:
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
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="flex items-center gap-2">
              <FileSpreadsheet size={16} /> Export CSV
            </Button>
          </div>
          <Card padding={false} className="overflow-hidden border border-slate-200 bg-[#F8FAFC] shadow-sm rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Researcher Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Registered</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={6} />
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const role = (user.role || '').toLowerCase();
                      const isAdmin = role === 'admin';
                      const resStatus = (user.researcherStatus || '').toLowerCase();
                      const isResearcherPending = !isAdmin && role === 'researcher' && (resStatus === 'pending' || resStatus === '');
                      return (
                        <tr key={user._id} className={`${isAdmin ? 'bg-amber-50/40' : 'hover:bg-white/80'} transition-colors`}>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge role={role}>{user.role || '—'}</Badge>
                              {isAdmin && <span className="text-[11px] font-semibold text-amber-700">Pinned</span>}
                            </div>
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
                              {isAdmin ? (
                                <span className="text-xs text-gray-500">Protected account</span>
                              ) : null}
                              {isResearcherPending && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => handleApproveUser(user._id)}>Approve</Button>
                                  <Button size="sm" variant="danger" onClick={() => handleRejectUser(user._id)}>Reject</Button>
                                </>
                              )}
                              {isAdmin ? null : String(user._id) === String(currentUserId) ? (
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
