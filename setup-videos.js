#!/usr/bin/env node

/**
 * SwipeSite Video Setup Script
 * 
 * This script automatically sets up video sources for the SwipeSite application.
 * It can:
 * 1. Generate and validate external video URLs
 * 2. Create video source configuration files
 * 3. Download sample videos (optional)
 * 4. Verify video source accessibility
 */

const fs = require('fs').promises;
const path = require('path');
const VideoGenerator = require('./scripts/video-generator');

class VideoSetup {
  constructor() {
    this.videoGenerator = new VideoGenerator();
    this.setupComplete = false;
  }

  /**
   * Display welcome message
   */
  displayWelcome() {
    console.log('\n🎬 SwipeSite Video Setup');
    console.log('========================');
    console.log('This script will set up video sources for your SwipeSite application.');
    console.log('');
  }

  /**
   * Check if video-sources.json exists
   */
  async checkExistingConfig() {
    try {
      const configPath = path.join(process.cwd(), 'video-sources.json');
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate video sources configuration
   */
  async generateVideoSources() {
    console.log('📡 Generating video sources configuration...');
    
    try {
      const result = await this.videoGenerator.generate();
      
      if (result.success) {
        console.log('✅ Video sources generated successfully!');
        console.log(`   📊 Total videos: ${result.stats.totalVideos}`);
        console.log(`   🌐 External videos: ${result.stats.externalVideos}`);
        console.log(`   💾 Local placeholders: ${result.stats.localVideos}`);
        return true;
      } else {
        console.error('❌ Failed to generate video sources:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during video source generation:', error.message);
      return false;
    }
  }

  /**
   * Create a basic video-sources.json if generation fails
   */
  async createFallbackConfig() {
    console.log('🔄 Creating fallback video configuration...');
    
    const fallbackConfig = {
      name: 'SwipeSite Video Sources',
      version: '1.0.0',
      description: 'Fallback video configuration for SwipeSite',
      lastUpdated: new Date().toISOString(),
      sources: [
        {
          id: 'fallback_1',
          type: 'external',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          title: 'Big Buck Bunny 🐰',
          description: 'Classic animated short film',
          author: 'Blender Foundation',
          likes: 15420,
          comments: 234,
          shares: 156,
          views: 45678,
          category: 'animation'
        },
        {
          id: 'fallback_2',
          type: 'external',
          url: 'https://vjs.zencdn.net/v/oceans.mp4',
          title: 'Ocean Views 🌊',
          description: 'Beautiful ocean footage',
          author: 'Video.js',
          likes: 12456,
          comments: 345,
          shares: 234,
          views: 67890,
          category: 'nature'
        },
        {
          id: 'fallback_3',
          type: 'external',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          title: 'Sintel ⚔️',
          description: 'Fantasy animated short film',
          author: 'Blender Foundation',
          likes: 18765,
          comments: 456,
          shares: 298,
          views: 78901,
          category: 'animation'
        }
      ],
      categories: {
        animation: 'Animated content and short films',
        nature: 'Natural landscapes and wildlife',
        general: 'General video content'
      }
    };

    try {
      const configPath = path.join(process.cwd(), 'video-sources.json');
      await fs.writeFile(configPath, JSON.stringify(fallbackConfig, null, 2));
      console.log('✅ Fallback configuration created successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to create fallback configuration:', error.message);
      return false;
    }
  }

  /**
   * Verify video source accessibility
   */
  async verifyVideoSources() {
    console.log('🔍 Verifying video source accessibility...');
    
    try {
      const configPath = path.join(process.cwd(), 'video-sources.json');
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (!config.sources || !Array.isArray(config.sources)) {
        console.log('⚠️  No video sources found in configuration');
        return false;
      }

      const externalSources = config.sources.filter(source => 
        source.type === 'external' && source.url && source.url.startsWith('http')
      );

      if (externalSources.length === 0) {
        console.log('⚠️  No external video sources found');
        return true;
      }

      console.log(`   Checking ${externalSources.length} external video sources...`);
      
      // Test a few random sources
      const samplesToTest = Math.min(5, externalSources.length);
      const testSources = externalSources
        .sort(() => Math.random() - 0.5)
        .slice(0, samplesToTest);

      let accessibleCount = 0;
      
      for (const source of testSources) {
        try {
          const https = require('https');
          const http = require('http');
          const client = source.url.startsWith('https:') ? https : http;
          
          const isAccessible = await new Promise((resolve) => {
            const request = client.request(source.url, { method: 'HEAD' }, (response) => {
              resolve(response.statusCode === 200);
            });
            
            request.on('error', () => resolve(false));
            request.setTimeout(5000, () => {
              request.destroy();
              resolve(false);
            });
            
            request.end();
          });

          if (isAccessible) {
            accessibleCount++;
            console.log(`   ✅ ${source.title} - Accessible`);
          } else {
            console.log(`   ⚠️  ${source.title} - Not accessible`);
          }
        } catch (error) {
          console.log(`   ❌ ${source.title} - Error checking`);
        }
      }

      const accessibilityRate = (accessibleCount / samplesToTest) * 100;
      console.log(`   📊 Accessibility rate: ${accessibilityRate.toFixed(1)}% (${accessibleCount}/${samplesToTest})`);
      
      if (accessibilityRate >= 60) {
        console.log('✅ Video sources verification completed successfully!');
        return true;
      } else {
        console.log('⚠️  Low accessibility rate - some videos may not work');
        return true; // Still continue, as some sources work
      }
      
    } catch (error) {
      console.error('❌ Error verifying video sources:', error.message);
      return false;
    }
  }

  /**
   * Display setup completion message
   */
  displayCompletion() {
    console.log('\n🎉 SwipeSite Video Setup Complete!');
    console.log('=====================================');
    console.log('');
    console.log('Your SwipeSite application is now ready with video sources.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Enjoy swiping through videos!');
    console.log('');
    console.log('📁 Configuration files created:');
    console.log('   - video-sources.json (video source configuration)');
    console.log('');
    console.log('🔧 To add your own videos:');
    console.log('   - Edit video-sources.json to add custom video URLs');
    console.log('   - Place local videos in the public/videos/ directory');
    console.log('   - Restart the server to load new videos');
    console.log('');
  }

  /**
   * Run the complete setup process
   */
  async run() {
    this.displayWelcome();

    try {
      // Check if configuration already exists
      const configExists = await this.checkExistingConfig();
      
      if (configExists) {
        console.log('⚠️  video-sources.json already exists. Skipping generation.');
        console.log('   Delete the file if you want to regenerate it.');
      } else {
        // Generate video sources
        const generationSuccess = await this.generateVideoSources();
        
        if (!generationSuccess) {
          console.log('⚠️  Video generation failed. Creating fallback configuration...');
          const fallbackSuccess = await this.createFallbackConfig();
          
          if (!fallbackSuccess) {
            console.error('❌ Setup failed: Could not create video configuration');
            return false;
          }
        }
      }

      // Verify video sources
      await this.verifyVideoSources();

      // Display completion
      this.displayCompletion();
      
      this.setupComplete = true;
      return true;

    } catch (error) {
      console.error('❌ Setup failed with error:', error.message);
      return false;
    }
  }
}

// CLI usage
if (require.main === module) {
  const setup = new VideoSetup();
  setup.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = VideoSetup;