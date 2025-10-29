import React, { useState, useEffect, useRef } from 'react';

// API Configuration
const API_BASE = 'http://localhost:5000/api';

//new file code:
const SERVER_URL = 'http://localhost:5000';

// Helper function to get correct file URL
const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  if (fileUrl.startsWith('/')) return `${SERVER_URL}${fileUrl}`;
  return `${SERVER_URL}/${fileUrl}`;
};

// Helper function to get file icon based on type
const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  
  const icons = {
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📝',
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    // Code
    js: '💻',
    py: '💻',
    java: '💻',
    cpp: '💻',
    // Spreadsheets
    xls: '📊',
    xlsx: '📊',
    csv: '📊',
    // Presentations
    ppt: '📊',
    pptx: '📊',
    // Default
    default: '📎'
  };
  
  return icons[ext] || icons.default;
};
//new file code.

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  // Handle FormData (for file uploads)
  if (config.body instanceof FormData) {
    // Don't set Content-Type for FormData - browser will set it with boundary
  } else if (config.body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
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
      {message}
    </div>
  );
};

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
);

// Invitations Modal Component
const InvitationsModal = ({ invitations, onClose, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Group Invitations ({invitations.length})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
            </div>
            <p className="text-gray-600">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {invitation.groupId?.groupName || 'Unknown Group'}
                    </h3>
                    {invitation.groupId?.description && (
                      <p className="text-gray-600 text-sm mb-3">{invitation.groupId.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Invited by: <strong>{invitation.invitedBy?.name}</strong></span>
                      <span>•</span>
                      <span>{new Date(invitation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => onAccept(invitation._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Accept Invitation
                  </button>
                  <button
                    onClick={() => onReject(invitation._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Group Modal
const CreateGroupModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    members: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await apiCall(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setSearching(false);
  };

  const addMember = (user) => {
    if (!selectedMembers.find(m => m._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
      setSearchResults([]);
      setFormData({...formData, members: ''});
    }
  };

  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...formData,
      memberIds: selectedMembers.map(m => m._id)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Project Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.groupName}
              onChange={(e) => setFormData({...formData, groupName: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Machine Learning Project"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Add Members
            </label>
            <input
              type="text"
              value={formData.members}
              onChange={(e) => {
                setFormData({...formData, members: e.target.value});
                searchUsers(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search users by name or email..."
            />
            
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => addMember(user)}
                    className="w-full px-4 py-2 hover:bg-gray-50 flex items-center space-x-3 text-left"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedMembers.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Members ({selectedMembers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member._id}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center space-x-2"
                    >
                      <span className="text-sm">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Group Details Modal with Sent Invitations
const GroupDetailsModal = ({ group, onClose, onAddMembers, onRemoveMember, onLeaveGroup, onCancelInvitation, isCreator, sentInvitations }) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('members');

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await apiCall(`/users/search?query=${encodeURIComponent(query)}`);
      const filtered = response.filter(
        user => !group.members.find(m => m._id === user._id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addMemberToSelection = (user) => {
    if (!selectedMembers.find(m => m._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleAddMembers = () => {
    if (selectedMembers.length > 0) {
      onAddMembers(selectedMembers.map(m => m._id));
      setSelectedMembers([]);
      setShowAddMembers(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{group.groupName}</h2>
            <p className="text-gray-600 mt-1">{group.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Members ({group.members?.length || 0})
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'invitations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Invitations ({sentInvitations?.length || 0})
            </button>
          )}
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Group Members</h3>
              {isCreator && (
                <button
                  onClick={() => setShowAddMembers(!showAddMembers)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Add Members
                </button>
              )}
            </div>

            {showAddMembers && isCreator && (
              <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                  placeholder="Search users to add..."
                />
                
                {searchResults.length > 0 && (
                  <div className="mb-2 bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => addMemberToSelection(user)}
                        className="w-full px-4 py-2 hover:bg-gray-50 flex items-center space-x-3 text-left"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="bg-white px-3 py-1 rounded-full flex items-center space-x-2 text-sm border border-gray-300"
                        >
                          <span>{member.name}</span>
                          <button
                            onClick={() => setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Send Invitations ({selectedMembers.length})
                </button>
              </div>
            )}

            <div className="space-y-2">
              {group.members?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    {member._id === group.createdBy?._id && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        Creator
                      </span>
                    )}
                  </div>
                  {isCreator && member._id !== group.createdBy?._id && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${member.name} from the group?`)) {
                          onRemoveMember(member._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Invitations Tab (Creator Only) */}
        {activeTab === 'invitations' && isCreator && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h3>
            {sentInvitations && sentInvitations.length > 0 ? (
              <div className="space-y-2">
                {sentInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.userId?.name}</p>
                        <p className="text-sm text-gray-500">{invitation.userId?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Cancel invitation for ${invitation.userId?.name}?`)) {
                            onCancelInvitation(invitation._id);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No pending invitations</p>
                <p className="text-sm text-gray-500 mt-2">All invited members have responded</p>
              </div>
            )}
          </div>
        )}

        {!isCreator && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to leave this group?')) {
                  onLeaveGroup();
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Leave Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

//new code file:

const GroupChat = ({ groupId, messages, onSendMessage, members }) => {
  const [newMessage, setNewMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !fileToUpload) return;

    if (fileToUpload) {
      onSendMessage({ text: newMessage, file: fileToUpload });
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      onSendMessage({ text: newMessage });
    }
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getFileUrl(fileUrl), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId?._id === currentUser.id;
            const isImage = message.fileType?.startsWith('image/');
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg p-3 ${
                    isOwnMessage 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-900 shadow'
                  }`}>
                    {/* Sender name for other users' messages */}
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 text-blue-600">
                        {message.senderId?.name}
                      </p>
                    )}
                    
                    {/* Text message */}
                    {message.text && (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    )}
                    
                    {/* File attachment */}
                    {message.fileUrl && (
                      <div className="mt-2">
                        {isImage ? (
                          // Image preview
                          <div className="space-y-2">
                            <img 
                              src={getFileUrl(message.fileUrl)}
                              alt={message.fileName}
                              className="max-w-full rounded cursor-pointer hover:opacity-90"
                              onClick={() => window.open(getFileUrl(message.fileUrl), '_blank')}
                              style={{ maxHeight: '300px' }}
                            />
                            <p className="text-xs opacity-75">{message.fileName}</p>
                          </div>
                        ) : (
                          // File download button
                          <div className={`p-3 rounded ${
                            isOwnMessage ? 'bg-blue-500' : 'bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getFileIcon(message.fileName)}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isOwnMessage ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {message.fileName}
                                </p>
                                {message.fileSize && (
                                  <p className={`text-xs ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatFileSize(message.fileSize)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => downloadFile(message.fileUrl, message.fileName)}
                              className={`mt-2 w-full py-1 px-3 rounded text-xs font-medium ${
                                isOwnMessage 
                                  ? 'bg-white text-blue-600 hover:bg-blue-50' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {/* File preview */}
        {fileToUpload && (
          <div className="mb-2 flex items-center space-x-2 bg-blue-50 rounded p-3 border border-blue-200">
            <span className="text-2xl">{getFileIcon(fileToUpload.name)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-900 font-medium truncate">{fileToUpload.name}</p>
              <p className="text-xs text-blue-600">{formatFileSize(fileToUpload.size)}</p>
            </div>
            <button
              onClick={() => {
                setFileToUpload(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        
        {/* Input form */}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            id="file-upload-chat"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                // Check file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                  alert('File size must be less than 10MB');
                  e.target.value = '';
                  return;
                }
                setFileToUpload(file);
              }
            }}
          />
          
          {/* Attach file button */}
          <label
            htmlFor="file-upload-chat"
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors flex items-center justify-center"
            title="Attach file"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </label>
          
          {/* Message input */}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Type a message... (Shift+Enter for new line)"
            rows="1"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() && !fileToUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
        
        {/* Helper text */}
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line • Max file size: 10MB
        </p>
      </div>
    </div>
  );
};

// new file code.

// Main Project Groups Component
const ProjectGroups = () => {
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchGroups();
    fetchInvitations();
    
    // Poll for new invitations every 5 seconds
    const invitationInterval = setInterval(() => {
      fetchInvitations();
    }, 5000);
    
    return () => clearInterval(invitationInterval);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const checkIsCreator = selectedGroup.createdBy?._id === currentUser.id;
      
      fetchGroupMessages(selectedGroup._id);
      if (checkIsCreator) {
        fetchSentInvitations(selectedGroup._id);
      }
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchGroupMessages(selectedGroup._id);
        if (checkIsCreator) {
          fetchSentInvitations(selectedGroup._id);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await apiCall('/groups');
      setGroups(response);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setToast({ message: 'Failed to fetch groups', type: 'error' });
    }
    setLoading(false);
  };

  const fetchInvitations = async () => {
    try {
      const response = await apiCall('/groups/invitations');
      setInvitations(response);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchSentInvitations = async (groupId) => {
    try {
      const response = await apiCall(`/groups/${groupId}/sent-invitations`);
      setSentInvitations(prev => ({ ...prev, [groupId]: response }));
    } catch (error) {
      console.error('Error fetching sent invitations:', error);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await apiCall(`/groups/${groupId}/messages`);
      setGroupMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createGroup = async (groupData) => {
    try {
      await apiCall('/groups', {
        method: 'POST',
        body: groupData
      });
      setToast({ message: 'Group created! Invitations sent to members.', type: 'success' });
      setShowCreateModal(false);
      fetchGroups();
    } catch (error) {
      setToast({ message: error.message || 'Failed to create group', type: 'error' });
    }
  };

  const acceptInvitation = async (invitationId) => {
    try {
      await apiCall(`/groups/invitations/${invitationId}/accept`, {
        method: 'PATCH'
      });
      setToast({ message: 'Invitation accepted! You are now a member.', type: 'success' });
      fetchGroups();
      fetchInvitations();
    } catch (error) {
      setToast({ message: 'Failed to accept invitation', type: 'error' });
    }
  };

  const rejectInvitation = async (invitationId) => {
    try {
      await apiCall(`/groups/invitations/${invitationId}/reject`, {
        method: 'PATCH'
      });
      setToast({ message: 'Invitation rejected', type: 'success' });
      fetchInvitations();
    } catch (error) {
      setToast({ message: 'Failed to reject invitation', type: 'error' });
    }
  };

  const cancelInvitation = async (invitationId) => {
    try {
      await apiCall(`/groups/invitations/${invitationId}`, {
        method: 'DELETE'
      });
      setToast({ message: 'Invitation cancelled', type: 'success' });
      if (selectedGroup) {
        fetchSentInvitations(selectedGroup._id);
      }
    } catch (error) {
      setToast({ message: 'Failed to cancel invitation', type: 'error' });
    }
  };

  const sendMessage = async (messageData) => {
    if (!selectedGroup) return;

    try {
      const formData = new FormData();
      formData.append('text', messageData.text || '');
      if (messageData.file) {
        formData.append('file', messageData.file);
      }

      await apiCall(`/groups/${selectedGroup._id}/messages`, {
        method: 'POST',
        body: formData
      });

      fetchGroupMessages(selectedGroup._id);
    } catch (error) {
      setToast({ message: 'Failed to send message', type: 'error' });
    }
  };

  const addMembers = async (memberIds) => {
    if (!selectedGroup) return;

    try {
      await apiCall(`/groups/${selectedGroup._id}/members`, {
        method: 'POST',
        body: { memberIds }
      });
      setToast({ message: 'Invitations sent to new members!', type: 'success' });
      fetchGroups();
      const updatedGroup = await apiCall(`/groups/${selectedGroup._id}`);
      setSelectedGroup(updatedGroup);
      fetchSentInvitations(selectedGroup._id);
    } catch (error) {
      setToast({ message: 'Failed to add members', type: 'error' });
    }
  };

  const removeMember = async (memberId) => {
    if (!selectedGroup) return;

    try {
      await apiCall(`/groups/${selectedGroup._id}/members/${memberId}`, {
        method: 'DELETE'
      });
      setToast({ message: 'Member removed from group', type: 'success' });
      fetchGroups();
      const updatedGroup = await apiCall(`/groups/${selectedGroup._id}`);
      setSelectedGroup(updatedGroup);
    } catch (error) {
      setToast({ message: 'Failed to remove member', type: 'error' });
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;

    try {
      await apiCall(`/groups/${selectedGroup._id}/leave`, {
        method: 'POST'
      });
      setToast({ message: 'You left the group', type: 'success' });
      setShowDetailsModal(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      setToast({ message: 'Failed to leave group', type: 'error' });
    }
  };

  const selectGroup = async (group) => {
    try {
      const fullGroup = await apiCall(`/groups/${group._id}`);
      setSelectedGroup(fullGroup);
    } catch (error) {
      setToast({ message: 'Failed to load group', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  const isCreator = selectedGroup && selectedGroup.createdBy?._id === currentUser.id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with your team on projects</p>
        </div>
        <div className="flex items-center space-x-4">
          {invitations.length > 0 && (
            <button
              onClick={() => setShowInvitationsModal(true)}
              className="relative bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              View Invitations
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px]">
                {invitations.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Invitations Banner */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <div>
                <p className="text-yellow-800 font-medium">
                  You have {invitations.length} pending group invitation{invitations.length > 1 ? 's' : ''}
                </p>
                <p className="text-yellow-700 text-sm">Click to review and respond to invitations</p>
              </div>
            </div>
            <button
              onClick={() => setShowInvitationsModal(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createGroup}
        />
      )}

      {showInvitationsModal && (
        <InvitationsModal
          invitations={invitations}
          onClose={() => setShowInvitationsModal(false)}
          onAccept={acceptInvitation}
          onReject={rejectInvitation}
        />
      )}

      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setShowDetailsModal(false)}
          onAddMembers={addMembers}
          onRemoveMember={removeMember}
          onLeaveGroup={leaveGroup}
          onCancelInvitation={cancelInvitation}
          isCreator={isCreator}
          sentInvitations={sentInvitations[selectedGroup._id] || []}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              My Groups ({groups.length})
            </h2>
            
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No groups yet</p>
                <p className="text-gray-500 text-xs mt-2">Create a group to start collaborating</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => selectGroup(group)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedGroup?._id === group._id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{group.groupName}</h3>
                      {group.createdBy?._id === currentUser.id && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">{group.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{group.members?.length || 0} members</span>
                      <span>{group.messages?.length || 0} messages</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedGroup.groupName}</h2>
                  <p className="text-sm text-gray-600">{selectedGroup.members?.length || 0} members</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <GroupChat
                groupId={selectedGroup._id}
                messages={groupMessages}
                onSendMessage={sendMessage}
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center h-[600px] flex items-center justify-center">
              <div>
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a group to start chatting</h3>
                <p className="text-gray-600">Choose a group from the list or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectGroups;