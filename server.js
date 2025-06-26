const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const VideoManager = require('./modules/video-manager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize video manager
const videoManager = new VideoManager();

// In-memory stats tracking (in production, use a database)
const videoStats = new Map();
const viewedVideos = new Map(); // Track viewed videos per user
const adminStats = {
    totalViews: 0,
    uniqueViewers: new Set(),
    viewsHistory: [],
    lastHourViews: []
};

// Admin security token (in production, use proper authentication)
const ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex');
const adminTokens = new Set();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:", "https://commondatastorage.googleapis.com", "https://sample-videos.com", "https://vjs.zencdn.net", "https://media.w3.org", "https://archive.org"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Video data will be loaded from VideoManager

// Helper to get or create user ID from cookie
function getUserId(req, res) {
  let userId = req.cookies.userId;
  if (!userId) {
    userId = crypto.randomUUID();
    res.cookie('userId', userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
  return userId;
}

// API Routes
app.get('/api/videos', async (req, res) => {
  try {
    const userId = getUserId(req, res);
    const userViewed = viewedVideos.get(userId) || new Set();
    
    // Get all videos from video manager
    const allVideos = await videoManager.getAllVideos();
    
    // Filter out already viewed videos
    let unseenVideos = allVideos.filter(v => !userViewed.has(v.id));
    
    // If all videos have been viewed, reset and shuffle
    if (unseenVideos.length === 0) {
      viewedVideos.set(userId, new Set());
      unseenVideos = [...allVideos];
    }
    
    // Shuffle the unseen videos
    const shuffled = unseenVideos.sort(() => Math.random() - 0.5);
    
    // Return videos with stats
    const videosWithStats = shuffled.map(video => {
      const stats = videoStats.get(video.id) || { likes: video.likes, shares: video.shares, views: video.views };
      return { ...video, ...stats };
    });
    
    res.json(videosWithStats);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Track video view
app.post('/api/videos/:id/view', (req, res) => {
  const userId = getUserId(req, res);
  const videoId = req.params.id;
  
  // Track viewed video for user
  const userViewed = viewedVideos.get(userId) || new Set();
  userViewed.add(videoId);
  viewedVideos.set(userId, userViewed);
  
  // Increment view count
  const stats = videoStats.get(videoId) || {};
  stats.views = (stats.views || 0) + 1;
  videoStats.set(videoId, stats);
  
  // Update admin stats
  adminStats.totalViews++;
  adminStats.uniqueViewers.add(userId);
  
  // Add to views history (keep last 24 hours)
  const now = new Date();
  adminStats.viewsHistory.push({
    time: now.toISOString(),
    views: adminStats.totalViews,
    videoId: videoId
  });
  
  // Keep only last 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  adminStats.viewsHistory = adminStats.viewsHistory.filter(h => new Date(h.time) > oneDayAgo);
  
  res.json({ success: true, views: stats.views });
});

// Like/unlike video
app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { liked } = req.body;
    
    const stats = videoStats.get(videoId) || {};
    const video = await videoManager.getVideoById(videoId);
    const baseLikes = video ? video.likes : 0;
    
    if (!stats.likesDelta) stats.likesDelta = 0;
    stats.likesDelta += liked ? 1 : -1;
    stats.likes = baseLikes + stats.likesDelta;
    
    videoStats.set(videoId, stats);
    
    res.json({ success: true, likes: stats.likes });
  } catch (error) {
    console.error('Error liking video:', error);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

// Share video
app.post('/api/videos/:id/share', async (req, res) => {
  try {
    const videoId = req.params.id;
    
    const stats = videoStats.get(videoId) || {};
    const video = await videoManager.getVideoById(videoId);
    const baseShares = video ? video.shares : 0;
    
    if (!stats.sharesDelta) stats.sharesDelta = 0;
    stats.sharesDelta += 1;
    stats.shares = baseShares + stats.sharesDelta;
    
    videoStats.set(videoId, stats);
    
    const shareUrl = `${req.protocol}://${req.get('host')}/s/${videoId}`;
    
    res.json({ success: true, shares: stats.shares, shareUrl });
  } catch (error) {
    console.error('Error sharing video:', error);
    res.status(500).json({ error: 'Failed to share video' });
  }
});

// Shared video redirect
app.get('/s/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await videoManager.getVideoById(videoId);
    
    if (video) {
      // In a real app, you'd render a preview page with Open Graph tags
      res.redirect(`/?v=${videoId}`);
    } else {
      res.status(404).send('Video not found');
    }
  } catch (error) {
    console.error('Error finding video for sharing:', error);
    res.status(404).send('Video not found');
  }
});

// Get specific video by ID
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await videoManager.getVideoById(req.params.id);
    if (video) {
      const stats = videoStats.get(video.id) || { likes: video.likes, shares: video.shares, views: video.views };
      res.json({ ...video, ...stats });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// ADMIN SECURITY ROUTES

// Honeypot routes - trigger infinite loop for unauthorized access
const honeypotRoutes = [
  '/admin', '/admin/', '/admin-panel', '/admin-panel/', '/dashboard', '/dashboard/',
  '/control', '/control/', '/manage', '/manage/', '/backend', '/backend/',
  '/cp', '/cp/', '/wp-admin', '/wp-admin/', '/administrator', '/administrator/'
];

honeypotRoutes.forEach(route => {
  app.get(route, (req, res) => {
    // Infinite redirect loop for unauthorized access attempts
    res.redirect(route === '/admin-panel' ? '/admin' : '/admin-panel');
  });
});

// Admin middleware to check token
function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Generate admin token (secure endpoint)
app.post('/api/admin/auth', (req, res) => {
  const { secret } = req.body;
  
  if (secret !== ADMIN_SECRET) {
    // Trigger honeypot for wrong secret
    return res.redirect('/admin-panel');
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  adminTokens.add(token);
  
  // Token expires in 24 hours
  setTimeout(() => {
    adminTokens.delete(token);
  }, 24 * 60 * 60 * 1000);
  
  res.json({ token });
});

// Hidden admin route with security check
app.get('/admin-dashboard-secure', (req, res) => {
  const query = req.query.token;
  if (!query || query !== ADMIN_SECRET) {
    // Trigger honeypot
    return res.redirect('/admin-panel');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin API - Get stats
app.get('/api/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    const allVideos = await videoManager.getAllVideos();
    
    // Calculate trending video
    let trendingVideo = null;
    let maxViews = 0;
    
    allVideos.forEach(video => {
      const stats = videoStats.get(video.id) || {};
      const views = stats.views || video.views;
      if (views > maxViews) {
        maxViews = views;
        trendingVideo = { ...video, views };
      }
    });
    
    // Calculate engagement rate
    let totalEngagement = 0;
    let totalViews = 0;
    
    allVideos.forEach(video => {
      const stats = videoStats.get(video.id) || {};
      const views = stats.views || video.views;
      const likes = stats.likes || video.likes;
      const shares = stats.shares || video.shares;
      
      totalViews += views;
      totalEngagement += likes + shares;
    });
    
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    
    // Get videos with current stats
    const videosWithStats = allVideos.map(video => {
      const stats = videoStats.get(video.id) || {};
      return {
        ...video,
        views: stats.views || video.views,
        likes: stats.likes || video.likes,
        shares: stats.shares || video.shares
      };
    });
    
    // Sort by views descending
    videosWithStats.sort((a, b) => b.views - a.views);
    
    // Prepare views history for chart (last 24 hours, grouped by hour)
    const viewsHistory = [];
    const hoursMap = new Map();
    
    adminStats.viewsHistory.forEach(entry => {
      const hour = new Date(entry.time).toISOString().substring(0, 13) + ':00:00.000Z';
      hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
    });
    
    // Fill in missing hours with 0
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().substring(0, 13) + ':00:00.000Z';
      viewsHistory.push({
        time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        views: hoursMap.get(hourKey) || 0
      });
    }
    
    res.json({
      stats: {
        totalViews: adminStats.totalViews,
        uniqueViewers: adminStats.uniqueViewers.size,
        trendingVideo,
        engagementRate,
        viewsChange: Math.floor(Math.random() * 20) - 10, // Mock change
        viewersChange: Math.floor(Math.random() * 15) - 5, // Mock change
        engagementChange: Math.floor(Math.random() * 10) - 5, // Mock change
        viewsHistory
      },
      videos: videosWithStats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Admin API - Reset video stats
app.post('/api/admin/videos/:id/reset', requireAdminAuth, (req, res) => {
  const videoId = req.params.id;
  videoStats.delete(videoId);
  res.json({ success: true });
});

// Security route to detect unauthorized access attempts
app.use((req, res, next) => {
  const suspiciousPatterns = [
    /admin/i, /panel/i, /dashboard/i, /control/i, /manage/i, /backend/i,
    /wp-admin/i, /administrator/i, /phpmyadmin/i, /cpanel/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.path) || pattern.test(req.get('User-Agent') || '')
  );
  
  if (isSuspicious && !req.path.startsWith('/api/admin') && req.path !== '/admin-dashboard-secure') {
    // Trigger honeypot
    return res.redirect('/admin-panel');
  }
  
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});