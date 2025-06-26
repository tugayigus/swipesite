// SwipeSite - Enhanced Video Player with All Features

class SwipeSite {
    constructor() {
        // Video state
        this.videos = [];
        this.currentVideoIndex = 0;
        this.videoElement = document.getElementById('current-video');
        this.videoContainer = document.getElementById('video-container');
        this.preloadVideos = [
            document.getElementById('preload-video-1'),
            document.getElementById('preload-video-2')
        ];
        
        // UI elements
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.playPauseIndicator = document.getElementById('play-pause-indicator');
        this.progressBar = document.getElementById('progress-bar');
        this.rewindIndicator = document.getElementById('rewind-indicator');
        this.forwardIndicator = document.getElementById('forward-indicator');
        this.speedIndicator = document.getElementById('speed-indicator');
        
        // Touch handling
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.touchEndY = 0;
        this.touchEndX = 0;
        this.touchStartTime = 0;
        this.minSwipeDistance = 50;
        this.isSwiping = false;
        this.swipeThreshold = 0.3; // 30% of screen height
        
        // Double tap handling
        this.lastTapTime = 0;
        this.tapTimeout = null;
        this.doubleTapDelay = 300;
        
        // Long press handling
        this.longPressTimer = null;
        this.longPressDelay = 500;
        this.isLongPressing = false;
        
        // Playback state
        this.isMuted = localStorage.getItem('isMuted') !== 'false'; // Load saved preference, default to muted
        this.normalSpeed = 1;
        this.fastSpeed = 2;
        
        // Liked videos tracking
        this.likedVideos = new Set(JSON.parse(localStorage.getItem('likedVideos') || '[]'));
        
        this.init();
    }
    
