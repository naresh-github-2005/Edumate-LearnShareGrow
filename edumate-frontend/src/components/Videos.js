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

// Video Player Component
const VideoPlayer = ({ video, onClose }) => {
  const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube URL conversion
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId;
      if (url.includes('youtube.com/watch')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Google Drive URL conversion
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    // Vimeo URL conversion
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    // For other URLs, try direct embedding
    return url;
  };

  const embedUrl = getEmbedUrl(video.videoUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{video.title}</h2>
            <p className="text-gray-600">{video.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {embedUrl ? (
            <div className="aspect-video mb-6">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              ></iframe>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-gray-600">Unable to embed this video</p>
                <a 
                  href={video.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 mb-6">{video.description}</p>

              {video.tags && video.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Uploaded by:</span> {video.uploadedBy?.name}</p>
                  <p><span className="font-medium">Subject:</span> {video.subject}</p>
                  <p><span className="font-medium">Duration:</span> {video.duration || 'N/A'}</p>
                  <p><span className="font-medium">Views:</span> {video.views}</p>
                  <p><span className="font-medium">Upload date:</span> {new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <a 
                  href={video.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center font-medium"
                >
                  Open Original Link
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Card Component
const VideoCard = ({ video, onPlay, onEdit, onDelete, isOwner, isAdmin }) => {
  const [imageError, setImageError] = useState(false);

  const getThumbnail = () => {
    if (video.customThumbnail && !imageError) {
      return video.customThumbnail;
    }

    // Generate YouTube thumbnail if it's a YouTube video
    if (video.videoUrl.includes('youtube.com/watch') || video.videoUrl.includes('youtu.be/')) {
      let videoId;
      if (video.videoUrl.includes('youtube.com/watch')) {
        videoId = video.videoUrl.split('v=')[1]?.split('&')[0];
      } else if (video.videoUrl.includes('youtu.be/')) {
        videoId = video.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    return null;
  };

  const thumbnail = getThumbnail();

  const handleViewIncrement = async () => {
    try {
      await apiCall(`/videos/${video._id}/view`, { method: 'POST' });
      onPlay(video);
    } catch (error) {
      console.error('Error incrementing view:', error);
      onPlay(video);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 cursor-pointer" onClick={handleViewIncrement}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all">
          <div className="bg-white bg-opacity-90 rounded-full p-4 transform scale-0 hover:scale-100 transition-transform">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 cursor-pointer hover:text-blue-600" 
              onClick={handleViewIncrement}>
            {video.title}
          </h3>
          
          {/* Action Menu */}
          {(isOwner || isAdmin) && (
            <div className="relative group">
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                </svg>
              </button>
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {isOwner && (
                  <button
                    onClick={() => onEdit(video)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Edit
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => onDelete(video._id)}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
            {video.subject}
          </span>
          {!video.isApproved && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              Pending Approval
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-gray-500 text-xs py-1">+{video.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Video Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              {video.views} views
            </span>
            <span>By {video.uploadedBy?.name}</span>
          </div>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Play Button */}
        <button
          onClick={handleViewIncrement}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>Play Video</span>
        </button>
      </div>
    </div>
  );
};

// Main Videos Component
const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    subject: '',
    description: '',
    videoUrl: '',
    customThumbnail: '',
    duration: '',
    tags: ''
  });
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('my-videos'); // 'all' or 'my-videos'
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Electronics',
    'Mechanical Engineering', 'Civil Engineering', 'Data Structures', 'Algorithms',
    'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering',
    'Digital Electronics', 'Signal Processing', 'Control Systems', 'Thermodynamics',
    'Fluid Mechanics', 'Materials Science', 'Engineering Drawing'
  ];

  useEffect(() => {
    fetchVideos();
    fetchCurrentUser();
  }, [filterSubject, sortBy, viewMode]);

  const fetchCurrentUser = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);
  };

  const fetchVideos = async () => {
    try {
      let endpoint = viewMode === 'all' ? '/videos' : '/my-videos';
      const params = new URLSearchParams();
      
      if (filterSubject) params.append('subject', filterSubject);
      if (sortBy) params.append('sort', sortBy);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await apiCall(endpoint);
      setVideos(response);
    } catch (error) {
      setToast({ message: 'Failed to fetch videos', type: 'error' });
    }
    setLoading(false);
  };

  const validateVideoUrl = (url) => {
    const validPatterns = [
      /^https:\/\/www\.youtube\.com\/watch\?v=.+/,
      /^https:\/\/youtu\.be\/.+/,
      /^https:\/\/drive\.google\.com\/file\/d\/.+/,
      /^https:\/\/vimeo\.com\/\d+/,
      /^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i
    ];

    return validPatterns.some(pattern => pattern.test(url));
  };

  const extractVideoInfo = (url) => {
    // Extract YouTube video ID and generate thumbnail
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      let videoId;
      if (url.includes('youtube.com/watch')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return {
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          platform: 'YouTube'
        };
      }
    }

    if (url.includes('drive.google.com')) {
      return { platform: 'Google Drive' };
    }

    if (url.includes('vimeo.com')) {
      return { platform: 'Vimeo' };
    }

    return { platform: 'Other' };
  };

  const handleUrlChange = (url) => {
    setUploadData({...uploadData, videoUrl: url});
    
    if (validateVideoUrl(url)) {
      const info = extractVideoInfo(url);
      if (info.thumbnail && !uploadData.customThumbnail) {
        setUploadData(prev => ({
          ...prev,
          videoUrl: url,
          customThumbnail: info.thumbnail
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateVideoUrl(uploadData.videoUrl)) {
      setToast({ message: 'Please enter a valid video URL', type: 'error' });
      return;
    }

    try {
      const videoData = {
        title: uploadData.title.trim(),
        subject: uploadData.subject,
        description: uploadData.description.trim(),
        videoUrl: uploadData.videoUrl.trim(),
        customThumbnail: uploadData.customThumbnail.trim(),
        duration: uploadData.duration.trim(),
        tags: uploadData.tags.trim() // Send as string, backend will process it
      };

      console.log('Sending video data:', videoData);

      if (editingVideo) {
        await apiCall(`/videos/${editingVideo._id}`, {
          method: 'PUT',
          body: videoData,
        });
        setToast({ message: 'Video updated successfully!', type: 'success' });
      } else {
        await apiCall('/videos', {
          method: 'POST',
          body: videoData,
        });
        setToast({ message: 'Video uploaded successfully! Waiting for admin approval.', type: 'success' });
      }
      
      setShowUpload(false);
      setEditingVideo(null);
      setUploadData({
        title: '',
        subject: '',
        description: '',
        videoUrl: '',
        customThumbnail: '',
        duration: '',
        tags: ''
      });
      fetchVideos();
    } catch (error) {
      console.error('Upload error:', error);
      setToast({ message: error.message || 'Failed to upload video', type: 'error' });
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setUploadData({
      title: video.title,
      subject: video.subject,
      description: video.description,
      videoUrl: video.videoUrl,
      customThumbnail: video.customThumbnail || '',
      duration: video.duration || '',
      tags: video.tags ? video.tags.join(', ') : ''
    });
    setShowUpload(true);
  };

  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await apiCall(`/videos/${videoId}`, { method: 'DELETE' });
        setToast({ message: 'Video deleted successfully!', type: 'success' });
        fetchVideos();
      } catch (error) {
        setToast({ message: 'Failed to delete video', type: 'error' });
      }
    }
  };

  const handlePlay = (video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
          <p className="text-gray-600 mt-1">Share and discover educational videos</p>
        </div>
        <button
          onClick={() => {
            setEditingVideo(null);
            setUploadData({
              title: '',
              subject: '',
              description: '',
              videoUrl: '',
              customThumbnail: '',
              duration: '',
              tags: ''
            });
            setShowUpload(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span>Upload Video</span>
        </button>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'all'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Videos ({videos.filter(v => viewMode === 'all').length})
          </button>
          <button
            onClick={() => setViewMode('my-videos')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'my-videos'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Videos ({videos.filter(v => v.uploadedBy?._id === currentUser.id || v.uploadedBy?.email === currentUser.email).length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">Search Videos</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Search by title, subject, or tags..."
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingVideo ? 'Edit Video' : 'Upload Video'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={uploadData.videoUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: YouTube, Google Drive, Vimeo, or direct video links
                </p>
                {uploadData.videoUrl && !validateVideoUrl(uploadData.videoUrl) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid video URL</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Introduction to Data Structures"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadData.subject}
                  onChange={(e) => setUploadData({...uploadData, subject: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  placeholder="Brief description of the video content..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Custom Thumbnail URL</label>
                  <input
                    type="url"
                    value={uploadData.customThumbnail}
                    onChange={(e) => setUploadData({...uploadData, customThumbnail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Custom thumbnail image URL</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Duration</label>
                  <input
                    type="text"
                    value={uploadData.duration}
                    onChange={(e) => setUploadData({...uploadData, duration: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 10:30 or 1h 25m"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Video duration</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., tutorial, beginner, programming (comma separated)"
                />
              </div>
              
              {/* Preview */}
              {uploadData.customThumbnail && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Thumbnail Preview</label>
                  <div className="aspect-video max-w-xs">
                    <img
                      src={uploadData.customThumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                      onError={() => setUploadData({...uploadData, customThumbnail: ''})}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpload(false);
                    setEditingVideo(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  {editingVideo ? 'Update Video' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => {
            setShowPlayer(false);
            setSelectedVideo(null);
          }}
        />
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard
            key={video._id}
            video={video}
            onPlay={handlePlay}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isOwner={video.uploadedBy?._id === currentUser.id || video.uploadedBy?.email === currentUser.email}
            isAdmin={currentUser.role === 'admin'}
          />
        ))}
      </div>
      
      {filteredVideos.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search terms or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterSubject('');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
      
      {videos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos available</h3>
          <p className="text-gray-600 mb-6">Be the first to share educational videos with the community!</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Upload First Video
          </button>
        </div>
      )}
    </div>
  );
};

export default Videos;