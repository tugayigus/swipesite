#!/usr/bin/env node

/**
 * Video URL Generator and Validator
 * 
 * This script generates video URLs from various free hosting services,
 * validates their availability, and creates test video data for the SwipeSite app.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class VideoGenerator {
  constructor() {
    this.videoSources = [];
    this.validatedSources = [];
    this.categories = [
      'animation', 'nature', 'travel', 'entertainment', 'automotive',
      'sci-fi', 'test', 'education', 'urban', 'architecture', 'art',
      'adventure', 'cooking', 'science', 'documentary', 'wellness',
      'technology', 'music', 'fashion', 'sports', 'lifestyle',
      'photography', 'gaming', 'gardening', 'business', 'pets', 'fitness'
    ];
  }

  /**
   * Generate URLs from known free video hosting services
   */
  generateFreeVideoUrls() {
    const urls = [
      // Google Cloud Storage - GTv Sample Videos
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      
      // Sample Videos Service
      'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
      'https://sample-videos.com/zip/10/mp4/SampleVideo_480x360_1mb.mp4',
      
      // Learning Container
      'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      
      // File Examples
      'https://file-examples.com/storage/fe86c86b56d9ed1b4fa5b4a/2017/10/file_example_MP4_480_1_5MG.mp4',
      'https://file-examples.com/storage/fe86c86b56d9ed1b4fa5b4a/2017/10/file_example_MP4_640_3MG.mp4',
      'https://file-examples.com/storage/fe86c86b56d9ed1b4fa5b4a/2017/10/file_example_MP4_1280_10MG.mp4',
      
      // Archive.org
      'https://archive.org/download/SampleVideo1280x7205mb/SampleVideo_1280x720_5mb.mp4',
      
      // Video.js Demo
      'https://vjs.zencdn.net/v/oceans.mp4',
      
      // W3C Test Videos
      'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
      'https://media.w3.org/2010/05/bunny/trailer.mp4',
      'https://media.w3.org/2010/05/video/movie_300.mp4',
      
      // Mozilla Test Videos
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      
      // Wikimedia Commons
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm',
      
      // Test Video URLs (may need validation)
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
      'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4'
    ];

    return urls;
  }

  /**
   * Validate if a URL is accessible and returns video content
   */
  async validateVideoUrl(url) {
    return new Promise((resolve) => {
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.request(url, { method: 'HEAD' }, (response) => {
        const contentType = response.headers['content-type'] || '';
        const contentLength = response.headers['content-length'];
        
        const isValid = response.statusCode === 200 && 
                       (contentType.includes('video/') || contentType.includes('application/octet-stream'));
        
        resolve({
          url,
          valid: isValid,
          statusCode: response.statusCode,
          contentType,
          contentLength: contentLength ? parseInt(contentLength) : null
        });
      });

      request.on('error', () => {
        resolve({ url, valid: false, error: 'Request failed' });
      });

      request.setTimeout(10000, () => {
        request.destroy();
        resolve({ url, valid: false, error: 'Timeout' });
      });

      request.end();
    });
  }

  /**
   * Generate video metadata from URL
   */
  generateVideoMetadata(url, index) {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1].replace(/\.(mp4|webm|mov|avi)$/i, '');
    
    // Generate title from filename
    const title = filename.split(/[_-]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    // Random metadata generation
    const category = this.categories[Math.floor(Math.random() * this.categories.length)];
    const authors = ['VideoCreator', 'MediaStudio', 'ContentMaker', 'VisualArt', 'FilmMaker'];
    const author = authors[Math.floor(Math.random() * authors.length)];
    
    const baseViews = Math.floor(Math.random() * 50000) + 1000;
    const baseLikes = Math.floor(baseViews * (Math.random() * 0.1 + 0.02));
    const baseComments = Math.floor(baseLikes * (Math.random() * 0.3 + 0.1));
    const baseShares = Math.floor(baseLikes * (Math.random() * 0.2 + 0.05));

    return {
      id: `ext_${index + 1}`,
      url,
      title,
      description: this.generateDescription(category),
      author,
      likes: baseLikes,
      comments: baseComments,
      shares: baseShares,
      views: baseViews,
      category,
      type: 'external'
    };
  }

  /**
   * Generate description based on category
   */
  generateDescription(category) {
    const descriptions = {
      animation: ['Beautiful animated content', 'Stunning animation work', 'Creative animated story'],
      nature: ['Amazing nature footage', 'Beautiful natural scenery', 'Wildlife in their habitat'],
      travel: ['Explore amazing destinations', 'Travel adventure awaits', 'Discover new places'],
      entertainment: ['Fun and engaging content', 'Entertainment at its best', 'Enjoy this amazing video'],
      automotive: ['Car enthusiast content', 'Automotive excellence', 'Vehicle showcase'],
      technology: ['Latest tech innovations', 'Technology explained', 'Digital advancement'],
      education: ['Learn something new', 'Educational content', 'Knowledge sharing'],
      fitness: ['Workout and fitness tips', 'Health and wellness', 'Stay fit and healthy'],
      cooking: ['Delicious recipes', 'Cooking made easy', 'Culinary creativity'],
      music: ['Musical entertainment', 'Rhythm and melody', 'Sound of creativity']
    };

    const categoryDescriptions = descriptions[category] || ['Amazing video content', 'Great entertainment', 'Must-watch video'];
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
  }

  /**
   * Generate local placeholder videos for development
   */
  generatePlaceholderVideos() {
    const placeholders = [];
    for (let i = 1; i <= 20; i++) {
      placeholders.push({
        id: `local_${i}`,
        url: `/videos/sample${i}.mp4`,
        title: `Sample Video ${i}`,
        description: `Test video content ${i}`,
        author: 'LocalCreator',
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 20) + 5,
        views: Math.floor(Math.random() * 5000) + 500,
        category: this.categories[Math.floor(Math.random() * this.categories.length)],
        type: 'local'
      });
    }
    return placeholders;
  }

  /**
   * Create a comprehensive video sources file
   */
  async createVideoSourcesFile() {
    console.log('🎬 Generating video sources...');
    
    // Get free video URLs
    const freeUrls = this.generateFreeVideoUrls();
    console.log(`📡 Found ${freeUrls.length} potential video URLs`);

    // Validate URLs (in batches to avoid overwhelming servers)
    console.log('🔍 Validating video URLs...');
    const batchSize = 5;
    const validatedUrls = [];

    for (let i = 0; i < freeUrls.length; i += batchSize) {
      const batch = freeUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.validateVideoUrl(url))
      );
      
      validatedUrls.push(...batchResults);
      console.log(`   Validated ${Math.min(i + batchSize, freeUrls.length)}/${freeUrls.length} URLs`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Filter valid URLs and generate metadata
    const validUrls = validatedUrls.filter(result => result.valid);
    console.log(`✅ Found ${validUrls.length} valid video URLs`);

    const externalVideos = validUrls.map((result, index) => 
      this.generateVideoMetadata(result.url, index)
    );

    // Add local placeholder videos
    const localVideos = this.generatePlaceholderVideos();

    // Combine all videos
    const allVideos = [...externalVideos, ...localVideos];

    // Create the video sources configuration
    const videoSources = {
      name: 'SwipeSite Video Sources',
      version: '1.0.0',
      description: 'Comprehensive video source collection for SwipeSite',
      lastUpdated: new Date().toISOString(),
      stats: {
        totalVideos: allVideos.length,
        externalVideos: externalVideos.length,
        localVideos: localVideos.length,
        validatedUrls: validUrls.length,
        failedUrls: validatedUrls.length - validUrls.length
      },
      sources: allVideos,
      categories: Object.fromEntries(
        this.categories.map(cat => [cat, `${cat.charAt(0).toUpperCase() + cat.slice(1)} content`])
      ),
      validation: {
        lastCheck: new Date().toISOString(),
        validationResults: validatedUrls
      }
    };

    return videoSources;
  }

  /**
   * Save video sources to file
   */
  async saveVideoSources(videoSources, filename = 'video-sources-generated.json') {
    const filePath = path.join(process.cwd(), filename);
    await fs.writeFile(filePath, JSON.stringify(videoSources, null, 2));
    console.log(`💾 Video sources saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Generate and save video sources
   */
  async generate() {
    try {
      const videoSources = await this.createVideoSourcesFile();
      const filePath = await this.saveVideoSources(videoSources);
      
      console.log('🎉 Video source generation completed!');
      console.log(`📊 Statistics:`);
      console.log(`   Total videos: ${videoSources.stats.totalVideos}`);
      console.log(`   External videos: ${videoSources.stats.externalVideos}`);
      console.log(`   Local placeholders: ${videoSources.stats.localVideos}`);
      console.log(`   Categories: ${Object.keys(videoSources.categories).length}`);
      
      return { success: true, filePath, stats: videoSources.stats };
    } catch (error) {
      console.error('❌ Error generating video sources:', error);
      return { success: false, error: error.message };
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new VideoGenerator();
  generator.generate().then(result => {
    if (result.success) {
      console.log('✨ Video generation completed successfully!');
      process.exit(0);
    } else {
      console.error('💥 Video generation failed:', result.error);
      process.exit(1);
    }
  });
}

module.exports = VideoGenerator;