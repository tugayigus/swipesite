/**
 * Video Manager Module
 * 
 * Handles video sources from multiple locations:
 * - External video URLs from free hosting services
 * - Local video files
 * - Placeholder/fallback videos
 */

const fs = require('fs').promises;
const path = require('path');

class VideoManager {
  constructor() {
    this.videoSources = [];
    this.fallbackVideos = [];
    this.initialized = false;
  }

  /**
   * Initialize video manager with sources
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load video sources from JSON file
      await this.loadVideoSources();
      
      // Generate fallback videos if no sources available
      if (this.videoSources.length === 0) {
        this.generateFallbackVideos();
      }

      this.initialized = true;
      console.log(`📹 Video Manager initialized with ${this.videoSources.length} videos`);
    } catch (error) {
      console.error('❌ Error initializing video manager:', error);
      this.generateFallbackVideos();
      this.initialized = true;
    }
  }

  /**
   * Load video sources from JSON configuration
   */
  async loadVideoSources() {
    const videoSourcesPath = path.join(process.cwd(), 'video-sources.json');
    
    try {
      const data = await fs.readFile(videoSourcesPath, 'utf8');
      const config = JSON.parse(data);
      
      if (config.sources && Array.isArray(config.sources)) {
        // Filter out placeholder videos that aren't real URLs
        this.videoSources = config.sources.filter(video => {
          return video.type === 'external' && 
                 video.url && 
                 video.url.startsWith('http') &&
                 !video.url.includes('PLACEHOLDER_DATA');
        });
        
        console.log(`✅ Loaded ${this.videoSources.length} external video sources`);
      }
    } catch (error) {
      console.log('⚠️  Could not load video-sources.json, using fallback videos');
      throw error;
    }
  }

  /**
   * Generate fallback videos for testing when no external sources available
   */
  generateFallbackVideos() {
    this.videoSources = [
      {
        id: 'fallback_1',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        title: 'Big Buck Bunny 🐰',
        description: 'Classic animated short film about a big bunny',
        author: 'Blender Foundation',
        likes: 15420,
        comments: 234,
        shares: 156,
        views: 45678,
        category: 'animation',
        type: 'external'
      },
      {
        id: 'fallback_2',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        title: 'Elephants Dream 🐘',
        description: 'Surreal 3D animated adventure',
        author: 'Blender Foundation',
        likes: 8932,
        comments: 156,
        shares: 89,
        views: 32145,
        category: 'animation',
        type: 'external'
      },
      {
        id: 'fallback_3',
        url: 'https://vjs.zencdn.net/v/oceans.mp4',
        title: 'Ocean Views 🌊',
        description: 'Beautiful ocean footage for relaxation',
        author: 'Video.js',
        likes: 12456,
        comments: 345,
        shares: 234,
        views: 67890,
        category: 'nature',
        type: 'external'
      },
      {
        id: 'fallback_4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'For Bigger Blazes 🔥',
        description: 'Spectacular fire and nature footage',
        author: 'Google',
        likes: 6543,
        comments: 98,
        shares: 67,
        views: 23456,
        category: 'nature',
        type: 'external'
      },
      {
        id: 'fallback_5',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        title: 'Sintel ⚔️',
        description: 'Fantasy animated short film with dragons',
        author: 'Blender Foundation',
        likes: 18765,
        comments: 456,
        shares: 298,
        views: 78901,
        category: 'animation',
        type: 'external'
      }
    ];

    console.log(`🔄 Generated ${this.videoSources.length} fallback videos`);
  }

  /**
   * Get all available videos
   */
  async getAllVideos() {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.videoSources];
  }

  /**
   * Get video by ID
   */
  async getVideoById(id) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.videoSources.find(video => video.id === id);
  }

  /**
   * Get videos by category
   */
  async getVideosByCategory(category) {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.videoSources.filter(video => video.category === category);
  }

  /**
   * Get random videos (excluding specified IDs)
   */
  async getRandomVideos(excludeIds = [], limit = 10) {
    if (!this.initialized) {
      await this.initialize();
    }

    const availableVideos = this.videoSources.filter(video => 
      !excludeIds.includes(video.id)
    );

    // Shuffle the array
    const shuffled = availableVideos.sort(() => Math.random() - 0.5);
    
    return shuffled.slice(0, limit);
  }

  /**
   * Add custom video source
   */
  async addVideoSource(videoData) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate required fields
    const required = ['id', 'url', 'title', 'description', 'author'];
    for (const field of required) {
      if (!videoData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check for duplicate ID
    if (this.videoSources.find(v => v.id === videoData.id)) {
      throw new Error(`Video with ID ${videoData.id} already exists`);
    }

    // Add default values
    const video = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      category: 'general',
      type: 'custom',
      ...videoData
    };

    this.videoSources.push(video);
    return video;
  }

  /**
   * Remove video source
   */
  async removeVideoSource(id) {
    if (!this.initialized) {
      await this.initialize();
    }

    const index = this.videoSources.findIndex(video => video.id === id);
    if (index === -1) {
      throw new Error(`Video with ID ${id} not found`);
    }

    return this.videoSources.splice(index, 1)[0];
  }

  /**
   * Get video statistics
   */
  async getStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = {
      totalVideos: this.videoSources.length,
      categories: {},
      types: {},
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0
    };

    this.videoSources.forEach(video => {
      // Count by category
      stats.categories[video.category] = (stats.categories[video.category] || 0) + 1;
      
      // Count by type
      stats.types[video.type] = (stats.types[video.type] || 0) + 1;
      
      // Sum totals
      stats.totalViews += video.views || 0;
      stats.totalLikes += video.likes || 0;
      stats.totalShares += video.shares || 0;
    });

    return stats;
  }

  /**
   * Refresh video sources from file
   */
  async refresh() {
    this.initialized = false;
    this.videoSources = [];
    await this.initialize();
  }

  /**
   * Check if video URL is accessible
   */
  async validateVideoUrl(url) {
    return new Promise((resolve) => {
      const https = require('https');
      const http = require('http');
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.request(url, { method: 'HEAD' }, (response) => {
        resolve({
          valid: response.statusCode === 200,
          statusCode: response.statusCode,
          contentType: response.headers['content-type']
        });
      });

      request.on('error', () => {
        resolve({ valid: false, error: 'Request failed' });
      });

      request.setTimeout(5000, () => {
        request.destroy();
        resolve({ valid: false, error: 'Timeout' });
      });

      request.end();
    });
  }
}

module.exports = VideoManager;