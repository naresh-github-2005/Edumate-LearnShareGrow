import React, { useState, useEffect } from 'react';

// API Configuration
const API_BASE = 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  if (config.body && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white max-w-md`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

// Stats Card Component
const StatsCard = ({ title, value, icon, color, description }) => (
  <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
      </div>
      <div className="bg-white/20 rounded-full p-3">
        {icon}
      </div>
    </div>
  </div>
);

// Main Admin Panel Component
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [pendingContent, setPendingContent] = useState({ notes: [], videos: [], posts: [] });
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNotes: 0,
    pendingNotes: 0,
    totalVideos: 0,
    pendingVideos: 0,
    totalComplaints: 0,
    pendingComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // &&&&Add this state at the top with your other states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingContent, setRejectingContent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  //&&&&&&
  // User Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Content Moderation States
  const [contentTab, setContentTab] = useState('notes');
  const [previewContent, setPreviewContent] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Complaint Management States
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, contentRes, complaintsRes] = await Promise.all([
        apiCall('/admin/stats'),
        apiCall('/admin/users'),
        apiCall('/admin/pending-content'),
        apiCall('/admin/complaints')
      ]);
      
      setStats(statsRes);
      setUsers(usersRes);
      setPendingContent(contentRes);
      setComplaints(complaintsRes);
    } catch (error) {
      setToast({ message: 'Failed to fetch admin data', type: 'error' });
    }
    setLoading(false);
  };

  // User Management Functions
  const updateUserStatus = async (userId, updates) => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: updates,
      });
      setToast({ message: 'User updated successfully!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to update user', type: 'error' });
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
        setToast({ message: 'User deleted successfully!', type: 'success' });
        fetchAllData();
      } catch (error) {
        setToast({ message: 'Failed to delete user', type: 'error' });
      }
    }
  };

  // Content Moderation Functions
  const approveContent = async (type, id) => {
    try {
      await apiCall(`/admin/approve/${type}/${id}`, { method: 'PATCH' });
      setToast({ message: 'Content approved successfully!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to approve content', type: 'error' });
    }
  };

  // const rejectContent = async (type, id, reason = '') => {
  //   try {
  //     await apiCall(`/admin/reject/${type}/${id}`, {
  //       method: 'PATCH',
  //       body: { reason }
  //     });
  //     setToast({ message: 'Content rejected successfully!', type: 'success' });
  //     fetchAllData();
  //   } catch (error) {
  //     setToast({ message: 'Failed to reject content', type: 'error' });
  //   }
  // };

  // Complaint Management Functions
  const updateComplaintStatus = async (complaintId, updates) => {
    try {
      await apiCall(`/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        body: updates,
      });
      setToast({ message: 'Complaint updated successfully!', type: 'success' });
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to update complaint', type: 'error' });
    }
  };

  // Filter Functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredComplaints = complaints.filter(complaint => 
    complaintFilter === 'all' || complaint.status === complaintFilter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
      case 'doc':
      case 'docx':
        return <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
      default:
        return <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
    }
  };

  
  // Rejection Modal Component
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setToast({ message: 'Please provide a rejection reason', type: 'error' });
      return;
    }

    try {
      const contentType = rejectingContent.subject ? 
        (rejectingContent.videoUrl ? 'videos' : 'notes') : 'posts';
      
      await apiCall(`/admin/reject/${contentType}/${rejectingContent._id}`, {
        method: 'PATCH',
        body: { rejectionReason: rejectionReason.trim() }
      });
      
      setToast({ message: 'Content rejected and user notified', type: 'success' });
      setShowRejectModal(false);
      setRejectingContent(null);
      setRejectionReason('');
      fetchAllData();
    } catch (error) {
      setToast({ message: 'Failed to reject content', type: 'error' });
    }
  };

