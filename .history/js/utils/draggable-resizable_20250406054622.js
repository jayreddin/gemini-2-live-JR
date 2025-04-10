/**
 * Makes an element draggable and resizable.
 * @param {HTMLElement} element - The element to make interactive.
 */
export function makeDraggableResizable(element) {
    let isDragging = false;
    let isResizing = false;
    let currentX, currentY, initialX, initialY;
    let resizeHandle = null;
    let touchIdentifier = null;

    // Touch event handlers for drag
    function handleTouchStart(e) {
        if (e.target === element || e.target.tagName === 'VIDEO') {
            const touch = e.touches[0];
            touchIdentifier = touch.identifier;
            isDragging = true;
            initialX = touch.clientX - element.offsetLeft;
            initialY = touch.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
            // Prevent default only for draggable elements in Safari
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    }

    function handleTouchMove(e) {
        if (!isDragging && !isResizing) return;

        // Prevent scrolling while dragging, with Safari check
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const touchList = e.touches || e.changedTouches || [];
        const touch = Array.from(touchList).find(t => t.identifier === touchIdentifier);
        if (!touch) return;

        if (isDragging) {
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;

            // Boundary checks
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            // Use transform for better performance
            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        } else if (isResizing) {
            const dx = touch.clientX - initialX;
            const dy = touch.clientY - initialY;
            handleResize(dx, dy);
        }
    }

    function handleTouchEnd() {
        if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            touchIdentifier = null;
            element.style.cursor = 'move';
            saveState(); // Save state after touch interaction ends
        }
    }

    function handleResize(dx, dy) {
        let newWidth = element.initialWidth;
        let newHeight = element.initialHeight;
        let newLeft = element.initialLeft;
        let newTop = element.initialTop;

        // Get viewport dimensions
        const maxWidth = window.innerWidth - (resizeHandle.includes('left') ? element.initialLeft : 0);
        const maxHeight = window.innerHeight - (resizeHandle.includes('top') ? element.initialTop : 0);

        if (resizeHandle.includes('right')) {
            newWidth = Math.min(maxWidth, Math.max(160, element.initialWidth + dx));
        } else if (resizeHandle.includes('left')) {
            const proposedWidth = Math.min(maxWidth, Math.max(160, element.initialWidth - dx));
            if (proposedWidth !== element.initialWidth) {
                newWidth = proposedWidth;
                newLeft = Math.max(0, element.initialLeft + dx);
            }
        }

        if (resizeHandle.includes('bottom')) {
            newHeight = Math.min(maxHeight, Math.max(120, element.initialHeight + dy));
        } else if (resizeHandle.includes('top')) {
            const proposedHeight = Math.min(maxHeight, Math.max(120, element.initialHeight - dy));
            if (proposedHeight !== element.initialHeight) {
                newHeight = proposedHeight;
                newTop = Math.max(0, element.initialTop + dy);
            }
        }

        // Ensure element stays within viewport bounds
        if (newLeft + newWidth <= window.innerWidth && 
            newTop + newHeight <= window.innerHeight) {
            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }

        // Save state after resize
        saveState();
    }

    // Add resize handles (optional, can be styled via CSS)
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    handles.forEach(handleType => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', handleType);
        element.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle = handleType;
            initialX = e.clientX;
            initialY = e.clientY;
            // Store initial dimensions and position
            element.initialWidth = element.offsetWidth;
            element.initialHeight = element.offsetHeight;
            element.initialLeft = element.offsetLeft;
            element.initialTop = element.offsetTop;
            e.stopPropagation(); // Prevent drag start
        });

        handle.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchIdentifier = touch.identifier;
            isResizing = true;
            resizeHandle = handleType;
            initialX = touch.clientX;
            initialY = touch.clientY;
            element.initialWidth = element.offsetWidth;
            element.initialHeight = element.offsetHeight;
            element.initialLeft = element.offsetLeft;
            element.initialTop = element.offsetTop;
            if (e.cancelable) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
    });

    element.addEventListener('mousedown', (e) => {
        if (e.target === element || e.target.tagName === 'VIDEO') { // Allow dragging by clicking the element or video inside
            isDragging = true;
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Boundary checks
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        } else if (isResizing) {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;
            let newWidth = element.initialWidth;
            let newHeight = element.initialHeight;
            let newLeft = element.initialLeft;
            let newTop = element.initialTop;

            // Get viewport dimensions
            const maxWidth = window.innerWidth - (resizeHandle.includes('left') ? element.initialLeft : 0);
            const maxHeight = window.innerHeight - (resizeHandle.includes('top') ? element.initialTop : 0);

            if (resizeHandle.includes('right')) {
                newWidth = Math.min(maxWidth, Math.max(160, element.initialWidth + dx));
            } else if (resizeHandle.includes('left')) {
                const proposedWidth = Math.min(maxWidth, Math.max(160, element.initialWidth - dx));
                if (proposedWidth !== element.initialWidth) {
                    newWidth = proposedWidth;
                    newLeft = Math.max(0, element.initialLeft + dx);
                }
            }

            if (resizeHandle.includes('bottom')) {
                newHeight = Math.min(maxHeight, Math.max(120, element.initialHeight + dy));
            } else if (resizeHandle.includes('top')) {
                const proposedHeight = Math.min(maxHeight, Math.max(120, element.initialHeight - dy));
                if (proposedHeight !== element.initialHeight) {
                    newHeight = proposedHeight;
                    newTop = Math.max(0, element.initialTop + dy);
                }
            }

            // Ensure element stays within viewport bounds
            if (newLeft + newWidth <= window.innerWidth && 
                newTop + newHeight <= window.innerHeight) {
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'move';
            saveState();
        }
        if (isResizing) {
            isResizing = false;
            resizeHandle = null;
            saveState();
        }
    });

    // Add touch event listeners with proper options for iOS Safari
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Initial styling
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    
    // Handle window resize
    const checkBounds = () => {
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        // Keep element within viewport bounds
        if (element.offsetLeft > maxX) {
            element.style.left = `${maxX}px`;
        }
        if (element.offsetTop > maxY) {
            element.style.top = `${maxY}px`;
        }
        if (element.offsetLeft < 0) {
            element.style.left = '0px';
        }
        if (element.offsetTop < 0) {
            element.style.top = '0px';
        }
    };

    window.addEventListener('resize', checkBounds);

    // Save state when window unloads
    const saveState = () => {
        const state = {
            position: {
                left: element.offsetLeft,
                top: element.offsetTop
            },
            size: {
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        };
        
        // Save state based on element id
        if (element.id === 'cameraPreview') {
            localStorage.setItem('cameraPreviewState', JSON.stringify(state));
        } else if (element.id === 'screenPreview') {
            localStorage.setItem('screenPreviewState', JSON.stringify(state));
        }
    };

    // Load saved state
    const loadState = () => {
        let savedState;
        if (element.id === 'cameraPreview') {
            savedState = localStorage.getItem('cameraPreviewState');
        } else if (element.id === 'screenPreview') {
            savedState = localStorage.getItem('screenPreviewState');
        }

        if (savedState) {
            const state = JSON.parse(savedState);
            element.style.left = `${state.position.left}px`;
            element.style.top = `${state.position.top}px`;
            element.style.width = `${state.size.width}px`;
            element.style.height = `${state.size.height}px`;
        }
    };

    // Save state when window unloads
    window.addEventListener('beforeunload', saveState);

    // Load initial state
    loadState();
}
