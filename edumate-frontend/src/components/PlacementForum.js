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

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readOnly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={index}
            type="button"
            className={`${sizeClasses[size]} ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            onClick={() => !readOnly && onRatingChange && onRatingChange(starValue)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
            disabled={readOnly}
          >
            <svg
              className={`${sizeClasses[size]} ${
                starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

// Company Logo Component
const CompanyLogo = ({ company, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const getCompanyColor = (company) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`${sizeClasses[size]} ${getCompanyColor(company)} rounded-full flex items-center justify-center text-white font-bold`}>
      {company.charAt(0).toUpperCase()}
    </div>
  );
};

// Experience Card Component with Edit/Delete
const ExperienceCard = ({ post, onLike, onViewDetails, onEdit, onDelete, currentUserId }) => {
  const isLiked = post.likes && post.likes.includes(currentUserId);
  const isOwner = post.userId?._id === currentUserId || post.userId?.id === currentUserId;
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <CompanyLogo company={post.company} size="lg" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h3>
              <div className="flex items-center space-x-3">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                  {post.company}
                </span>
                <StarRating rating={post.rating} readOnly size="sm" />
                <span className="text-sm text-gray-600">({post.rating}/5)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            {/* Status Badge */}
            {post.status && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                post.status === 'approved' ? 'bg-green-100 text-green-800' :
                post.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {post.status === 'approved' ? 'Published' : 
                 post.status === 'rejected' ? 'Rejected' : 'Pending Review'}
              </span>
            )}
            
            {/* Edit/Delete Menu for Owner */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        onEdit(post);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(post._id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      <span>Delete Post</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Rejection Reason */}
        {post.status === 'rejected' && post.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              <strong>Rejection Reason:</strong> {post.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        <p className="text-gray-700 mb-4 line-clamp-3">{post.description}</p>
        
        {/* Experience Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 text-sm mb-2">Interview Experience:</h4>
          <p className="text-gray-700 text-sm line-clamp-4">{post.experience}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>By {post.userId?.name}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          {post.salary && (
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium">
              ₹{post.salary} LPA
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(post._id)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <span>{post.likes?.length || 0}</span>
            </button>

            {/* Comments Button */}
            <button className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>

          <button
            onClick={() => onViewDetails(post)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            Read Full Experience
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Placement Forum Component
const PlacementForum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    experience: '',
    rating: 5,
    difficulty: 'Medium',
    jobType: 'Full-time',
    salary: '',
    tags: '',
    location: '',
    interviewDate: ''
  });

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
  }, []);

  const getCurrentUser = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);
  };

  const fetchPosts = async () => {
    try {
      const response = await apiCall('/placement-posts');
      setPosts(response);
    } catch (error) {
      setToast({ message: 'Failed to fetch placement experiences', type: 'error' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        salary: formData.salary ? parseFloat(formData.salary) : null
      };

      if (isEditing && editingPostId) {
        // Update existing post
        await apiCall(`/placement-posts/${editingPostId}`, {
          method: 'PUT',
          body: postData,
        });
        setToast({ message: 'Experience updated successfully!', type: 'success' });
      } else {
        // Create new post
        await apiCall('/placement-posts', {
          method: 'POST',
          body: postData,
        });
        setToast({ message: 'Experience shared successfully! Waiting for admin approval.', type: 'success' });
      }

      setShowForm(false);
      setIsEditing(false);
      setEditingPostId(null);
      resetForm();
      fetchPosts();
    } catch (error) {
      setToast({ message: `Failed to ${isEditing ? 'update' : 'share'} experience`, type: 'error' });
    }
  };

  const handleEdit = (post) => {
    setIsEditing(true);
    setEditingPostId(post._id);
    setFormData({
      title: post.title,
      company: post.company,
      description: post.description,
      experience: post.experience,
      rating: post.rating,
      difficulty: post.difficulty || 'Medium',
      jobType: post.jobType || 'Full-time',
      salary: post.salary || '',
      tags: post.tags ? post.tags.join(', ') : '',
      location: post.location || '',
      interviewDate: post.interviewDate ? post.interviewDate.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this placement experience? This action cannot be undone.')) {
      try {
        await apiCall(`/placement-posts/${postId}`, {
          method: 'DELETE',
        });
        setToast({ message: 'Experience deleted successfully!', type: 'success' });
        fetchPosts();
      } catch (error) {
        setToast({ message: 'Failed to delete experience', type: 'error' });
      }
    }
  };

  const handleLike = async (postId) => {
    try {
      await apiCall(`/placement-posts/${postId}/like`, { method: 'POST' });
      fetchPosts();
    } catch (error) {
      setToast({ message: 'Failed to update like', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      experience: '',
      rating: 5,
      difficulty: 'Medium',
      jobType: 'Full-time',
      salary: '',
      tags: '',
      location: '',
      interviewDate: ''
    });
    setIsEditing(false);
    setEditingPostId(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Placement Experiences</h1>
          <p className="text-gray-600 mt-2">Share your interview experiences and help your peers succeed</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span>Share Experience</span>
        </button>
      </div>

      {/* Experience Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {posts.map((post) => (
          <ExperienceCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onViewDetails={(post) => {
              setSelectedPost(post);
              setShowDetails(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUserId={currentUser?.id}
          />
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No experiences found</h3>
          <p className="text-gray-600 mb-6">Be the first to share your placement experience!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Share First Experience
          </button>
        </div>
      )}

      {/* Share/Edit Experience Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Your Placement Experience' : 'Share Your Placement Experience'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Experience Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., My Amazing Google Interview Experience"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Google, Microsoft, Amazon"
                    required
                  />
                </div>
              </div>

              {/* Rating and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <StarRating 
                      rating={formData.rating} 
                      onRatingChange={(rating) => setFormData({...formData, rating})}
                      size="lg"
                    />
                    <span className="text-lg font-medium text-gray-700">({formData.rating}/5)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Interview Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Job Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Salary Package (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 12.5"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Bangalore, Remote"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Interview Date</label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({...formData, interviewDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Brief Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Brief overview of your experience..."
                  required
                />
              </div>

              {/* Detailed Experience */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Detailed Interview Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="8"
                  placeholder="Share details about interview rounds, questions asked, preparation tips, etc..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include details about: interview rounds, types of questions, preparation strategies, tips for future candidates
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., technical-interview, coding-round, behavioral, system-design (comma separated)"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  {isEditing ? 'Update Experience' : 'Share Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Experience Details Modal (Read-Only View) */}
      {showDetails && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <CompanyLogo company={selectedPost.company} size="xl" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPost.title}</h2>
                    <div className="flex items-center space-x-4">
                      <span className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full">
                        {selectedPost.company}
                      </span>
                      <StarRating rating={selectedPost.rating} readOnly size="md" />
                      <span className="text-gray-600">({selectedPost.rating}/5)</span>
                      {selectedPost.salary && (
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          ₹{selectedPost.salary} LPA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Interview Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Difficulty</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPost.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      selectedPost.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPost.difficulty}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Job Type</p>
                    <p className="font-medium text-gray-900">{selectedPost.jobType}</p>
                  </div>
                  {selectedPost.location && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900">{selectedPost.location}</p>
                    </div>
                  )}
                  {selectedPost.interviewDate && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Interview Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedPost.interviewDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                <p className="text-gray-700 leading-relaxed">{selectedPost.description}</p>
              </div>

              {/* Detailed Experience */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Interview Experience</h3>
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedPost.experience}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author and Date */}
              <div className="pb-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {selectedPost.userId?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedPost.userId?.name}</p>
                      <p className="text-sm text-gray-500">
                        Posted on {new Date(selectedPost.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(selectedPost._id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors ${
                        selectedPost.likes?.includes(currentUser?.id)
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${selectedPost.likes?.includes(currentUser?.id) ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                      <span>{selectedPost.likes?.length || 0} Likes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PlacementForum;