import { makeDraggableResizable } from '../utils/draggable-resizable.js';

/**
 * Manages screen sharing capture and image processing
 */
export class ScreenManager {
    /**
     * @param {Object} config
     * @param {number} config.width - Target width for resizing captured images
     * @param {number} config.quality - JPEG quality (0-1)
     * @param {Function} [config.onStop] - Callback when screen sharing stops
     */
    constructor(config) {
        this.config = {
            width: config.width || 1280,
            quality: config.quality || 0.8,
            onStop: config.onStop
        };
        
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
        this.previewContainer = null;
    }

    /**
     * Show the screen preview
     */
    showPreview() {
        if (this.previewContainer) {
            this.previewContainer.classList.remove('preview-disappear');
            this.previewContainer.classList.add('active', 'preview-appear');
            this.previewContainer.style.visibility = 'visible'; // Ensure visibility in Safari
            this.previewContainer.style.opacity = '1'; // Ensure opacity in Safari
        }
    }

    /**
     * Hide the screen preview
     */
    hidePreview() {
        if (this.previewContainer) {
            this.previewContainer.classList.remove('preview-appear', 'active');
            this.previewContainer.classList.add('preview-disappear');
            // Remove element after animation completes
            setTimeout(() => {
                if (this.previewContainer) {
                    this.previewContainer.classList.remove('preview-disappear');
                    // Explicit Safari visibility handling
                    this.previewContainer.style.visibility = 'hidden';
                    this.previewContainer.style.opacity = '0';
                }
            }, 300); // Match animation duration
        }
    }

