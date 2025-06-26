// Admin Panel JavaScript
(function() {
    'use strict';

    // Security check - verify admin token or get from URL
    let adminToken = sessionStorage.getItem('adminToken');
    
    // Check if accessing with URL token
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken && !adminToken) {
        // Authenticate with URL token
        authenticateWithSecret(urlToken);
        return;
    }
    
    if (!adminToken) {
        // Redirect to honeypot route for unauthorized access
        window.location.href = '/admin-panel';
        return;
    }
    
    // Function to authenticate with secret
    async function authenticateWithSecret(secret) {
        try {
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ secret })
            });
            
            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('adminToken', data.token);
                // Remove token from URL for security
                window.history.replaceState({}, document.title, '/admin-dashboard-secure');
                // Reload to initialize with token
                window.location.reload();
            } else {
                // Invalid secret, redirect to honeypot
                window.location.href = '/admin-panel';
            }
        } catch (error) {
            console.error('Authentication error:', error);
            window.location.href = '/admin-panel';
        }
    }

    // Global variables
    let statsData = {};
    let videosData = [];
    let viewsChart = null;
    let performanceChart = null;
    let updateInterval = null;

    // DOM elements
    const elements = {
        totalViews: document.getElementById('totalViews'),
        uniqueViewers: document.getElementById('uniqueViewers'),
        trendingVideo: document.getElementById('trendingVideo'),
        trendingViews: document.getElementById('trendingViews'),
        engagementRate: document.getElementById('engagementRate'),
        viewsChange: document.getElementById('viewsChange'),
        viewersChange: document.getElementById('viewersChange'),
        engagementChange: document.getElementById('engagementChange'),
        lastUpdated: document.getElementById('lastUpdated'),
        videosTableBody: document.getElementById('videosTableBody'),
        activityLog: document.getElementById('activityLog'),
        searchInput: document.getElementById('searchInput'),
        sortSelect: document.getElementById('sortSelect'),
        refreshBtn: document.getElementById('refreshBtn'),
        loadingOverlay: document.getElementById('loadingOverlay')
    };

    // Initialize
    async function init() {
        setupEventListeners();
        await fetchStats();
        initCharts();
        startRealTimeUpdates();
    }

    // Setup event listeners
    function setupEventListeners() {
        elements.refreshBtn.addEventListener('click', () => {
            fetchStats();
        });

        elements.searchInput.addEventListener('input', (e) => {
            filterVideos(e.target.value);
        });

        elements.sortSelect.addEventListener('change', (e) => {
            sortVideos(e.target.value);
        });
    }

    // Fetch admin stats from server
    async function fetchStats() {
        showLoading(true);
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'X-Admin-Token': adminToken
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Unauthorized - trigger honeypot
                    window.location.href = '/admin-panel';
                    return;
                }
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            statsData = data.stats;
            videosData = data.videos;

            updateDashboard();
            updateCharts();
            updateVideosTable();
            addActivityLog('Stats refreshed successfully');
        } catch (error) {
            console.error('Error fetching stats:', error);
            addActivityLog('Error fetching stats: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // Update dashboard stats
    function updateDashboard() {
        // Total views
        elements.totalViews.textContent = formatNumber(statsData.totalViews);
        updateChange(elements.viewsChange, statsData.viewsChange);

        // Unique viewers
        elements.uniqueViewers.textContent = formatNumber(statsData.uniqueViewers);
        updateChange(elements.viewersChange, statsData.viewersChange);

        // Trending video
        if (statsData.trendingVideo) {
            elements.trendingVideo.textContent = statsData.trendingVideo.title;
            elements.trendingViews.textContent = `${formatNumber(statsData.trendingVideo.views)} views`;
        }

        // Engagement rate
        elements.engagementRate.textContent = `${statsData.engagementRate.toFixed(1)}%`;
        updateChange(elements.engagementChange, statsData.engagementChange);

        // Last updated
        elements.lastUpdated.textContent = new Date().toLocaleTimeString();
    }

    // Update change indicators
    function updateChange(element, change) {
        if (change > 0) {
            element.textContent = `+${change}%`;
            element.className = 'stat-change positive';
        } else if (change < 0) {
            element.textContent = `${change}%`;
            element.className = 'stat-change negative';
        } else {
            element.textContent = '0%';
            element.className = 'stat-change';
        }
    }

    // Initialize charts
    function initCharts() {
        // Views over time chart
        const viewsCtx = document.getElementById('viewsChart').getContext('2d');
        viewsChart = new Chart(viewsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Views',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });

        // Performance chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        performanceChart = new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Views',
                    data: [],
                    backgroundColor: '#3b82f6'
                }, {
                    label: 'Likes',
                    data: [],
                    backgroundColor: '#10b981'
                }, {
                    label: 'Shares',
                    data: [],
                    backgroundColor: '#f59e0b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    // Update charts with new data
    function updateCharts() {
        if (statsData.viewsHistory && viewsChart) {
            viewsChart.data.labels = statsData.viewsHistory.map(h => h.time);
            viewsChart.data.datasets[0].data = statsData.viewsHistory.map(h => h.views);
            viewsChart.update();
        }

        if (videosData.length > 0 && performanceChart) {
            const topVideos = videosData.slice(0, 5);
            performanceChart.data.labels = topVideos.map(v => v.title.substring(0, 20) + '...');
            performanceChart.data.datasets[0].data = topVideos.map(v => v.views);
            performanceChart.data.datasets[1].data = topVideos.map(v => v.likes);
            performanceChart.data.datasets[2].data = topVideos.map(v => v.shares);
            performanceChart.update();
        }
    }

    // Update videos table
    function updateVideosTable() {
        const tbody = elements.videosTableBody;
        tbody.innerHTML = '';

        videosData.forEach(video => {
            const engagement = calculateEngagement(video);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${video.id}</td>
                <td>${video.title}</td>
                <td>${video.author}</td>
                <td>${formatNumber(video.views)}</td>
                <td>${formatNumber(video.likes)}</td>
                <td>${formatNumber(video.shares)}</td>
                <td>${engagement.toFixed(1)}%</td>
                <td>
                    <button class="action-btn" onclick="viewVideo('${video.id}')">View</button>
                    <button class="action-btn" onclick="resetStats('${video.id}')">Reset</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Calculate engagement rate
    function calculateEngagement(video) {
        if (video.views === 0) return 0;
        return ((video.likes + video.shares) / video.views) * 100;
    }

    // Filter videos
    function filterVideos(searchTerm) {
        const filtered = videosData.filter(video => 
            video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            video.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tbody = elements.videosTableBody;
        tbody.innerHTML = '';
        
        filtered.forEach(video => {
            const engagement = calculateEngagement(video);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${video.id}</td>
                <td>${video.title}</td>
                <td>${video.author}</td>
                <td>${formatNumber(video.views)}</td>
                <td>${formatNumber(video.likes)}</td>
                <td>${formatNumber(video.shares)}</td>
                <td>${engagement.toFixed(1)}%</td>
                <td>
                    <button class="action-btn" onclick="viewVideo('${video.id}')">View</button>
                    <button class="action-btn" onclick="resetStats('${video.id}')">Reset</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Sort videos
    function sortVideos(sortBy) {
        const sorted = [...videosData].sort((a, b) => {
            switch(sortBy) {
                case 'views':
                    return b.views - a.views;
                case 'likes':
                    return b.likes - a.likes;
                case 'shares':
                    return b.shares - a.shares;
                case 'engagement':
                    return calculateEngagement(b) - calculateEngagement(a);
                default:
                    return 0;
            }
        });
        
        videosData = sorted;
        updateVideosTable();
    }

    // Add activity log entry
    function addActivityLog(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <div class="log-time">${new Date().toLocaleTimeString()}</div>
            <div class="log-message">${message}</div>
        `;
        
        elements.activityLog.insertBefore(entry, elements.activityLog.firstChild);
        
        // Keep only last 50 entries
        while (elements.activityLog.children.length > 50) {
            elements.activityLog.removeChild(elements.activityLog.lastChild);
        }
    }

    // Start real-time updates
    function startRealTimeUpdates() {
        updateInterval = setInterval(() => {
            fetchStats();
        }, 30000); // Update every 30 seconds
    }

    // Stop real-time updates
    function stopRealTimeUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    }

    // Format large numbers
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Show/hide loading overlay
    function showLoading(show) {
        elements.loadingOverlay.classList.toggle('active', show);
    }

    // Global functions for action buttons
    window.viewVideo = function(videoId) {
        window.open(`/?v=${videoId}`, '_blank');
        addActivityLog(`Viewed video: ${videoId}`);
    };

    window.resetStats = async function(videoId) {
        if (!confirm('Are you sure you want to reset stats for this video?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/videos/${videoId}/reset`, {
                method: 'POST',
                headers: {
                    'X-Admin-Token': adminToken
                }
            });

            if (response.ok) {
                addActivityLog(`Reset stats for video: ${videoId}`);
                fetchStats();
            } else {
                throw new Error('Failed to reset stats');
            }
        } catch (error) {
            console.error('Error resetting stats:', error);
            addActivityLog(`Error resetting stats: ${error.message}`, 'error');
        }
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopRealTimeUpdates();
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();