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
                }
            }, 300); // Match animation duration
        }
    }

    /**
     * Create and append the camera switch button
     * @private
     */
    _createSwitchButton() {
        // Only create button on mobile devices
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

        // Reinitialize with new facingMode
        try {
            const constraints = {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: this.config.facingMode
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
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
        let stream = null;
        let currentFacingMode = this.config.facingMode || (isMobile ? 'user' : undefined); // Start with preferred or default

        const attemptConstraints = async (constraintsTry) => {
            try {
                console.log('Attempting getUserMedia with constraints:', JSON.stringify(constraintsTry));
                stream = await navigator.mediaDevices.getUserMedia(constraintsTry);
                console.log('getUserMedia successful.');
                // Store the successfully used facing mode if applicable
                if (constraintsTry.video && constraintsTry.video.facingMode) {
                    this.config.facingMode = constraintsTry.video.facingMode;
                    localStorage.setItem('facingMode', this.config.facingMode); // Save preference
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

        // --- Attempt 1: Preferred facing mode (if mobile) + Ideal Resolution ---
        let constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        if (isMobile && currentFacingMode) {
            constraints.video.facingMode = currentFacingMode;
        }
        stream = await attemptConstraints(constraints);

        // --- Attempt 2: Alternate facing mode (if mobile and Attempt 1 failed) ---
        if (!stream && isMobile) {
            const alternateFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            console.log(`Attempt 1 failed, trying alternate facingMode: ${alternateFacingMode}`);
            constraints.video.facingMode = alternateFacingMode;
            stream = await attemptConstraints(constraints);
            if (stream) currentFacingMode = alternateFacingMode; // Update if successful
        }

        // --- Attempt 3: Preferred/Successful facing mode (if mobile) + No Resolution Constraints ---
        if (!stream) {
            console.log('Attempts with ideal resolution failed, trying without resolution constraints...');
            constraints = { video: {} }; // Reset constraints
             if (isMobile && currentFacingMode) {
                 constraints.video.facingMode = currentFacingMode;
             }
            stream = await attemptConstraints(constraints);
        }

        // --- Attempt 4: Alternate facing mode (if mobile and Attempt 3 failed) + No Resolution Constraints ---
         if (!stream && isMobile) {
            const alternateFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            console.log(`Attempt 3 failed, trying alternate facingMode without resolution: ${alternateFacingMode}`);
            constraints = { video: { facingMode: alternateFacingMode } };
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
            // Potentially show a user-facing message here
            // alert('Could not access the camera. Please check permissions and ensure no other app is using it.');
            this.isInitialized = false; // Ensure state reflects failure
            return; // Exit initialization
        }

        // --- Stream acquired, proceed with setup ---
        this.stream = stream;
        try {

            // Create and setup video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.playsInline = true;
            
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
                    previewContainer.style.bottom = '20px';
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

            this.isInitialized = true;
            console.log('Camera initialized successfully.');
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
        if (!this.isInitialized) {
            throw new Error('Camera not initialized. Call initialize() first.');
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
     * Stop camera stream and cleanup resources
     */
    dispose() {
        console.log('Disposing camera resources...');
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Remove event listener for saving position/size
        // Note: This requires storing the listener function reference during initialization
        // For simplicity here, we assume it's acceptable for the listener to remain if dispose is called unexpectedly.
        // A more robust implementation would store and remove the listener.

        if (this.previewContainer) {
            // Remove elements added dynamically
            const closeBtn = this.previewContainer.querySelector('.preview-close-btn');
            if (closeBtn) closeBtn.remove();
            if (this.switchButton) this.switchButton.remove();
            if (this.videoElement) this.videoElement.remove();

            // Hide and clear container
            this.hidePreview();
            // Ensure container is empty before potentially removing it or reusing it later
            this.previewContainer.innerHTML = '';
            // We might not want to nullify previewContainer if the element itself should persist in the DOM
            // this.previewContainer = null; // Keep if the #cameraPreview element is static HTML
        }

        // Nullify references
        this.videoElement = null;
        this.switchButton = null;
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.aspectRatio = null;
        this.config.facingMode = localStorage.getItem('facingMode') || ( /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'user' : undefined); // Reset facing mode preference

        // Re-enable camera button if it was disabled due to error, allowing user to try again
        const cameraBtn = document.querySelector('.camera-btn');
        if (cameraBtn) {
             cameraBtn.disabled = false;
             cameraBtn.title = 'Toggle Camera'; // Reset title
             cameraBtn.classList.remove('active'); // Ensure it's not stuck in active state
        }
         console.log('Camera disposed.');
    }
}
