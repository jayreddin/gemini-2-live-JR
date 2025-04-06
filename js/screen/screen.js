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
                }
            }, 300); // Match animation duration
        }
    }

    /**
     * Initialize screen capture stream and canvas
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Request screen sharing
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: false
            });

            // Create and setup video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.playsInline = true;

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

                previewContainer.appendChild(this.videoElement);
                previewContainer.appendChild(closeBtn);
                this.previewContainer = previewContainer;
                
                // Make preview draggable and resizable
                makeDraggableResizable(previewContainer);

                // Load saved position and size from localStorage
                const savedPosition = localStorage.getItem('screenPreviewPosition');
                const savedSize = localStorage.getItem('screenPreviewSize');
                
                if (savedPosition) {
                    const { left, top } = JSON.parse(savedPosition);
                    previewContainer.style.left = `${left}px`;
                    previewContainer.style.top = `${top}px`;
                } else {
                    // Default position if none saved
                    previewContainer.style.left = '20px';
                    previewContainer.style.bottom = '20px';
                }

                if (savedSize) {
                    const { width, height } = JSON.parse(savedSize);
                    previewContainer.style.width = `${width}px`;
                    previewContainer.style.height = `${height}px`;
                } else {
                    // Default size if none saved
                    previewContainer.style.width = '480px';
                    previewContainer.style.height = '320px';
                }

                this.showPreview(); // Show preview when initialized

                // Save position and size when window unloads
                window.addEventListener('beforeunload', () => {
                    localStorage.setItem('screenPreviewPosition', JSON.stringify({
                        left: previewContainer.offsetLeft,
                        top: previewContainer.offsetTop
                    }));
                    localStorage.setItem('screenPreviewSize', JSON.stringify({
                        width: previewContainer.offsetWidth,
                        height: previewContainer.offsetHeight
                    }));
                });
            }

            await this.videoElement.play();

            // Get the actual video dimensions
            const videoWidth = this.videoElement.videoWidth;
            const videoHeight = this.videoElement.videoHeight;
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
            this.stream.getVideoTracks()[0].addEventListener('ended', () => {
                this.dispose();
                // Notify parent component that sharing has stopped
                if (this.config.onStop) {
                    this.config.onStop();
                }
            });

            this.isInitialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize screen capture: ${error.message}`);
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
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Capture and process a screenshot
     * @returns {Promise<string>} Base64 encoded JPEG image
     */
    async capture() {
        if (!this.isInitialized) {
            throw new Error('Screen capture not initialized. Call initialize() first.');
        }

        // Draw current video frame to canvas, maintaining aspect ratio
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Convert to base64 JPEG with specified quality
        return this.canvas.toDataURL('image/jpeg', this.config.quality).split(',')[1];
    }

    /**
     * Stop screen capture and cleanup resources
     */
    dispose() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }

        if (this.previewContainer) {
            this.hidePreview();
            this.previewContainer.innerHTML = ''; // Clear the preview container
            this.previewContainer = null;
        }

        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
    }
}
