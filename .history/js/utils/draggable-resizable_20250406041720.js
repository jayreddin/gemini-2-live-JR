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
        }
    }

    function handleTouchMove(e) {
        if (!isDragging && !isResizing) return;

        e.preventDefault(); // Prevent scrolling while dragging
        const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifier);
        if (!touch) return;

        if (isDragging) {
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;

            // Boundary checks
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));

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
        }
    }

    function handleResize(dx, dy) {
        let newWidth = element.initialWidth;
        let newHeight = element.initialHeight;
        let newLeft = element.initialLeft;
        let newTop = element.initialTop;

        if (resizeHandle.includes('right')) {
            newWidth = Math.max(160, element.initialWidth + dx);
        } else if (resizeHandle.includes('left')) {
            const proposedWidth = Math.max(160, element.initialWidth - dx);
            if (proposedWidth !== element.initialWidth) {
                newWidth = proposedWidth;
                newLeft = element.initialLeft + dx;
            }
        }

        if (resizeHandle.includes('bottom')) {
            newHeight = Math.max(120, element.initialHeight + dy);
        } else if (resizeHandle.includes('top')) {
            const proposedHeight = Math.max(120, element.initialHeight - dy);
            if (proposedHeight !== element.initialHeight) {
                newHeight = proposedHeight;
                newTop = element.initialTop + dy;
            }
        }

        // Apply new dimensions and position
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
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
            // TODO: Add boundary checks to prevent moving outside viewport or over chat area
            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        } else if (isResizing) {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;
            let newWidth = element.initialWidth;
            let newHeight = element.initialHeight;
            let newLeft = element.initialLeft;
            let newTop = element.initialTop;

            if (resizeHandle.includes('right')) {
                newWidth = element.initialWidth + dx;
            } else if (resizeHandle.includes('left')) {
                newWidth = element.initialWidth - dx;
                newLeft = element.initialLeft + dx;
            }

            if (resizeHandle.includes('bottom')) {
                newHeight = element.initialHeight + dy;
            } else if (resizeHandle.includes('top')) {
                newHeight = element.initialHeight - dy;
                newTop = element.initialTop + dy;
            }

            // TODO: Add min/max size constraints and boundary checks
            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'move';
            // TODO: Save position to localStorage
        }
        if (isResizing) {
            isResizing = false;
            resizeHandle = null;
            // TODO: Save size to localStorage
        }
    });

    // Initial styling
    element.style.position = 'absolute'; // Ensure position is absolute
    element.style.cursor = 'move';
}
