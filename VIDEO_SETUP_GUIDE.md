# SwipeSite Video Setup Guide

Welcome to SwipeSite! This guide will help you set up and manage video sources for your application.

## Quick Start

### 1. Automatic Setup (Recommended)

Run the automatic setup script to get started immediately:

```bash
node setup-videos.js
```

This script will:
- Generate a `video-sources.json` file with 50+ test videos
- Validate video URLs from free hosting services
- Create fallback configuration if needed
- Verify video accessibility

### 2. Manual Setup

If you prefer manual setup, create a `video-sources.json` file in your project root:

```bash
cp video-sources.json.example video-sources.json
```

Then customize the configuration as needed.

## Video Source Configuration

### Configuration File Structure

The `video-sources.json` file contains all video source information:

```json
{
  "name": "SwipeSite Video Sources",
  "version": "1.0.0",
  "description": "Video source collection for SwipeSite",
  "lastUpdated": "2025-06-26",
  "sources": [
    {
      "id": "unique_video_id",
      "type": "external",
      "url": "https://example.com/video.mp4",
      "title": "Video Title",
      "description": "Video description",
      "author": "Creator Name",
      "likes": 1000,
      "comments": 50,
      "shares": 25,
      "views": 5000,
      "category": "entertainment",
      "thumbnail": "https://example.com/thumbnail.jpg"
    }
  ],
  "categories": {
    "entertainment": "Fun and engaging content",
    "education": "Educational videos",
    "nature": "Natural landscapes and wildlife"
  }
}
```

### Video Source Types

#### 1. External URLs (Recommended)
Best for immediate setup without file management:

```json
{
  "id": "external_1",
  "type": "external",
  "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "title": "Big Buck Bunny",
  "description": "Classic animated short film",
  "author": "Blender Foundation"
}
```

#### 2. Local Files
For videos you host yourself:

```json
{
  "id": "local_1",
  "type": "local",
  "url": "/videos/my-video.mp4",
  "title": "My Custom Video",
  "description": "A video I created"
}
```

**Note:** Place local video files in the `public/videos/` directory.

## Adding Your Own Videos

### Method 1: External Video URLs

1. **Find a public video URL** that ends with `.mp4`, `.webm`, or similar
2. **Test the URL** in your browser to ensure it's accessible
3. **Add to configuration**:

```json
{
  "id": "my_video_1",
  "type": "external",
  "url": "https://your-cdn.com/video.mp4",
  "title": "My Amazing Video",
  "description": "Description of your video",
  "author": "Your Name",
  "category": "custom"
}
```

4. **Restart the server** to load new videos

### Method 2: Local Video Files

1. **Place video files** in `public/videos/` directory:
   ```
   public/
   └── videos/
       ├── my-video-1.mp4
       ├── my-video-2.mp4
       └── README.md
   ```

2. **Add to configuration**:
   ```json
   {
     "id": "local_custom_1",
     "type": "local",
     "url": "/videos/my-video-1.mp4",
     "title": "My Local Video",
     "description": "A video stored locally"
   }
   ```

3. **Restart the server**

### Method 3: Using the Video Generator Script

Generate additional video sources programmatically:

```bash
node scripts/video-generator.js
```

This will create a `video-sources-generated.json` file that you can merge with your existing configuration.

## Free Video Sources

### Recommended Free Video Hosting Services

1. **Google Cloud Storage (GTv Sample Videos)**
   - Large collection of test videos
   - Reliable and fast
   - Example: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/`

2. **Archive.org**
   - Public domain videos
   - Historical and educational content
   - Example: `https://archive.org/download/`

3. **Sample Videos Services**
   - Test videos for developers
   - Various resolutions and formats
   - Example: `https://sample-videos.com/`

4. **Video.js Demo Videos**
   - High-quality test content
   - Optimized for web playback
   - Example: `https://vjs.zencdn.net/v/`

### Finding Video URLs

1. **Right-click on any web video** → "Copy video address"
2. **Check developer tools** Network tab while video loads
3. **Look for direct links** ending in `.mp4`, `.webm`, `.mov`
4. **Use video hosting APIs** (YouTube, Vimeo, etc. require API keys)

## Video Categories

Organize your videos using categories:

