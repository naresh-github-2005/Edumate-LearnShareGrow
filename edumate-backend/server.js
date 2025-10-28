// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edumate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  course: { type: String, default: '' },
  year: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  skills: [String],
  interests: [String],
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  dateOfBirth: { type: Date },
  profilePicture: { type: String, default: '' },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'students', 'private'], default: 'public' },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showStats: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    showActivity: { type: Boolean, default: true }
  },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    commentNotifications: { type: Boolean, default: true },
    likeNotifications: { type: Boolean, default: true },
    postApprovalNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false }
  }
});

// Timetable Schema
const timetableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  faculty: { type: String, required: true },
  time: { type: String, required: true },
  day: { type: String, required: true },
  room: { type: String, default: '' },
  notificationEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['group_invitation', 'message', 'member_joined', 'member_removed'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Group Invitation Schema
const groupInvitationSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Group Schema
const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});


// Update GroupMessage Schema to include file metadata
const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  fileUrl: { type: String }, // Relative path: uploads/group-files/filename
  fileName: { type: String }, // Original filename
  fileSize: { type: Number }, // File size in bytes
  fileType: { type: String }, // MIME type
  createdAt: { type: Date, default: Date.now }
});
//new code file.
const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);


// Update the Notes schema in your server.js to include more file info
const notesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  downloads: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectedAt: { type: Date }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  category: { type: String, default: 'personal' },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


//NEW VIDEOS FEATURE:
// Update Video Schema (modify your existing video schema)
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true }, // URL for YouTube, Drive, etc.
  customThumbnail: { type: String, default: '' },
  duration: { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectedAt: { type: Date }
});

//NEW VIDEOS FEATURE.

// Placement Post Schema
const placementPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  experience: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  rejectedAt: { type: Date }
});


//NEW COMPLAINT SCHEMA:
const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['content', 'user', 'technical', 'harassment', 'platform', 'privacy', 'other'], 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  contentId: { type: String },
  contentType: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'investigating', 'resolved', 'rejected', 'escalated'], 
    default: 'pending' 
  },
  adminResponse: { type: String, default: '' },
  evidence: [{
    filename: String,
    size: Number,
    type: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  ticketNumber: { type: String, unique: true },
  isAnonymous: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  expectedResponseTime: { type: String },
  createdAt: { type: Date, default: Date.now }
});
//NEW COMPLAINT SCHEMA.

// Models
const User = mongoose.model('User', userSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);
const Group = mongoose.model('Group', groupSchema);
const Notes = mongoose.model('Notes', notesSchema);
const Task = mongoose.model('Task', taskSchema);
const Video = mongoose.model('Video', videoSchema);
const PlacementPost = mongoose.model('PlacementPost', placementPostSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);

if (!fs.existsSync('uploads/group-files')) {
  fs.mkdirSync('uploads/group-files', { recursive: true });
}
// Multer configuration for group files
const groupFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/group-files');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const uploadGroupFile = multer({ 
  storage: groupFileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

//Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/files';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/files');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, and TXT files are allowed.'));
    }
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Email Validation
const validateVITEmail = (email) => {
  return email.endsWith('@vitstudent.ac.in');
};

// AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, course, year } = req.body;

    if (!validateVITEmail(email)) {
      return res.status(400).json({ message: 'Only @vitstudent.ac.in emails are allowed' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      course,
      year
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials or account deactivated' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TIMETABLE ROUTES

// Get user timetable
app.get('/api/timetable', authenticateToken, async (req, res) => {
  try {
    const timetable = await Timetable.find({ userId: req.user.userId });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add timetable entry
app.post('/api/timetable', authenticateToken, async (req, res) => {
  try {
    const { subject, faculty, time, day, room } = req.body;
    const timetable = new Timetable({
      userId: req.user.userId,
      subject,
      faculty,
      time,
      day,
      room
    });
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Additional Timetable routes
app.put('/api/timetable/:id', authenticateToken, async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!timetable) return res.status(404).json({ message: 'Class not found' });
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/timetable/:id', authenticateToken, async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!timetable) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notes download route
app.get('/api/notes/:id/download', authenticateToken, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Increment download count
    note.downloads += 1;
    await note.save();
    
    res.download(note.fileUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});






// NOTES ROUTES

// Get approved notes
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = { isApproved: true };
    if (subject) filter.subject = subject;
    
    const notes = await Notes.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BACKEND FIX - Add this to your server.js

// Update the Notes upload route in your server.js
app.post('/api/notes', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', req.body);
    console.log('File info:', req.file);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, subject, description, tags } = req.body;
    
    // Validate required fields
    if (!title || !subject) {
      return res.status(400).json({ message: 'Title and subject are required' });
    }

    const notes = new Notes({
      title,
      subject,
      description: description || '',
      fileUrl: req.file.path, // This will be the file path
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isApproved: false // Requires admin approval
    });

    await notes.save();
    console.log('Notes document saved:', notes);

    res.status(201).json({ 
      message: 'Notes uploaded successfully. Waiting for admin approval.',
      noteId: notes._id
    });
  } catch (error) {
    console.error('Error uploading notes:', error);
    res.status(500).json({ message: error.message || 'Failed to upload notes' });
  }
});


// Add a route to get user's uploaded notes (including pending ones)
app.get('/api/my-notes', authenticateToken, async (req, res) => {
  try {
    const notes = await Notes.find({ uploadedBy: req.user.userId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//**NEW CODE DELETE FEATURE */
// DELETE route for users to delete their own notes
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Notes.findOne({ 
      _id: req.params.id, 
      uploadedBy: req.user.userId 
    });
    
    if (!note) {
      return res.status(404).json({ 
        message: 'Note not found or you do not have permission to delete it' 
      });
    }
    
    // Delete the file from filesystem
    const fs = require('fs');
    if (fs.existsSync(note.fileUrl)) {
      fs.unlinkSync(note.fileUrl);
    }
    
    // Delete the note from database
    await Notes.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TASK ROUTES

// Get user tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId })
      .sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, deadline, priority, category } = req.body;
    const task = new Task({
      title,
      description,
      deadline,
      priority,
      category,
      userId: req.user.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// VIDEO ROUTES

// 1. Get approved videos (PUBLIC - for all users)
app.get('/api/videos', authenticateToken, async (req, res) => {
  try {
    const { subject, sort } = req.query;
    const filter = { isApproved: true };
    if (subject) filter.subject = subject;
    
    let sortOption = { createdAt: -1 };
    switch(sort) {
      case 'oldest': 
        sortOption = { createdAt: 1 }; 
        break;
      case 'title': 
        sortOption = { title: 1 }; 
        break;
      case 'views': 
        sortOption = { views: -1 }; 
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }
    
    const videos = await Video.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(sortOption);
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: error.message });
  }
});




// 3. Upload new video (URL-based) - FIXED VERSION
app.post('/api/videos', authenticateToken, async (req, res) => {
  try {
    const { title, subject, description, videoUrl, customThumbnail, duration, tags } = req.body;
    
    console.log('Received video upload request:', { title, subject, videoUrl, tags: typeof tags, tagsValue: tags });
    
    // Validate required fields
    if (!title || !subject || !videoUrl) {
      return res.status(400).json({ message: 'Title, subject, and video URL are required' });
    }
    
    // Validate video URL format
    const validUrlPatterns = [
      /^https:\/\/www\.youtube\.com\/watch\?v=.+/,
      /^https:\/\/youtu\.be\/.+/,
      /^https:\/\/drive\.google\.com\/file\/d\/.+/,
      /^https:\/\/vimeo\.com\/\d+/,
      /^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i
    ];
    
    const isValidUrl = validUrlPatterns.some(pattern => pattern.test(videoUrl));
    if (!isValidUrl) {
      return res.status(400).json({ message: 'Invalid video URL format' });
    }
    
    // Process tags safely
    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        // If tags is already an array
        processedTags = tags.filter(tag => tag && tag.trim()).map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        // If tags is a string, split by comma
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    
    console.log('Processed tags:', processedTags);
    
    const video = new Video({
      title: title.trim(),
      subject,
      description: description ? description.trim() : '',
      videoUrl: videoUrl.trim(),
      customThumbnail: customThumbnail ? customThumbnail.trim() : '',
      duration: duration ? duration.trim() : '',
      uploadedBy: req.user.userId,
      tags: processedTags,
      isApproved: false, // Requires admin approval
      views: 0,
      likes: []
    });
    
    await video.save();
    console.log('Video uploaded successfully:', video.title, 'by', req.user.email);
    
    res.status(201).json({ 
      message: 'Video uploaded successfully. Waiting for admin approval.',
      videoId: video._id 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: error.message });
  }
});


//NEW VIDEOS FEATURE:
// Video Routes

// 2. Get user's own videos (including pending approval)
app.get('/api/my-videos', authenticateToken, async (req, res) => {
  try {
    const { subject, sort } = req.query;
    
    let filter = { uploadedBy: req.user.userId };
    if (subject) filter.subject = subject;
    
    let sortOption = { createdAt: -1 };
    switch(sort) {
      case 'oldest': sortOption = { createdAt: 1 }; break;
      case 'title': sortOption = { title: 1 }; break;
      case 'views': sortOption = { views: -1 }; break;
    }
    
    const videos = await Video.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(sortOption);
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching my videos:', error);
    res.status(500).json({ message: error.message });
  }
});


// 4. Update video (only by owner) - FIXED VERSION
app.put('/api/videos/:id', authenticateToken, async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      uploadedBy: req.user.userId
    });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found or unauthorized' });
    }
    
    const { title, subject, description, videoUrl, customThumbnail, duration, tags } = req.body;
    
    // Process tags safely for updates
    let processedTags = video.tags; // Keep existing tags as default
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => tag && tag.trim()).map(tag => tag.trim());
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (tags === null || tags === '') {
        processedTags = [];
      }
    }
    
    // Update fields
    video.title = title ? title.trim() : video.title;
    video.subject = subject || video.subject;
    video.description = description !== undefined ? description.trim() : video.description;
    video.videoUrl = videoUrl ? videoUrl.trim() : video.videoUrl;
    video.customThumbnail = customThumbnail !== undefined ? customThumbnail.trim() : video.customThumbnail;
    video.duration = duration !== undefined ? duration.trim() : video.duration;
    video.tags = processedTags;
    video.isApproved = false; // Reset approval status when edited
    video.updatedAt = new Date();
    
    await video.save();
    
    const updatedVideo = await Video.findById(video._id).populate('uploadedBy', 'name email');
    res.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/videos/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is owner or admin
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const isOwner = video.uploadedBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to delete this video' });
    }
    
    await Video.findByIdAndDelete(req.params.id);
    console.log('Video deleted:', video.title, 'by', req.user.email);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: error.message });
  }
});

