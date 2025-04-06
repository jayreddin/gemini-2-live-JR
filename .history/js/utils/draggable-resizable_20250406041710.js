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
