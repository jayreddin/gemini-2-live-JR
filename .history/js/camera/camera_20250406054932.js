import { makeDraggableResizable } from '../utils/draggable-resizable.js';

/**
 * Manages camera access, capture, and image processing
 */
export class CameraManager {
    /**
     * @param {Object} config
     * @param {number} config.width - Target width for resizing captured images
     * @param {number} config.quality - JPEG quality (0-1)
     * @param {string} [config.facingMode] - Camera facing mode (optional, mobile-only)
     */
    constructor(config) {
        this.config = {
            width: config.width || 640,
            quality: config.quality || 0.8,
            facingMode: config.facingMode // undefined by default for desktop compatibility
        };
        
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
        this.previewContainer = null;
        this.switchButton = null;
    }

    /**
     * Show the camera preview
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
     * Hide the camera preview
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
     * Create and append the camera switch button
     * @private
     */
    _createSwitchButton() {
        // Create button on all mobile devices and iOS specifically
        if (!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

        this.switchButton = document.createElement('button');
        this.switchButton.className = 'camera-switch-btn';
        this.switchButton.innerHTML = '⟲';
        this.switchButton.addEventListener('click', () => this.switchCamera());
        this.previewContainer.appendChild(this.switchButton);
    }

    /**
     * Switch between front and back cameras
     */
    async switchCamera() {
        if (!this.isInitialized) return;
        
        // Toggle facingMode
        this.config.facingMode = this.config.facingMode === 'user' ? 'environment' : 'user';
        localStorage.setItem('facingMode', this.config.facingMode);
        
        // Stop current stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        // Reinitialize with new facingMode - attempt with multiple constraint options
        try {
            // First try with exact constraint (works best on most browsers)
            const constraints = {
                video: {
                    width: { ideal: 1280 }, // Reduced from 1920 for better compatibility
                    height: { ideal: 720 }, // Reduced from 1080 for better compatibility
                    facingMode: this.config.facingMode
                }
            };

            // For iOS Safari, use exact constraint as a fallback
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                try {
                    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (e) {
                    console.log('Falling back to exact constraints for iOS Safari');
                    constraints.video.facingMode = { exact: this.config.facingMode };
                    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
                }
            } else {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                // iOS Safari requires these settings
                this.videoElement.setAttribute('playsinline', true);
                this.videoElement.setAttribute('webkit-playsinline', true);
                await this.videoElement.play();
            }
        } catch (error) {
            console.error('Failed to switch camera:', error);
            // Revert to previous facing mode on error
            this.config.facingMode = localStorage.getItem('facingMode') || 'environment';
        }
    }

    /**
     * Initialize camera stream and canvas
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('Initializing camera...');
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        let stream = null;
        let currentFacingMode = this.config.facingMode || (isMobile ? 'user' : undefined);

        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Polyfill for older browsers
            navigator.mediaDevices = {};
            
            navigator.mediaDevices.getUserMedia = function(constraints) {
                // Get legacy API versions
                const getUserMedia = navigator.getUserMedia || 
                                    navigator.webkitGetUserMedia ||
                                    navigator.mozGetUserMedia ||
                                    navigator.msGetUserMedia;
                
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }
                
                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            };
        }

        const attemptConstraints = async (constraintsTry) => {
            try {
                console.log('Attempting getUserMedia with constraints:', JSON.stringify(constraintsTry));
                stream = await navigator.mediaDevices.getUserMedia(constraintsTry);
                console.log('getUserMedia successful.');
                // Store the successfully used facing mode if applicable
                if (constraintsTry.video && constraintsTry.video.facingMode) {
                    if (typeof constraintsTry.video.facingMode === 'object' && constraintsTry.video.facingMode.exact) {
                        this.config.facingMode = constraintsTry.video.facingMode.exact;
                    } else {
                        this.config.facingMode = constraintsTry.video.facingMode;
                    }
                    localStorage.setItem('facingMode', this.config.facingMode);
                }
                return stream; // Success
            } catch (error) {
                console.warn(`getUserMedia failed for constraints ${JSON.stringify(constraintsTry)}:`, error.name, error.message);
                if (error.name === 'NotAllowedError') {
                    console.error('Camera permission denied by user.');
                    throw error; // Re-throw permission errors, cannot recover
                }
                if (error.name === 'NotReadableError') {
                    console.error('Camera hardware/OS error.');
                    throw error; // Re-throw hardware errors, cannot recover
                }
                // For NotFoundError, OverconstrainedError, etc., we can try alternatives
                return null; // Indicate failure but allow retries
            }
        };

        // --- Attempt 1: Standard with reduced ideal resolution for better compatibility ---
        let constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        if (isMobile && currentFacingMode) {
            constraints.video.facingMode = currentFacingMode;
        }
        
        stream = await attemptConstraints(constraints);

        // --- Attempt 2: For iOS Safari, try exact constraint ---
        if (!stream && isIOS) {
            console.log('Trying iOS Safari exact facingMode constraint');
            constraints.video.facingMode = { exact: currentFacingMode };
            stream = await attemptConstraints(constraints);
        }

        // --- Attempt 3: Alternate facing mode ---
        if (!stream && isMobile) {
            const alternateFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            console.log(`Trying alternate facingMode: ${alternateFacingMode}`);
            
            if (isIOS) {
                constraints.video.facingMode = { exact: alternateFacingMode };
            } else {
                constraints.video.facingMode = alternateFacingMode;
            }
            
            stream = await attemptConstraints(constraints);
            if (stream) currentFacingMode = alternateFacingMode;
        }

        // --- Attempt 4: Minimal constraints ---
        if (!stream) {
            console.log('Trying minimal video constraints...');
            constraints = { video: true };
            stream = await attemptConstraints(constraints);
        }

        // --- Final Check ---
        if (!stream) {
            console.error('Failed to initialize camera after multiple attempts.');
            // Gracefully disable UI elements
            const cameraBtn = document.querySelector('.camera-btn');
            if (cameraBtn) {
                cameraBtn.disabled = true;
                cameraBtn.title = 'Camera not available or permission denied.';
                cameraBtn.classList.remove('active');
            }
            this.isInitialized = false;
            return;
        }

        // --- Stream acquired, proceed with setup ---
        this.stream = stream;
        try {
            // Create and setup video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            
            // Important attributes for iOS Safari
            this.videoElement.setAttribute('playsinline', true); 
            this.videoElement.setAttribute('webkit-playsinline', true);
            this.videoElement.setAttribute('muted', true);
            this.videoElement.setAttribute('autoplay', true);
            
            // Add video to preview container
            const previewContainer = document.getElementById('cameraPreview');
            if (previewContainer) {
                // Create close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'preview-close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.addEventListener('click', () => {
                    this.dispose();
                    // Toggle camera button state
                    const cameraBtn = document.querySelector('.camera-btn');
                    if (cameraBtn) {
                        cameraBtn.classList.remove('active');
                    }
                });

                previewContainer.appendChild(this.videoElement);
                previewContainer.appendChild(closeBtn);
                this.previewContainer = previewContainer;
                
                // Make preview draggable and resizable
                makeDraggableResizable(previewContainer);

                // Load saved position and size from localStorage
                const savedPosition = localStorage.getItem('cameraPreviewPosition');
                const savedSize = localStorage.getItem('cameraPreviewSize');
                
                if (savedPosition) {
                    const { left, top } = JSON.parse(savedPosition);
                    previewContainer.style.left = `${left}px`;
                    previewContainer.style.top = `${top}px`;
                } else {
                    // Default position if none saved
                    previewContainer.style.right = '20px';
                    previewContainer.style.top = '80px';
                }

                if (savedSize) {
                    const { width, height } = JSON.parse(savedSize);
                    previewContainer.style.width = `${width}px`;
                    previewContainer.style.height = `${height}px`;
                } else {
                    // Default size if none saved
                    previewContainer.style.width = '320px';
                    previewContainer.style.height = '240px';
                }

                this._createSwitchButton(); // Add switch button
                this.showPreview(); // Show preview when initialized

                // Save position and size when window unloads
                window.addEventListener('beforeunload', () => {
                    localStorage.setItem('cameraPreviewPosition', JSON.stringify({
                        left: previewContainer.offsetLeft,
                        top: previewContainer.offsetTop
                    }));
                    localStorage.setItem('cameraPreviewSize', JSON.stringify({
                        width: previewContainer.offsetWidth,
                        height: previewContainer.offsetHeight
                    }));
                });
            }
            
            // Wait for play to ensure dimensions are available
            try {
                await this.videoElement.play();
            } catch (playError) {
                console.error("Error playing video:", playError);
                // For iOS Safari, sometimes we need to try playing again after a timeout
                if (isIOS) {
                    setTimeout(async () => {
                        try {
                            await this.videoElement.play();
                        } catch (e) {
                            console.error("Retry play failed:", e);
                        }
                    }, 200);
                }
            }

            // Wait a moment for the video to load its dimensions
            setTimeout(() => {
                // Get the actual video dimensions
                const videoWidth = this.videoElement.videoWidth || 640;
                const videoHeight = this.videoElement.videoHeight || 480;
                this.aspectRatio = videoHeight / videoWidth;

                // Calculate canvas size maintaining aspect ratio
                const canvasWidth = this.config.width;
                const canvasHeight = Math.round(this.config.width * this.aspectRatio);

                // Create canvas for image processing
                this.canvas = document.createElement('canvas');
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;
                this.ctx = this.canvas.getContext('2d');

                this.isInitialized = true;
                console.log('Camera initialized successfully.');
            }, 500); // Give time for video dimensions to be available
        } catch (setupError) {
            // Catch errors during element creation/setup phase
            console.error('Error setting up camera preview elements:', setupError);
            this.dispose(); // Clean up partially acquired resources
            // Disable UI
            const cameraBtn = document.querySelector('.camera-btn');
            if (cameraBtn) {
                cameraBtn.disabled = true;
                cameraBtn.title = 'Error setting up camera preview.';
                cameraBtn.classList.remove('active');
            }
            this.isInitialized = false;
            return;
        }
    }

    /**
     * Get current canvas dimensions
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        if (!this.isInitialized) {
            throw new Error('Camera not initialized. Call initialize() first.');
        }
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Capture and process an image from the camera
     * @returns {Promise<string>} Base64 encoded JPEG image
     */
    async capture() {
        if (!this.isInitialized || !this.ctx || !this.canvas) {
            throw new Error('Camera not initialized. Call initialize() first.');
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
            console.error("Error capturing image:", error);
            // Return empty string or error indicator
            return "";
        }
    }

    /**
     * Stop camera stream and cleanup resources
     */
    dispose() {
        console.log('Disposing camera resources...');
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch (e) {
                    console.warn("Error stopping track:", e);
                }
            });
            this.stream = null;
        }

        if (this.previewContainer) {
            // Remove elements added dynamically
            const closeBtn = this.previewContainer.querySelector('.preview-close-btn');
            if (closeBtn) closeBtn.remove();
            if (this.switchButton) this.switchButton.remove();
            
            if (this.videoElement) {
                // Clean up video element
                try {
                    this.videoElement.pause();
                    this.videoElement.srcObject = null;
                } catch (e) {
                    console.warn("Error cleaning up video element:", e);
                }
                this.videoElement.remove();
            }

            // Hide and clear container
            this.hidePreview();
            this.previewContainer.innerHTML = '';
        }

        // Nullify references
        this.videoElement = null;
        this.switchButton = null;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
        this.config.facingMode = localStorage.getItem('facingMode') || 
            (/iPhone|iPad|iPod|Mobi|Android/i.test(navigator.userAgent) ? 'user' : undefined);

        // Re-enable camera button if it was disabled due to error
        const cameraBtn = document.querySelector('.camera-btn');
        if (cameraBtn) {
             cameraBtn.disabled = false;
             cameraBtn.title = 'Toggle Camera';
             cameraBtn.classList.remove('active');
        }
        console.log('Camera disposed.');
    }
}