```json
"categories": {
  "animation": "Animated content and short films",
  "nature": "Natural landscapes and wildlife", 
  "travel": "Travel and adventure content",
  "entertainment": "Fun and entertaining videos",
  "education": "Educational and learning content",
  "technology": "Tech demos and tutorials",
  "music": "Music videos and audio content",
  "sports": "Sports and athletic content",
  "cooking": "Food and cooking content",
  "art": "Artistic and creative content"
}
```

## Video Metadata

### Required Fields
- `id`: Unique identifier for the video
- `url`: Direct link to video file
- `title`: Display title for the video
- `description`: Brief description
- `author`: Creator or source name

### Optional Fields
- `likes`: Number of likes (default: random)
- `comments`: Number of comments (default: random)
- `shares`: Number of shares (default: random)
- `views`: Number of views (default: random)
- `category`: Video category (default: "general")
- `thumbnail`: URL to thumbnail image
- `duration`: Video duration in seconds
- `type`: "external", "local", or "custom"

## Troubleshooting

### Videos Not Loading

1. **Check video URL accessibility**:
   ```bash
   curl -I "https://example.com/video.mp4"
   ```

2. **Verify CORS headers** - some servers block cross-origin requests

3. **Check browser console** for error messages

4. **Test with different video formats** (MP4 is most compatible)

### Configuration Errors

1. **Validate JSON syntax**:
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('video-sources.json', 'utf8')))"
   ```

2. **Check for duplicate IDs** in your video sources

3. **Ensure all required fields** are present

### Performance Issues

1. **Use videos under 50MB** for better loading times
2. **Optimize video encoding** (H.264 recommended)
3. **Use CDN links** when possible
4. **Limit total number of videos** to under 100 for best performance

## Advanced Configuration

### Custom Video Validation

Add custom validation logic in `modules/video-manager.js`:

```javascript
async validateCustomVideo(videoData) {
  // Add your validation logic here
  if (!videoData.url.includes('trusted-domain.com')) {
    throw new Error('Untrusted video source');
  }
  return true;
}
```

### Dynamic Video Loading

Load videos from external APIs:

```javascript
async loadDynamicVideos() {
  const response = await fetch('https://api.example.com/videos');
  const videos = await response.json();
  return videos.map(video => ({
    id: `api_${video.id}`,
    type: 'external',
    url: video.url,
    title: video.title,
    // ... other fields
  }));
}
```

### Video Analytics

Track video performance by modifying the server stats:

```javascript
// In server.js
app.post('/api/videos/:id/analytics', (req, res) => {
  const { event, data } = req.body;
  // Log analytics data
  console.log(`Video ${req.params.id}: ${event}`, data);
  res.json({ success: true });
});
```

## Security Considerations

1. **Validate video URLs** before adding to configuration
2. **Use HTTPS URLs** when possible
3. **Avoid user-generated content** without moderation
4. **Monitor bandwidth usage** with external video sources
5. **Respect copyright** - only use videos you have rights to

## Best Practices

1. **Start with free, reliable sources** like Google Cloud samples
2. **Test videos on different devices** and browsers
3. **Keep video files under 50MB** for good performance
4. **Use descriptive titles and descriptions**
5. **Organize videos with appropriate categories**
6. **Update video sources regularly** to remove broken links
7. **Monitor server logs** for video loading errors

## Support

If you encounter issues:

1. **Check the console logs** for error messages
2. **Verify video URLs** manually in a browser
3. **Run the setup script again**: `node setup-videos.js`
4. **Reset to defaults** by deleting `video-sources.json` and running setup

## Example Configurations

### Minimal Configuration
```json
{
  "sources": [
    {
      "id": "test_1",
      "type": "external",
      "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "title": "Test Video",
      "description": "A test video",
      "author": "Test"
    }
  ]
}
```

### Full Configuration
```json
{
  "name": "My SwipeSite Videos",
  "sources": [
    {
      "id": "featured_1",
      "type": "external", 
      "url": "https://example.com/featured.mp4",
      "title": "Featured Content",
      "description": "Amazing featured video content",
      "author": "Creator Name",
      "likes": 5000,
      "comments": 150,
      "shares": 75,
      "views": 25000,
      "category": "featured",
      "thumbnail": "https://example.com/thumb.jpg",
      "duration": 120
    }
  ],
  "categories": {
    "featured": "Featured video content",
    "entertainment": "Fun videos"
  }
}
```

Ready to start swiping! 🎬✨