    /**
     * Check if the browser supports screen capture
     * @private
     * @returns {boolean}
     */
    _isScreenCaptureSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    }

    /**
     * Initialize screen capture stream and canvas
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;

        // Check if screen capture is supported
        if (!this._isScreenCaptureSupported()) {
            throw new Error('Screen capture is not supported in your browser.');
        }

        try {
            const constraints = {
                video: {
                    cursor: "always",
                    displaySurface: "browser"
                },
                audio: false
            };

            // For Safari and Firefox, simplify constraints
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            
            if (isSafari || isFirefox) {
                constraints.video = true; // Simplify for better compatibility
            }

            // Request screen sharing
            this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

            // Create and setup video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.playsInline = true;
            this.videoElement.setAttribute('playsinline', true); // For iOS Safari
            this.videoElement.setAttribute('webkit-playsinline', true); // For older iOS Safari

            // Add video to preview container
            const previewContainer = document.getElementById('screenPreview');
            if (previewContainer) {
                // Create close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'preview-close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.addEventListener('click', () => {
                    this.dispose();
                    // Toggle screen share button state
                    const screenBtn = document.querySelector('.screen-btn');
                    if (screenBtn) {
                        screenBtn.classList.remove('active');
                    }
                    // Notify parent component that sharing has stopped
                    if (this.config.onStop) {
                        this.config.onStop();
                    }
                });

                previewContainer.innerHTML = ''; // Clear any existing content
                previewContainer.appendChild(this.videoElement);
                previewContainer.appendChild(closeBtn);
                this.previewContainer = previewContainer;
                
                // Make preview draggable and resizable
                makeDraggableResizable(previewContainer);

                // Load saved position and size from localStorage
                const savedPosition = localStorage.getItem('screenPreviewPosition');
                const savedSize = localStorage.getItem('screenPreviewSize');
                
                if (savedPosition) {
                    try {
                        const { left, top } = JSON.parse(savedPosition);
                        previewContainer.style.left = `${left}px`;
                        previewContainer.style.top = `${top}px`;
                    } catch (e) {
                        // Use default position if parsing fails
                        previewContainer.style.left = '20px';
                        previewContainer.style.top = '340px';
                    }
                } else {
                    // Default position if none saved
                    previewContainer.style.left = '20px';
                    previewContainer.style.top = '340px';
                }

                if (savedSize) {
                    try {
                        const { width, height } = JSON.parse(savedSize);
                        previewContainer.style.width = `${width}px`;
                        previewContainer.style.height = `${height}px`;
                    } catch (e) {
                        // Use default size if parsing fails
                        previewContainer.style.width = '480px';
                        previewContainer.style.height = '270px';
                    }
                } else {
                    // Default size with 16:9 aspect ratio if none saved
                    previewContainer.style.width = '480px';
                    previewContainer.style.height = '270px';
                }

                this.showPreview(); // Show preview when initialized

                // Save position and size when window unloads
                window.addEventListener('beforeunload', () => {
                    try {
                        localStorage.setItem('screenPreviewPosition', JSON.stringify({
                            left: previewContainer.offsetLeft,
                            top: previewContainer.offsetTop
                        }));
                        localStorage.setItem('screenPreviewSize', JSON.stringify({
                            width: previewContainer.offsetWidth,
                            height: previewContainer.offsetHeight
                        }));
                    } catch (e) {
                        console.warn('Failed to save screen preview state:', e);
                    }
                });
            }

            try {
                await this.videoElement.play();
            } catch (playError) {
                console.error("Error playing screen video:", playError);
                // For Safari, sometimes need to retry
                setTimeout(async () => {
                    try {
                        await this.videoElement.play();
                    } catch (e) {
                        console.error("Retry play failed:", e);
                    }
                }, 200);
            }

            // Wait a moment for the video to load its dimensions
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get the actual video dimensions
            const videoWidth = this.videoElement.videoWidth || 1280;
            const videoHeight = this.videoElement.videoHeight || 720;
            this.aspectRatio = videoHeight / videoWidth;

            // Calculate canvas size maintaining aspect ratio
            const canvasWidth = this.config.width;
            const canvasHeight = Math.round(this.config.width * this.aspectRatio);

            // Create canvas for image processing
            this.canvas = document.createElement('canvas');
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            this.ctx = this.canvas.getContext('2d');

            // Listen for the end of screen sharing
            const videoTrack = this.stream.getVideoTracks()[0];
            if (videoTrack) {
                // Different browsers have different events
                videoTrack.addEventListener('ended', this._handleTrackEnded.bind(this));
                videoTrack.addEventListener('stop', this._handleTrackEnded.bind(this));
                
                // For Firefox
                this.stream.addEventListener('inactive', this._handleTrackEnded.bind(this));
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Screen capture initialization error:', error);
            throw new Error(`Failed to initialize screen capture: ${error.message}`);
        }
    }

    /**
     * Handle track ended events
     * @private
     */
    _handleTrackEnded() {
        // Stop screen capture and clean up
        this.dispose();
        
        // Toggle screen share button state
        const screenBtn = document.querySelector('.screen-btn');
        if (screenBtn) {
            screenBtn.classList.remove('active');
        }
        
        // Notify parent component that sharing has stopped
        if (this.config.onStop) {
            this.config.onStop();
        }
    }

    /**
     * Get current canvas dimensions
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        if (!this.isInitialized) {
            throw new Error('Screen capture not initialized. Call initialize() first.');
        }
        return {
            width: this.canvas?.width || 0,
            height: this.canvas?.height || 0
        };
    }

    /**
     * Capture and process a screenshot
     * @returns {Promise<string>} Base64 encoded JPEG image
     */
    async capture() {
        if (!this.isInitialized || !this.canvas || !this.ctx || !this.videoElement) {
            throw new Error('Screen capture not initialized. Call initialize() first.');
        }

        try {
            // Draw current video frame to canvas, maintaining aspect ratio
            this.ctx.drawImage(
                this.videoElement,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );

            // Convert to base64 JPEG with specified quality
            return this.canvas.toDataURL('image/jpeg', this.config.quality).split(',')[1];
        } catch (error) {
            console.error("Error capturing screen:", error);
            return "";
        }
    }

    /**
     * Stop screen capture and cleanup resources
     */
    dispose() {
        if (this.stream) {
            try {
                this.stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (e) {
                        console.warn("Error stopping track:", e);
                    }
                });
            } catch (e) {
                console.warn("Error stopping stream tracks:", e);
            }
            this.stream = null;
        }
        
        if (this.videoElement) {
            try {
                this.videoElement.pause();
                this.videoElement.srcObject = null;
                this.videoElement.remove();
            } catch (e) {
                console.warn("Error cleaning up video element:", e);
            }
            this.videoElement = null;
        }

        if (this.previewContainer) {
            this.hidePreview();
            try {
                this.previewContainer.innerHTML = ''; // Clear the preview container
            } catch (e) {
                console.warn("Error clearing preview container:", e);
            }
        }

        // Nullify references
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
        
        console.log('Screen capture disposed.');
    }
}