if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Rejection Modal */}
      {showRejectModal && rejectingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reject Content</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingContent(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                You are about to reject: <strong>{rejectingContent.title}</strong>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="4"
                placeholder="Provide a clear reason for rejection so the user can understand and improve..."
                required
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                The user will be notified with this reason.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingContent(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, content, and complaints</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Administrator
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Content Moderation
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'complaints'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Complaints
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="Total Users"
                  value={stats.totalUsers}
                  description={`${stats.activeUsers} active`}
                  color="from-blue-500 to-blue-600"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  }
                />
                
                <StatsCard
                  title="Notes"
                  value={stats.totalNotes}
                  description={`${stats.pendingNotes} pending`}
                  color="from-green-500 to-green-600"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  }
                />
                
                <StatsCard
                  title="Videos"
                  value={stats.totalVideos}
                  description={`${stats.pendingVideos} pending`}
                  color="from-purple-500 to-purple-600"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  }
                />
                
                <StatsCard
                  title="Complaints"
                  value={stats.totalComplaints}
                  description={`${stats.pendingComplaints} pending`}
                  color="from-orange-500 to-orange-600"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New user registered</p>
                    <p className="text-sm text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New notes uploaded</p>
                    <p className="text-sm text-gray-500">15 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New complaint filed</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <div className="text-sm text-gray-600">
                Total Users: {users.length} | Active: {users.filter(u => u.isActive).length} | 
                Inactive: {users.filter(u => !u.isActive).length}
              </div>
            </div>

            {/* User Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search by name or email..."
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.course} {user.year && `- ${user.year}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                            <button
                              onClick={() => updateUserStatus(user._id, { isActive: !user.isActive })}
                              className={`${
                                user.isActive 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => updateUserStatus(user._id, { 
                                role: user.role === 'admin' ? 'student' : 'admin' 
                              })}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              {user.role === 'admin' ? 'Make Student' : 'Make Admin'}
                            </button>
                                                        <button
                              onClick={() => deleteUser(user._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xl">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                        <p className="text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Role</h4>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          selectedUser.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.role}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                          selectedUser.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Course</h4>
                        <p className="text-gray-700">{selectedUser.course || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Year</h4>
                        <p className="text-gray-700">{selectedUser.year || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Joined Date</h4>
                        <p className="text-gray-700">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Last Updated</h4>
                        <p className="text-gray-700">{new Date(selectedUser.updatedAt || selectedUser.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t flex space-x-4">
                      <button
                        onClick={() => {
                          updateUserStatus(selectedUser._id, { isActive: !selectedUser.isActive });
                          setShowUserModal(false);
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                          selectedUser.isActive
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
                      </button>
                      <button
                        onClick={() => {
                          updateUserStatus(selectedUser._id, { 
                            role: selectedUser.role === 'admin' ? 'student' : 'admin' 
                          });
                          setShowUserModal(false);
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        {selectedUser.role === 'admin' ? 'Make Student' : 'Make Admin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Moderation Tab */}
        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
              <div className="text-sm text-gray-600">
                Pending: Notes ({pendingContent.notes.length}) | Videos ({pendingContent.videos.length}) | Posts ({pendingContent.posts.length})
              </div>
            </div>

            {/* Content Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setContentTab('notes')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      contentTab === 'notes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Notes ({pendingContent.notes.length})
                  </button>
                  <button
                    onClick={() => setContentTab('videos')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      contentTab === 'videos'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Videos ({pendingContent.videos.length})
                  </button>
                  <button
                    onClick={() => setContentTab('posts')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      contentTab === 'posts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Placement Posts ({pendingContent.posts.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {contentTab === 'notes' && pendingContent.notes.map((note) => (
                <div key={note._id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(note.fileName)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{note.title}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {note.subject}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{note.description}</p>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">+{note.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>By {note.uploadedBy?.name}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPreviewContent(note);
                        setShowPreviewModal(true);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => approveContent('notes', note._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Approve
                    </button>
                    <button
                      //onClick={() => rejectContent('notes', note._id)}
                        onClick={() => {
                          setRejectingContent(note); // or video, or post
                          setShowRejectModal(true);
                        }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {contentTab === 'videos' && pendingContent.videos.map((video) => (
                <div key={video._id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10H7a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2"></path>
                    </svg>
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                        {video.subject}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{video.description}</p>
                  
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">+{video.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>By {video.uploadedBy?.name}</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPreviewContent(video);
                        setShowPreviewModal(true);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => approveContent('videos', video._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Approve
                    </button>
                    <button
                      //onClick={() => rejectContent('videos', video._id)}
                      onClick={() => {
                          setRejectingContent(video); // or video, or post
                          setShowRejectModal(true);
                        }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {contentTab === 'posts' && pendingContent.posts.map((post) => (
                <div key={post._id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {post.company}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < post.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-3 text-sm">{post.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">Experience:</h4>
                    <p className="text-gray-700 text-sm line-clamp-4">{post.experience}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>By {post.userId?.name}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setPreviewContent(post);
                        setShowPreviewModal(true);
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => approveContent('posts', post._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Approve
                    </button>
                    <button
                      // onClick={() => rejectContent('posts', post._id)}
                        onClick={() => {
                            setRejectingContent(post); // or video, or post
                            setShowRejectModal(true);
                          }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {pendingContent[contentTab] && pendingContent[contentTab].length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending {contentTab}</h3>
                <p className="text-gray-500">All {contentTab} have been reviewed</p>
              </div>
            )}

{showPreviewModal && previewContent && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-8 max-w-6xl w-full max-h-screen overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{previewContent.title}</h2>
        <button
          onClick={() => setShowPreviewModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Preview Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          {previewContent.videoUrl && (
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="aspect-video">
                {previewContent.videoUrl.includes('youtube.com') || previewContent.videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={previewContent.videoUrl.replace('watch?v=', 'embed/')}
                    title={previewContent.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : previewContent.videoUrl.includes('drive.google.com') ? (
                  <iframe
                    className="w-full h-full"
                    src={previewContent.videoUrl.replace('/view', '/preview')}
                    title={previewContent.title}
                    frameBorder="0"
                    allow="autoplay"
                  ></iframe>
                ) : (
                  <video className="w-full h-full" controls>
                    <source src={`http://localhost:5000/${previewContent.videoUrl}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Document Preview */}
          {previewContent.fileName && !previewContent.videoUrl && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getFileIcon(previewContent.fileName)}
                  <div>
                    <p className="font-semibold text-gray-900">{previewContent.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {previewContent.fileType} • {previewContent.fileSize ? (previewContent.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:5000/api/notes/${previewContent._id}/download`, {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                      });
                      
                      if (!response.ok) throw new Error('Download failed');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = url;
                      a.download = previewContent.fileName;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      setToast({ message: 'Download started!', type: 'success' });
                    } catch (error) {
                      setToast({ message: 'Failed to download file', type: 'error' });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>Download & Review</span>
                </button>
              </div>

              {/* PDF Preview */}
              {(previewContent.fileName?.toLowerCase().endsWith('.pdf') || previewContent.fileName?.toLowerCase().endsWith('.txt')) && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <iframe
                    src={`http://localhost:5000/${previewContent.fileUrl}#toolbar=0`}
                    className="w-full h-96"
                    title="PDF Preview"
                  />
                </div>
              )}
            </div>
          )}

          {/* Content Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Content Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  {previewContent.subject ? 'Subject' : 'Company'}
                </h4>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  previewContent.videoUrl ? 'bg-purple-100 text-purple-800' :
                  previewContent.company ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {previewContent.subject || previewContent.company}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-gray-900 bg-white p-4 rounded-lg">{previewContent.description}</p>
              </div>

              {previewContent.experience && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Interview Experience</h4>
                  <div className="bg-white p-4 rounded-lg max-h-64 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap">{previewContent.experience}</p>
                  </div>
                </div>
              )}

              {previewContent.rating && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Rating</h4>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < previewContent.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-gray-600">({previewContent.rating}/5)</span>
                  </div>
                </div>
              )}

              {previewContent.tags && previewContent.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewContent.tags.map((tag, index) => (
                      <span key={index} className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Uploaded by</p>
                <p className="text-gray-900 font-medium">{previewContent.uploadedBy?.name || previewContent.userId?.name}</p>
                <p className="text-gray-500 text-xs">{previewContent.uploadedBy?.email || previewContent.userId?.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Upload date</p>
                <p className="text-gray-900">{new Date(previewContent.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending Review
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                const contentType = previewContent.subject ? 
                  (previewContent.videoUrl ? 'videos' : 'notes') : 'posts';
                approveContent(contentType, previewContent._id);
                setShowPreviewModal(false);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Approve Content</span>
            </button>

            <button
              onClick={() => {
                setRejectingContent(previewContent);
                setShowRejectModal(true);
                setShowPreviewModal(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span>Reject with Reason</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Complaint Management</h2>
              <div className="text-sm text-gray-600">
                Total: {complaints.length} | Pending: {complaints.filter(c => c.status === 'pending').length} | 
                Resolved: {complaints.filter(c => c.status === 'resolved').length}
              </div>
            </div>

            {/* Complaint Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                  value={complaintFilter}
                  onChange={(e) => setComplaintFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>By {complaint.userId?.name}</span>
                        <span>•</span>
                        <span className="capitalize">{complaint.contentType} complaint</span>
                        <span>•</span>
                        <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 mb-4">{complaint.description}</p>
                      
                      {complaint.adminResponse && (
                        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                          <h4 className="font-medium text-blue-900 mb-2">Admin Response:</h4>
                          <p className="text-blue-800">{complaint.adminResponse}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setResponseText(complaint.adminResponse || '');
                          setShowComplaintModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                      >
                        View Details
                      </button>
                      
                      {complaint.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateComplaintStatus(complaint._id, { status: 'investigating' })}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                          >
                            Start Investigation
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint._id, { status: 'rejected' })}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {complaint.status === 'investigating' && (
                        <button
                          onClick={() => updateComplaintStatus(complaint._id, { status: 'resolved' })}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-500">
                  {complaintFilter === 'all' ? 'No complaints have been filed yet' : `No ${complaintFilter} complaints`}
                </p>
              </div>
            )}

            {/* Complaint Details Modal */}
            {showComplaintModal && selectedComplaint && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
                    <button
                      onClick={() => setShowComplaintModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span>Filed by: {selectedComplaint.userId?.name}</span>
                        <span>•</span>
                        <span>Type: {selectedComplaint.contentType}</span>
                        <span>•</span>
                        <span>Date: {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedComplaint.status)}`}>
                        {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Complaint Description</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{selectedComplaint.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Admin Response</h4>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Enter your response to the complaint..."
                      />
                    </div>
                    
                    <div className="flex space-x-4">
                      {selectedComplaint.status === 'pending' && (
                        <button
                          onClick={() => {
                            updateComplaintStatus(selectedComplaint._id, { 
                              status: 'investigating',
                              adminResponse: responseText
                            });
                            setShowComplaintModal(false);
                          }}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium"
                        >
                          Start Investigation
                        </button>
                      )}
                      
                      {(selectedComplaint.status === 'pending' || selectedComplaint.status === 'investigating') && (
                        <button
                          onClick={() => {
                            updateComplaintStatus(selectedComplaint._id, { 
                              status: 'resolved',
                              adminResponse: responseText
                            });
                            setShowComplaintModal(false);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          updateComplaintStatus(selectedComplaint._id, { 
                            status: 'rejected',
                            adminResponse: responseText
                          });
                          setShowComplaintModal(false);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Reject Complaint
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Export the main component
export default AdminPanel;