    async init() {
        // Register service worker
        this.registerServiceWorker();
        
        // Load videos
        await this.loadVideos();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for shared video in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedVideoId = urlParams.get('v');
        
        if (sharedVideoId && this.videos.length > 0) {
            const videoIndex = this.videos.findIndex(v => v.id === sharedVideoId);
            if (videoIndex !== -1) {
                this.currentVideoIndex = videoIndex;
            }
        }
        
        // Load first video
        if (this.videos.length > 0) {
            this.loadVideo(this.currentVideoIndex);
        }
        
        // Handle install prompt
        this.handleInstallPrompt();
        
        // Update progress bar
        this.startProgressUpdate();
        
        // Initialize mute button state
        this.updateMuteButton();
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    async loadVideos() {
        try {
            this.showLoading();
            const response = await fetch('/api/videos');
            this.videos = await response.json();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load videos:', error);
            this.hideLoading();
        }
    }
    
    setupEventListeners() {
        // Touch events for swiping
        this.videoContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.videoContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.videoContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events for desktop
        this.videoContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.videoContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Click for play/pause (will be overridden by touch handling on mobile)
        this.videoContainer.addEventListener('click', this.handleClick.bind(this));
        
        // Video events
        this.videoElement.addEventListener('loadedmetadata', () => {
            this.hideLoading();
            this.updateProgressBar();
        });
        this.videoElement.addEventListener('waiting', () => this.showLoading());
        this.videoElement.addEventListener('canplay', () => this.hideLoading());
        this.videoElement.addEventListener('ended', () => this.handleVideoEnded());
        
        // Progress bar click
        document.querySelector('.progress-bar-container').addEventListener('click', this.handleProgressClick.bind(this));
        
        // Action buttons
        document.getElementById('like-btn').addEventListener('click', this.handleLike.bind(this));
        document.getElementById('comment-btn').addEventListener('click', this.handleComment.bind(this));
        document.getElementById('share-btn').addEventListener('click', this.handleShare.bind(this));
        document.getElementById('mute-btn').addEventListener('click', this.handleMute.bind(this));
        
        // Navigation buttons
        document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
            btn.addEventListener('click', this.handleNavigation.bind(this));
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Prevent context menu on long press
        this.videoContainer.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isSwiping = false;
        
        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress();
        }, this.longPressDelay);
    }
    
    handleTouchMove(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaY = this.touchStartY - touch.clientY;
        const deltaX = this.touchStartX - touch.clientX;
        
        // Cancel long press if moving
        if (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10) {
            this.cancelLongPress();
            this.isSwiping = true;
        }
        
        // Handle vertical swipe preview
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
            e.preventDefault();
            const progress = deltaY / (window.innerHeight * this.swipeThreshold);
            const clampedProgress = Math.max(-1, Math.min(1, progress));
            
            this.videoContainer.classList.add('swiping');
            this.videoElement.style.transform = `translateY(${-clampedProgress * 20}%)`;
            this.videoElement.style.opacity = 1 - Math.abs(clampedProgress) * 0.3;
        }
    }
    
    handleTouchEnd(e) {
        this.cancelLongPress();
        
        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        const touchDuration = Date.now() - this.touchStartTime;
        
        // Reset transform
        this.videoContainer.classList.remove('swiping');
        this.videoElement.style.transform = '';
        this.videoElement.style.opacity = '';
        
        // Check for swipe
        if (this.isSwiping) {
            this.handleSwipe();
            return;
        }
        
        // Check for tap (not a swipe)
        if (touchDuration < 200 && !this.isSwiping) {
            const screenWidth = window.innerWidth;
            const tapX = this.touchEndX;
            
            // Detect double tap
            const currentTime = Date.now();
            if (currentTime - this.lastTapTime < this.doubleTapDelay) {
                // Double tap
                clearTimeout(this.tapTimeout);
                if (tapX < screenWidth / 3) {
                    this.handleRewind();
                } else if (tapX > (screenWidth * 2) / 3) {
                    this.handleFastForward();
                } else {
                    // Center double tap - toggle play/pause
                    this.togglePlayPause();
                }
            } else {
                // Single tap - wait to see if it's a double tap
                this.tapTimeout = setTimeout(() => {
                    this.togglePlayPause();
                }, this.doubleTapDelay);
            }
            this.lastTapTime = currentTime;
        }
    }
    
    handleSwipe() {
        const swipeDistanceY = this.touchStartY - this.touchEndY;
        const swipeDistanceX = this.touchStartX - this.touchEndX;
        
        if (Math.abs(swipeDistanceY) > Math.abs(swipeDistanceX)) {
            // Vertical swipe
            if (Math.abs(swipeDistanceY) > this.minSwipeDistance) {
                if (swipeDistanceY > 0) {
                    // Swiped up - next video
                    this.nextVideo();
                } else {
                    // Swiped down - previous video
                    this.previousVideo();
                }
            }
        }
    }
    
    handleMouseDown(e) {
        this.touchStartTime = Date.now();
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress();
        }, this.longPressDelay);
    }
    
    handleMouseUp(e) {
        this.cancelLongPress();
    }
    
    handleClick(e) {
        // Prevent click if it was a long press
        if (this.isLongPressing) {
            this.isLongPressing = false;
            return;
        }
        
        // Only handle click on desktop or if not handled by touch
        if (!('ontouchstart' in window)) {
            this.togglePlayPause();
        }
    }
    
    handleLongPress() {
        this.isLongPressing = true;
        this.videoElement.playbackRate = this.fastSpeed;
        this.showSpeedIndicator();
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.videoElement.playbackRate !== this.normalSpeed) {
            this.videoElement.playbackRate = this.normalSpeed;
            this.hideSpeedIndicator();
        }
    }
    
    handleRewind() {
        const newTime = Math.max(0, this.videoElement.currentTime - 10);
        this.videoElement.currentTime = newTime;
        this.showRewindIndicator();
    }
    
    handleFastForward() {
        const newTime = Math.min(this.videoElement.duration, this.videoElement.currentTime + 10);
        this.videoElement.currentTime = newTime;
        this.showForwardIndicator();
    }
    
    handleProgressClick(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * this.videoElement.duration;
        this.videoElement.currentTime = newTime;
    }
    
    handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.previousVideo();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.nextVideo();
                break;
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.handleRewind();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.handleFastForward();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                this.handleMute();
                break;
        }
    }
    
    async loadVideo(index, direction = 'none') {
        if (index < 0 || index >= this.videos.length) return;
        
        this.currentVideoIndex = index;
        const video = this.videos[index];
        
        // Show loading
        this.showLoading();
        
        // Apply swipe animation class
        if (direction !== 'none') {
            this.videoContainer.classList.add(`swipe-${direction}`);
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Update video source
        this.videoElement.src = video.url;
        this.videoElement.load();
        
        // Update video info
        this.updateVideoInfo(video);
        
        // Auto-play
        this.playVideo();
        
        // Preload next videos
        this.preloadNextVideos();
        
        // Track video view
        this.trackVideoView(video.id);
        
        // Remove swipe animation class
        setTimeout(() => {
            this.videoContainer.classList.remove('swipe-up', 'swipe-down');
        }, 50);
        
        // Update like button state
        this.updateLikeButton();
    }
    
    preloadNextVideos() {
        // Preload next 2 videos
        for (let i = 0; i < 2; i++) {
            const nextIndex = (this.currentVideoIndex + i + 1) % this.videos.length;
            const nextVideo = this.videos[nextIndex];
            if (nextVideo && this.preloadVideos[i]) {
                this.preloadVideos[i].src = nextVideo.url;
                this.preloadVideos[i].load();
            }
        }
    }
    
    async trackVideoView(videoId) {
        try {
            await fetch(`/api/videos/${videoId}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    }
    
    updateVideoInfo(video) {
        document.querySelector('.video-author').textContent = `@${video.author}`;
        document.querySelector('.video-title').textContent = video.title || '';
        document.querySelector('.video-description').textContent = video.description || '';
        document.querySelector('#like-btn .count').textContent = this.formatCount(video.likes);
        document.querySelector('#comment-btn .count').textContent = this.formatCount(video.comments);
        document.querySelector('#share-btn .count').textContent = this.formatCount(video.shares);
    }
    
    formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }
    
    nextVideo() {
        const nextIndex = (this.currentVideoIndex + 1) % this.videos.length;
        this.loadVideo(nextIndex, 'up');
    }
    
    previousVideo() {
        const prevIndex = this.currentVideoIndex === 0 ? this.videos.length - 1 : this.currentVideoIndex - 1;
        this.loadVideo(prevIndex, 'down');
    }
    
    handleVideoEnded() {
        // Auto-play next video when current one ends
        this.nextVideo();
    }
    
    async playVideo() {
        try {
            // Apply mute state
            this.videoElement.muted = this.isMuted;
            await this.videoElement.play();
            this.showPlayPauseIndicator(true);
        } catch (error) {
            console.error('Failed to play video:', error);
            // If autoplay fails, show play button
            this.showPlayPauseIndicator(false);
        }
    }
    
    togglePlayPause() {
        if (this.videoElement.paused) {
            this.playVideo();
        } else {
            this.videoElement.pause();
            this.showPlayPauseIndicator(false);
        }
    }
    
    showPlayPauseIndicator(isPlaying) {
        this.playPauseIndicator.classList.add('show');
        this.playPauseIndicator.classList.toggle('playing', !isPlaying);
        this.playPauseIndicator.classList.toggle('paused', isPlaying);
        
        setTimeout(() => {
            this.playPauseIndicator.classList.remove('show');
        }, 600);
    }
    
    showRewindIndicator() {
        this.rewindIndicator.classList.add('show');
        setTimeout(() => {
            this.rewindIndicator.classList.remove('show');
        }, 600);
    }
    
    showForwardIndicator() {
        this.forwardIndicator.classList.add('show');
        setTimeout(() => {
            this.forwardIndicator.classList.remove('show');
        }, 600);
    }
    
    showSpeedIndicator() {
        this.speedIndicator.classList.add('show');
    }
    
    hideSpeedIndicator() {
        this.speedIndicator.classList.remove('show');
    }
    
    showLoading() {
        this.loadingSpinner.classList.add('show');
    }
    
    hideLoading() {
        this.loadingSpinner.classList.remove('show');
    }
    
    startProgressUpdate() {
        setInterval(() => {
            if (!this.videoElement.paused && this.videoElement.duration) {
                this.updateProgressBar();
            }
        }, 100);
    }
    
    updateProgressBar() {
        if (this.videoElement.duration) {
            const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
            this.progressBar.style.width = `${progress}%`;
        }
    }
    
    updateLikeButton() {
        const video = this.videos[this.currentVideoIndex];
        const likeBtn = document.getElementById('like-btn');
        const isLiked = this.likedVideos.has(video.id);
        likeBtn.classList.toggle('liked', isLiked);
    }
    
    async handleLike(e) {
        e.stopPropagation();
        const video = this.videos[this.currentVideoIndex];
        const btn = e.currentTarget;
        const isLiked = this.likedVideos.has(video.id);
        
        // Toggle like state
        if (isLiked) {
            this.likedVideos.delete(video.id);
        } else {
            this.likedVideos.add(video.id);
        }
        
        // Save to localStorage
        localStorage.setItem('likedVideos', JSON.stringify([...this.likedVideos]));
        
        // Update UI
        btn.classList.toggle('liked', !isLiked);
        
        // Update count
        try {
            const response = await fetch(`/api/videos/${video.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ liked: !isLiked })
            });
            
            const data = await response.json();
            if (data.success) {
                btn.querySelector('.count').textContent = this.formatCount(data.likes);
                video.likes = data.likes; // Update local data
            }
        } catch (error) {
            console.error('Failed to update like:', error);
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    handleComment(e) {
        e.stopPropagation();
        console.log('Comments clicked');
        // TODO: Implement comments modal
    }
    
    async handleShare(e) {
        e.stopPropagation();
        const video = this.videos[this.currentVideoIndex];
        
        try {
            // Get share URL from server
            const response = await fetch(`/api/videos/${video.id}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update share count
                document.querySelector('#share-btn .count').textContent = this.formatCount(data.shares);
                video.shares = data.shares;
                
                // Try native share first
                if (navigator.share) {
                    await navigator.share({
                        title: video.title || 'Check out this video!',
                        text: video.description || '',
                        url: data.shareUrl
                    });
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.writeText(data.shareUrl);
                    this.showToast('Link copied to clipboard!');
                }
            }
        } catch (error) {
            console.error('Failed to share:', error);
            // Fallback: copy current URL
            await navigator.clipboard.writeText(window.location.href);
            this.showToast('Link copied to clipboard!');
        }
    }
    
    handleMute(e) {
        e.stopPropagation();
        this.isMuted = !this.isMuted;
        this.videoElement.muted = this.isMuted;
        
        // Update button
        this.updateMuteButton();
        
        // Save preference
        localStorage.setItem('isMuted', this.isMuted);
        
        // Apply to all videos
        this.preloadVideos.forEach(video => {
            video.muted = this.isMuted;
        });
    }
    
    updateMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.querySelector('.mute-on').style.display = this.isMuted ? 'block' : 'none';
        muteBtn.querySelector('.mute-off').style.display = this.isMuted ? 'none' : 'block';
    }
    
    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    handleNavigation(e) {
        const page = e.currentTarget.dataset.page;
        
        // Update active states
        document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        console.log('Navigate to:', page);
        // TODO: Implement page navigation
    }
    
    handleInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button/prompt
            console.log('App can be installed');
            
            // You can show a custom install prompt here
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('App was installed');
        });
    }
}

// Add toast animation to page
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SwipeSite();
});