// 6. Increment view count (REQUIRED)
app.post('/api/videos/:id/view', authenticateToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || !video.isApproved) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Increment view count
    await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }
    );
    
    res.json({ message: 'View count updated', views: video.views + 1 });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({ message: error.message });
  }
});

// 9. Get video details by ID
app.get('/api/videos/:id', authenticateToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'name email');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user can view this video
    const isOwner = video.uploadedBy._id.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!video.isApproved && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Video not approved yet' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ message: error.message });
  }
});



//NEW PLACEMENTFORUM FEATURE:
// Get all approved placement posts
app.get('/api/placement-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await PlacementPost.find({ isApproved: true })
      .populate('userId', 'name email')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new placement post
app.post('/api/placement-posts', authenticateToken, async (req, res) => {
  try {
    const post = new PlacementPost({
      ...req.body,
      userId: req.user.userId,
      isApproved: false // Requires admin approval
    });
    await post.save();
    res.status(201).json({ message: 'Experience shared successfully! Waiting for admin approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update placement post (only owner can update)
app.put('/api/placement-posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await PlacementPost.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found or you are not authorized' });
    }

    const { title, company, description, experience, rating, difficulty, jobType, salary, tags, location, interviewDate } = req.body;
    
    post.title = title;
    post.company = company;
    post.description = description;
    post.experience = experience;
    post.rating = rating;
    post.difficulty = difficulty;
    post.jobType = jobType;
    post.salary = salary;
    post.tags = tags;
    post.location = location;
    post.interviewDate = interviewDate;
    
    // Reset approval status when edited
    post.isApproved = false;
    post.status = 'pending';
    
    await post.save();
    
    res.json({ message: 'Post updated successfully. Waiting for admin approval.', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete placement post (only owner can delete)
app.delete('/api/placement-posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await PlacementPost.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found or you are not authorized' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/Unlike placement post
app.post('/api/placement-posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await PlacementPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const userIndex = post.likes.indexOf(req.user.userId);
    
    if (userIndex === -1) {
      // User hasn't liked, so add like
      post.likes.push(req.user.userId);
    } else {
      // User has liked, so remove like
      post.likes.splice(userIndex, 1);
    }
    
    await post.save();
    res.json({ message: 'Like updated', likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment to placement post
app.post('/api/placement-posts/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
    
    const post = await PlacementPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    post.comments.push({
      userId: req.user.userId,
      comment: comment.trim(),
      createdAt: new Date()
    });
    
    await post.save();
    res.json({ message: 'Comment added successfully', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get user's own placement posts (including pending and rejected)
app.get('/api/my-placement-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await PlacementPost.find({ userId: req.user.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's complaints
app.get('/api/complaints', authenticateToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new complaint
app.post('/api/complaints', authenticateToken, async (req, res) => {
  try {
    const complaint = new Complaint({
      ...req.body,
      userId: req.user.userId,
      status: 'pending',
      ticketNumber: req.body.ticketNumber || generateTicketNumber()
    });
    await complaint.save();
    res.status(201).json({ 
      message: 'Complaint submitted successfully! You will receive updates via email.',
      ticketNumber: complaint.ticketNumber 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// NEW COMPLAINT CODE.

// NEW PROFILE MANAGEMENT CODE:
// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('privacySettings notificationSettings');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true, select: '-password' }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile picture
app.post('/api/profile/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { profilePicture: req.file.path },
      { new: true, select: '-password' }
    );
    res.json({ profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user statistics
app.get('/api/profile/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [totalNotes, totalVideos, totalPosts, noteLikes, postLikes] = await Promise.all([
      Notes.countDocuments({ uploadedBy: userId }),
      Video.countDocuments({ uploadedBy: userId }),
      PlacementPost.countDocuments({ userId: userId }),
      Notes.aggregate([{ $match: { uploadedBy: ObjectId(userId) } }, { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }]),
      PlacementPost.aggregate([{ $match: { userId: ObjectId(userId) } }, { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }])
    ]);

    const totalLikes = (noteLikes[0]?.totalLikes || 0) + (postLikes[0]?.totalLikes || 0);

    res.json({
      totalNotes,
      totalVideos,
      totalPosts,
      totalLikes,
      totalDownloads: 0, // Implement download tracking
      joinDate: req.user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user achievements
app.get('/api/profile/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const achievements = [];
    
    // Calculate achievements based on user activity
    const stats = await getUserStats(userId);
    
    if (stats.totalNotes >= 1) {
      achievements.push({
        name: 'First Contribution',
        description: 'Shared your first note',
        icon: '📝',
        color: 'bg-blue-100 text-blue-600',
        earnedAt: new Date()
      });
    }
    
    if (stats.totalNotes >= 10) {
      achievements.push({
        name: 'Knowledge Sharer',
        description: 'Shared 10+ notes',
        icon: '📚',
        color: 'bg-green-100 text-green-600',
        earnedAt: new Date()
      });
    }
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity
app.get('/api/profile/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const activities = [];
    
    // Get recent notes
    const recentNotes = await Notes.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentNotes.forEach(note => {
      activities.push({
        type: 'note_upload',
        title: `Uploaded note: ${note.title}`,
        description: `Shared notes for ${note.subject}`,
        createdAt: note.createdAt
      });
    });
    
    // Get recent posts
    const recentPosts = await PlacementPost.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentPosts.forEach(post => {
      activities.push({
        type: 'placement_post',
        title: `Shared placement experience: ${post.title}`,
        description: `Posted experience for ${post.company}`,
        createdAt: post.createdAt
      });
    });
    
    // Sort by date and return
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activities.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
app.post('/api/profile/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.userId, { password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update privacy settings
app.put('/api/profile/privacy', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true, select: '-password' }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update notification settings
app.put('/api/profile/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: req.body },
      { new: true, select: '-password' }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account
app.delete('/api/profile/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Delete user's content
    await Promise.all([
      Notes.deleteMany({ uploadedBy: userId }),
      Video.deleteMany({ uploadedBy: userId }),
      PlacementPost.deleteMany({ userId: userId }),
      Task.deleteMany({ userId: userId }),
      Complaint.deleteMany({ userId: userId }),
      User.findByIdAndDelete(userId)
    ]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// USER ROUTES
// ========================================

// Get current user
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search users (for adding members)
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.userId },
      isActive: true
    })
    .select('name email')
    .limit(10);

    console.log(`🔍 User search for "${query}": found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: error.message });
  }
});


// ========================================
// GROUP ROUTES
// ========================================

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Get user's pending invitations - MUST BE BEFORE /api/groups/:id
app.get('/api/groups/invitations', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching invitations for user: ${req.user.userId}`);
    
    const invitations = await GroupInvitation.find({
      userId: req.user.userId,
      status: 'pending'
    })
    .populate('groupId', 'groupName description')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    console.log(`📬 Found ${invitations.length} pending invitations`);
    res.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's groups (only groups where user is a member)
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.userId
    })
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    // Get message count for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const messageCount = await GroupMessage.countDocuments({ groupId: group._id });
        return {
          ...group.toObject(),
          messages: { length: messageCount }
        };
      })
    );

    console.log(`📊 User ${req.user.userId} has ${groupsWithCounts.length} groups`);
    res.json(groupsWithCounts);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sent invitations for a group (creator only) - MUST BE BEFORE /api/groups/:id
app.get('/api/groups/:id/sent-invitations', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator
    if (group.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only group creator can view sent invitations' });
    }

    const sentInvitations = await GroupInvitation.find({
      groupId: req.params.id,
      status: 'pending'
    })
    .populate('userId', 'name email')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    console.log(`📤 Group ${req.params.id} has ${sentInvitations.length} pending invitations`);
    res.json(sentInvitations);
  } catch (error) {
    console.error('Get sent invitations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// // Get group messages - MUST BE BEFORE /api/groups/:id
app.get('/api/groups/:id/messages', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId: req.params.id })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message });
  }
});



// Get specific group details - THIS COMES AFTER SPECIFIC ROUTES
app.get('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get message count
    const messageCount = await GroupMessage.countDocuments({ groupId: group._id });

    res.json({
      ...group.toObject(),
      messages: { length: messageCount }
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create group
app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { groupName, description, memberIds } = req.body;

    if (!groupName) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Create group with creator as first member
    const group = new Group({
      groupName,
      description,
      createdBy: req.user.userId,
      members: [req.user.userId]
    });

    await group.save();
    console.log(`✅ Group created: ${group.groupName} (ID: ${group._id})`);

    // Create invitations for other members
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        try {
          const invitation = new GroupInvitation({
            groupId: group._id,
            userId: memberId,
            invitedBy: req.user.userId,
            status: 'pending'
          });
          await invitation.save();
          console.log(`📧 Invitation created for user: ${memberId}`);

          // Create notification
          const notification = new Notification({
            userId: memberId,
            type: 'group_invitation',
            title: 'Group Invitation',
            message: `You've been invited to join "${groupName}"`,
            relatedId: group._id
          });
          await notification.save();
          console.log(`🔔 Notification created for user: ${memberId}`);
        } catch (error) {
          console.error(`❌ Error creating invitation for user ${memberId}:`, error);
        }
      }
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// INVITATION ROUTES
// ========================================

// Get user's pending invitations
app.get('/api/groups/invitations', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Fetching invitations for user: ${req.user.userId}`);
    
    const invitations = await GroupInvitation.find({
      userId: req.user.userId,
      status: 'pending'
    })
    .populate('groupId', 'groupName description')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    console.log(`📬 Found ${invitations.length} pending invitations`);
    res.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sent invitations for a group (creator only)
app.get('/api/groups/:id/sent-invitations', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator
    if (group.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only group creator can view sent invitations' });
    }

    const sentInvitations = await GroupInvitation.find({
      groupId: req.params.id,
      status: 'pending'
    })
    .populate('userId', 'name email')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    console.log(`📤 Group ${req.params.id} has ${sentInvitations.length} pending invitations`);
    res.json(sentInvitations);
  } catch (error) {
    console.error('Get sent invitations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Accept invitation
app.patch('/api/groups/invitations/:id/accept', authenticateToken, async (req, res) => {
  try {
    const invitation = await GroupInvitation.findById(req.params.id)
      .populate('groupId');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();
    console.log(`✅ Invitation ${invitation._id} accepted`);

    // Add user to group members
    const group = await Group.findById(invitation.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if already a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      group.members.push(req.user.userId);
      await group.save();
      console.log(`👥 User ${req.user.userId} added to group ${group._id}`);
    }

    // Send notification to group creator
    const notification = new Notification({
      userId: group.createdBy,
      type: 'member_joined',
      title: 'Member Joined',
      message: `A new member has joined "${group.groupName}"`,
      relatedId: group._id
    });
    await notification.save();

    res.json({ message: 'Invitation accepted successfully', group });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject invitation
app.patch('/api/groups/invitations/:id/reject', authenticateToken, async (req, res) => {
  try {
    const invitation = await GroupInvitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    invitation.status = 'rejected';
    await invitation.save();
    console.log(`❌ Invitation ${invitation._id} rejected`);

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cancel invitation (Creator only)
app.delete('/api/groups/invitations/:id', authenticateToken, async (req, res) => {
  try {
    const invitation = await GroupInvitation.findById(req.params.id).populate('groupId');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if user is the group creator
    if (invitation.groupId.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only group creator can cancel invitations' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending invitations' });
    }

    // Delete the invitation
    await GroupInvitation.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Invitation ${invitation._id} cancelled`);

    // Delete the notification
    await Notification.deleteMany({
      userId: invitation.userId,
      relatedId: invitation.groupId._id,
      type: 'group_invitation'
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// MEMBER MANAGEMENT ROUTES
// ========================================

// Add members to group (creator only)
app.post('/api/groups/:id/members', authenticateToken, async (req, res) => {
  try {
    const { memberIds } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator
    if (group.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only group creator can add members' });
    }

    let invitationsSent = 0;

    // Create invitations for each new member
    for (const memberId of memberIds) {
      try {
        // Check if already a member or has pending invitation
        const isMember = group.members.some(m => m._id.toString() === memberId);
        const hasPendingInvitation = await GroupInvitation.findOne({
          groupId: group._id,
          userId: memberId,
          status: 'pending'
        });

        if (!isMember && !hasPendingInvitation) {
          const invitation = new GroupInvitation({
            groupId: group._id,
            userId: memberId,
            invitedBy: req.user.userId,
            status: 'pending'
          });
          await invitation.save();
          invitationsSent++;
          console.log(`📧 Created invitation for: ${memberId}`);

          // Create notification
          const notification = new Notification({
            userId: memberId,
            type: 'group_invitation',
            title: 'Group Invitation',
            message: `You've been invited to join "${group.groupName}"`,
            relatedId: group._id
          });
          await notification.save();
          console.log(`🔔 Created notification for: ${memberId}`);
        }
      } catch (error) {
        console.error(`❌ Error inviting member ${memberId}:`, error);
      }
    }

    console.log(`✅ Sent ${invitationsSent} invitations`);
    res.json({ message: 'Invitations sent successfully', count: invitationsSent });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Remove member from group (creator only)
app.delete('/api/groups/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is creator
    if (group.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only group creator can remove members' });
    }

    // Cannot remove creator
    if (req.params.memberId === group.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove group creator' });
    }

    // Remove member
    group.members = group.members.filter(
      m => m._id.toString() !== req.params.memberId
    );
    await group.save();
    console.log(`👋 Removed member ${req.params.memberId} from group ${group._id}`);

    // Create notification
    const notification = new Notification({
      userId: req.params.memberId,
      type: 'member_removed',
      title: 'Removed from Group',
      message: `You have been removed from "${group.groupName}"`,
      relatedId: group._id
    });
    await notification.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Leave group
app.post('/api/groups/:id/leave', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Creator cannot leave their own group
    if (group.createdBy.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Group creator cannot leave. Delete the group instead.' });
    }

    // Remove user from members
    group.members = group.members.filter(
      m => m._id.toString() !== req.user.userId
    );
    await group.save();
    console.log(`👋 User ${req.user.userId} left group ${group._id}`);

    res.json({ message: 'You have left the group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// MESSAGE ROUTES
// ========================================

// Get group messages
app.get('/api/groups/:id/messages', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await GroupMessage.find({ groupId: req.params.id })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// CORRECTED ROUTES
// ========================================

// Send message with file
app.post('/api/groups/:id/messages', authenticateToken, uploadGroupFile.single('file'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messageData = {
      groupId: req.params.id,
      senderId: req.user.userId,
      text: req.body.text || ''
    };

    // If file is uploaded, save the relative path
    if (req.file) {
      messageData.fileUrl = `uploads/group-files/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.fileType = req.file.mimetype;
    }

    const message = new GroupMessage(messageData);
    await message.save();

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate('senderId', 'name email');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get group files (all files shared in messages)
app.get('/api/groups/:id/files', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(m => m._id.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all messages with files
    const messages = await GroupMessage.find({ 
      groupId: req.params.id,
      fileUrl: { $exists: true, $ne: null }
    })
    .populate('senderId', 'name email')
    .sort({ createdAt: -1 });

    // Transform to file format
    const files = messages.map(msg => ({
      _id: msg._id,
      fileName: msg.fileName,
      fileUrl: msg.fileUrl,
      fileSize: msg.fileSize,
      fileType: msg.fileType,
      uploadedBy: msg.senderId,
      createdAt: msg.createdAt
    }));

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/files/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'group-files', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Find message and check group membership
    const message = await GroupMessage.findOne({
      fileUrl: { $regex: req.params.filename }
    }).populate('groupId');
    
    if (message) {
      // Check if user is member of the group
      const group = await Group.findById(message.groupId);
      const isMember = group && group.members.some(m => m._id.toString() === req.user.userId);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const originalName = message ? message.fileName : req.params.filename;
    
    res.download(filePath, originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: error.message });
  }
});
//new file code.

// ========================================
// NOTIFICATION ROUTES
// ========================================

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: error.message });
  }
});

//NEW GROUP FEATURE CODE.



// ADMIN ROUTES

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user status (Admin only)
app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending content for approval
app.get('/api/admin/pending-content', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingNotes = await Notes.find({ isApproved: false })
      .populate('uploadedBy', 'name email');
    const pendingVideos = await Video.find({ isApproved: false })
      .populate('uploadedBy', 'name email');
    const pendingPosts = await PlacementPost.find({ isApproved: false })
      .populate('userId', 'name email');
    
    res.json({
      notes: pendingNotes,
      videos: pendingVideos,
      posts: pendingPosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve content
app.patch('/api/admin/approve/:type/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    let model;
    
    switch(type) {
      case 'notes':
        model = Notes;
        break;
      case 'videos':
        model = Video;
        break;
      case 'posts':
        model = PlacementPost;
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const content = await model.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all complaints (Admin only)
app.get('/api/admin/complaints', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status
app.patch('/api/admin/complaints/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update your reject route to include notification
app.patch('/api/admin/reject/:type/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    let model, populateField;
    
    switch(type) {
      case 'notes':
        model = Notes;
        populateField = 'uploadedBy';
        break;
      case 'videos':
        model = Video;
        populateField = 'uploadedBy';
        break;
      case 'posts':
        model = PlacementPost;
        populateField = 'userId';
        break;
      default:
        return res.status(400).json({ message: 'Invalid type' });
    }
    
    const content = await model.findByIdAndUpdate(id, { 
      isApproved: false,
      status: 'rejected',
      rejectionReason: rejectionReason.trim(),
      rejectedAt: new Date()
    }, { new: true }).populate(populateField, 'name email');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Log for notification (you can implement email here)
    const userEmail = content.uploadedBy?.email || content.userId?.email;
    const userName = content.uploadedBy?.name || content.userId?.name;
    console.log(`NOTIFICATION: User ${userName} (${userEmail}) - Content "${content.title}" was rejected. Reason: ${rejectionReason}`);
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Add route to get rejected content for users
app.get('/api/my-rejected-content', authenticateToken, async (req, res) => {
  try {
    const rejectedNotes = await Notes.find({ 
      uploadedBy: req.user.userId,
      status: 'rejected'
    });
    const rejectedVideos = await Video.find({ 
      uploadedBy: req.user.userId,
      status: 'rejected'
    });
    const rejectedPosts = await PlacementPost.find({ 
      userId: req.user.userId,
      status: 'rejected'
    });
    
    res.json({
      notes: rejectedNotes,
      videos: rejectedVideos,
      posts: rejectedPosts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add download route for admin review
app.get('/api/notes/:id/download', authenticateToken, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Only increment downloads if not admin
    if (req.user.role !== 'admin') {
      note.downloads += 1;
      await note.save();
    }
    
    res.download(note.fileUrl, note.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalNotes = await Notes.countDocuments();
    const pendingNotes = await Notes.countDocuments({ isApproved: false });
    const totalVideos = await Video.countDocuments();
    const pendingVideos = await Video.countDocuments({ isApproved: false });
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    res.json({
      totalUsers, activeUsers, totalNotes, pendingNotes,
      totalVideos, pendingVideos, totalComplaints, pendingComplaints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// CRON JOBS FOR NOTIFICATIONS

// Check for upcoming deadlines every hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingTasks = await Task.find({
      deadline: { $lte: twentyFourHoursFromNow, $gte: now },
      status: { $ne: 'completed' },
      reminderSent: false
    }).populate('userId', 'email name');
    
    // Here you would implement email/push notification logic
    console.log(`Found ${upcomingTasks.length} tasks with upcoming deadlines`);
    
    // Mark reminders as sent
    await Task.updateMany(
      { _id: { $in: upcomingTasks.map(task => task._id) } },
      { reminderSent: true }
    );
  } catch (error) {
    console.error('Error in reminder cron job:', error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing
module.exports = app;