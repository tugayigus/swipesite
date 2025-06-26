# SwipeSite

A TikTok-like progressive web application built with Express.js and vanilla JavaScript.

## Features

- Vertical video scrolling with swipe gestures
- Progressive Web App (PWA) support
- Offline functionality with service worker
- Responsive design for mobile and desktop
- Video playback controls
- Like, comment, and share actions
- Bottom navigation menu
- **🆕 External video URL support** - No manual video downloads required
- **🆕 Automatic video source setup** - 50+ test videos ready instantly
- **🆕 Multiple video source types** - External URLs, local files, and streaming
- **🆕 Video source management** - Easy configuration and customization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd swipesite
```

2. Install dependencies:
```bash
npm install
```

3. **🚀 Quick Setup - Automatic Video Configuration (Recommended)**:
```bash
npm run setup
```
This will automatically set up 50+ test videos from free hosting services. **No manual downloads required!**

4. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

### Alternative Setup Methods

#### Manual Video Setup
If you prefer to set up videos manually:

1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Add local videos to the `public/videos/` directory (name them `sample1.mp4`, `sample2.mp4`, etc.), OR

3. Edit `video-sources.json` to add your own video URLs (see [Video Setup Guide](VIDEO_SETUP_GUIDE.md))

#### Custom Video Configuration
```bash
# Generate video sources configuration
npm run generate-videos

# Set up videos with the configuration
npm run setup-videos
```

## Project Structure

```
swipesite/
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   ├── js/
│   │   ├── app.js
│   │   └── admin.js
│   ├── videos/
│   │   └── README.md
│   ├── index.html
│   ├── admin.html
│   ├── manifest.json
│   ├── sw.js
│   └── offline.html
├── modules/
│   └── video-manager.js      # 🆕 Video source management
├── scripts/
│   └── video-generator.js    # 🆕 Video URL generator
├── routes/
├── src/
├── views/
├── server.js
├── setup-videos.js           # 🆕 Automatic video setup
├── video-sources.json        # 🆕 Video configuration
├── VIDEO_SETUP_GUIDE.md      # 🆕 Video setup documentation
├── admin-access.js
├── ADMIN_SECURITY.md
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

## Technologies Used

- **Backend**: Express.js, Node.js
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **PWA**: Service Workers, Web App Manifest
- **Performance**: Compression middleware, Lazy loading
- **Security**: Helmet.js, CORS
- **🆕 Video Management**: Custom video source manager with external URL support
- **🆕 Content Delivery**: Support for multiple video hosting services

## Video Sources

SwipeSite now supports multiple video source types:

### 🌐 External Video URLs (No Downloads Required!)
- Google Cloud Storage (GTv Sample Videos)
- Archive.org public domain videos
- Sample video hosting services
- Video.js demo content
- Any direct video URL (.mp4, .webm, etc.)

### 📁 Local Video Files
- Upload videos to `public/videos/` directory
- Supports MP4, WebM, and other web-compatible formats

### 🔄 Automatic Setup
- Run `npm run setup` for instant video configuration
- 50+ test videos ready immediately
- No manual downloads or configuration required

## Quick Commands

```bash
# Start with automatic video setup
npm run setup && npm start

# Development with auto-reload
npm run dev

# Generate new video sources
npm run generate-videos

# Set up videos only
npm run setup-videos
```

For detailed video configuration, see the [Video Setup Guide](VIDEO_SETUP_GUIDE.md).

## Future Enhancements

- User authentication and profiles
- Video upload functionality
- Real-time comments
- Video recommendations algorithm
- Social features (follow, share)
- Video filters and effects
- Analytics dashboard

## License

ISC