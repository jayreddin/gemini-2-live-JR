import elements from './elements.js';
import settingsManager from '../settings/settings-manager.js';

let isCameraActive = false;
let isScreenShareActive = false;
let responseMode = 'text'; // Default response mode
let currentTheme = localStorage.getItem('theme') || 'dark'; // Default theme

/**
 * Updates UI to show disconnect button and hide connect button
 */
const showDisconnectButton = () => {
    elements.connectBtn.style.display = 'none';
    elements.disconnectBtn.style.display = 'block';
};

/**
 * Updates UI to show connect button and hide disconnect button
 */
const showConnectButton = () => {
    elements.disconnectBtn.style.display = 'none';
    elements.connectBtn.style.display = 'block';
};

/**
 * Ensures the agent is connected and initialized
 * @param {GeminiAgent} agent - The main application agent instance
 * @returns {Promise<void>}
 */
const ensureAgentReady = async (agent) => {
    if (!agent.connected) {
        await agent.connect();
        showDisconnectButton();
    }
    if (!agent.initialized) {
        await agent.initialize();
    }
};

/**
 * Toggles the response mode between 'text' and 'audio'
 */
const toggleResponseMode = () => {
    responseMode = responseMode === 'text' ? 'audio' : 'text';
    console.log(`Response mode set to: ${responseMode}`);

    // Update toggle button icon dynamically
    const iconSpan = elements.responseToggleBtn.querySelector('.material-icons');
    if (iconSpan) {
        iconSpan.innerText = responseMode === 'text' ? 'text_fields' : 'volume_up';
    }

    // Optionally, signal the agent or other components here if needed
};

/**
 * Toggles the theme between 'light' and 'dark'
 */
const toggleTheme = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    // TODO: Update theme toggle button icon
};

/**
 * Sets up event listeners for the application's UI elements
 * @param {GeminiAgent} agent - The main application agent instance
 */
export function setupEventListeners(agent) {
    // Apply initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Header Buttons
    elements.disconnectBtn.addEventListener('click', async () => {
        try {
            await agent.disconnect();
            showConnectButton();
            [elements.cameraBtn, elements.screenBtn, elements.micBtn].forEach(btn => btn.classList.remove('active'));
            isCameraActive = false;
            isScreenShareActive = false;
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    });

    elements.connectBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
        } catch (error) {
            console.error('Error connecting:', error);
        }
    });

    elements.responseToggleBtn.addEventListener('click', toggleResponseMode);
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Control Row Buttons
    elements.micBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            await agent.toggleMic();
            elements.micBtn.classList.toggle('active');
        } catch (error) {
            console.error('Error toggling microphone:', error);
            elements.micBtn.classList.remove('active');
        }
    });

    elements.cameraBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            if (!isCameraActive) {
                await agent.startCameraCapture();
                elements.cameraBtn.classList.add('active');
            } else {
                await agent.stopCameraCapture();
                elements.cameraBtn.classList.remove('active');
            }
            isCameraActive = !isCameraActive;
        } catch (error) {
            console.error('Error toggling camera:', error);
            elements.cameraBtn.classList.remove('active');
            isCameraActive = false;
        }
    });

    agent.on('screenshare_stopped', () => {
        elements.screenBtn.classList.remove('active');
        isScreenShareActive = false;
        console.info('Screen share stopped');
    });

    elements.screenBtn.addEventListener('click', async () => {
        try {
            await ensureAgentReady(agent);
            if (!isScreenShareActive) {
                await agent.startScreenShare();
                elements.screenBtn.classList.add('active');
            } else {
                await agent.stopScreenShare();
                elements.screenBtn.classList.remove('active');
            }
            isScreenShareActive = !isScreenShareActive;
        } catch (error) {
            console.error('Error toggling screen share:', error);
            elements.screenBtn.classList.remove('active');
            isScreenShareActive = false;
        }
    });

    elements.settingsBtn.addEventListener('click', () => settingsManager.show());

    // Message Sending
    const sendMessage = async () => {
        try {
            await ensureAgentReady(agent);
            const text = elements.messageInput.value.trim();
            if (text) {
                await agent.sendText(text);
                elements.messageInput.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
}

// Initialize settings manager (already exported as default instance)
settingsManager;
