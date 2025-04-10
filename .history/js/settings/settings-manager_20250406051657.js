import { settingsTemplate } from './settings-template.js';

class SettingsManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeElements() {
        // Create settings dialog and overlay
        this.dialog = document.createElement('div');
        this.dialog.className = 'settings-dialog';
        this.dialog.innerHTML = settingsTemplate;

        this.overlay = document.createElement('div');
        this.overlay.className = 'settings-overlay';

        // Add to document
        document.body.appendChild(this.dialog);
        document.body.appendChild(this.overlay);

        // Initialize touch handling
        this.touchStartX = 0;
        this.currentTab = 'api'; // Default tab

        // Cache DOM elements
        this.elements = {
            dialog: this.dialog,
            tabs: this.dialog.querySelectorAll('.settings-tab'),
            panels: this.dialog.querySelectorAll('.settings-panel'),
            overlay: this.overlay,
            apiKeyInput: this.dialog.querySelector('#apiKey'),
            deepgramApiKeyInput: this.dialog.querySelector('#deepgramApiKey'),
            voiceSelect: this.dialog.querySelector('#voice'),
            sampleRateInput: this.dialog.querySelector('#sampleRate'),
            sampleRateValue: this.dialog.querySelector('#sampleRateValue'),
            systemInstructionsToggle: this.dialog.querySelector('#systemInstructionsToggle'),
            systemInstructionsContent: this.dialog.querySelector('#systemInstructions').parentElement,
            systemInstructionsInput: this.dialog.querySelector('#systemInstructions'),
            screenCameraToggle: this.dialog.querySelector('#screenCameraToggle'),
            screenCameraContent: this.dialog.querySelector('#screenCameraToggle + .collapsible-content'),
            fpsInput: this.dialog.querySelector('#screenFps'),
            fpsValue: this.dialog.querySelector('#fpsValue'),
            resizeWidthInput: this.dialog.querySelector('#resizeWidth'),
            resizeWidthValue: this.dialog.querySelector('#resizeWidthValue'),
            qualityInput: this.dialog.querySelector('#screenQuality'),
            qualityValue: this.dialog.querySelector('#qualityValue'),
            advancedToggle: this.dialog.querySelector('#advancedToggle'),
            advancedContent: this.dialog.querySelector('#advancedToggle + .collapsible-content'),
            temperatureInput: this.dialog.querySelector('#temperature'),
            temperatureValue: this.dialog.querySelector('#temperatureValue'),
            topPInput: this.dialog.querySelector('#topP'),
            topPValue: this.dialog.querySelector('#topPValue'),
            topKInput: this.dialog.querySelector('#topK'),
            topKValue: this.dialog.querySelector('#topKValue'),
            safetyToggle: this.dialog.querySelector('#safetyToggle'),
            safetyContent: this.dialog.querySelector('#safetyToggle + .collapsible-content'),
            harassmentInput: this.dialog.querySelector('#harassmentThreshold'),
            harassmentValue: this.dialog.querySelector('#harassmentValue'),
            dangerousInput: this.dialog.querySelector('#dangerousContentThreshold'),
            dangerousValue: this.dialog.querySelector('#dangerousValue'),
            sexualInput: this.dialog.querySelector('#sexuallyExplicitThreshold'),
            sexualValue: this.dialog.querySelector('#sexualValue'),
            civicInput: this.dialog.querySelector('#civicIntegrityThreshold'),
            civicValue: this.dialog.querySelector('#civicValue'),
            saveBtn: this.dialog.querySelector('#settingsSaveBtn')
        };
    }

    setupEventListeners() {
        // Close settings when clicking overlay
        this.overlay.addEventListener('click', () => this.hide());

        // Prevent dialog close when clicking inside dialog
        this.dialog.addEventListener('click', (e) => e.stopPropagation());

        // Save settings
        this.elements.saveBtn.addEventListener('click', () => {
            this.saveSettings();
            this.hide();
            window.location.reload();
        });

        // Tab switching
        const tabs = this.dialog.querySelectorAll('.settings-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.getAttribute('data-tab');
                this.switchTab(targetPanel);
            });
        });

        // Touch events for mobile swipe
        this.dialog.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        this.dialog.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = this.touchStartX - touchEndX;
            const threshold = 50; // minimum swipe distance

            if (Math.abs(diff) > threshold) {
                this.handleSwipe(diff > 0 ? 'left' : 'right');
            }
        });

        // Add input listeners for real-time value updates
        const inputElements = [
            'sampleRateInput', 'temperatureInput', 'topPInput', 'topKInput',
            'fpsInput', 'resizeWidthInput', 'qualityInput', 'harassmentInput',
            'dangerousInput', 'sexualInput', 'civicInput'
        ];

        inputElements.forEach(elementName => {
            this.elements[elementName].addEventListener('input', () => this.updateDisplayValues());
        });
    }

    switchTab(targetPanel) {
        // Deactivate current tab and panel
        this.dialog.querySelector('.settings-tab.active').classList.remove('active');
        this.dialog.querySelector('.settings-panel.active').classList.remove('active');

        // Activate new tab and panel
        this.dialog.querySelector(`.settings-tab[data-tab="${targetPanel}"]`).classList.add('active');
        this.dialog.querySelector(`.settings-panel[data-panel="${targetPanel}"]`).classList.add('active');

        this.currentTab = targetPanel;
    }

    handleSwipe(direction) {
        const tabs = Array.from(this.elements.tabs);
        const currentIndex = tabs.findIndex(tab => tab.getAttribute('data-tab') === this.currentTab);
        let nextIndex;

        if (direction === 'left') {
            nextIndex = (currentIndex + 1) % tabs.length;
        } else {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        }

        const nextTab = tabs[nextIndex].getAttribute('data-tab');
        this.switchTab(nextTab);
    }

    loadSettings() {
        // Load values from localStorage
        this.elements.apiKeyInput.value = localStorage.getItem('apiKey') || '';
        this.elements.deepgramApiKeyInput.value = localStorage.getItem('deepgramApiKey') || '';
        this.elements.voiceSelect.value = localStorage.getItem('voiceName') || 'Aoede';
        this.elements.sampleRateInput.value = localStorage.getItem('sampleRate') || '27000';
        this.elements.systemInstructionsInput.value = localStorage.getItem('systemInstructions') || 'You are a helpful assistant';
        this.elements.temperatureInput.value = localStorage.getItem('temperature') || '1.8';
        this.elements.topPInput.value = localStorage.getItem('top_p') || '0.95';
        this.elements.topKInput.value = localStorage.getItem('top_k') || '65';

        // Initialize screen & camera settings
        this.elements.fpsInput.value = localStorage.getItem('fps') || '1';
        this.elements.resizeWidthInput.value = localStorage.getItem('resizeWidth') || '640';
        this.elements.qualityInput.value = localStorage.getItem('quality') || '0.3';

        // Initialize safety settings
        this.elements.harassmentInput.value = localStorage.getItem('harassmentThreshold') || '3';
        this.elements.dangerousInput.value = localStorage.getItem('dangerousContentThreshold') || '3';
        this.elements.sexualInput.value = localStorage.getItem('sexuallyExplicitThreshold') || '3';
        this.elements.civicInput.value = localStorage.getItem('civicIntegrityThreshold') || '3';

        this.updateDisplayValues();
    }

    saveSettings() {
        localStorage.setItem('apiKey', this.elements.apiKeyInput.value);
        localStorage.setItem('deepgramApiKey', this.elements.deepgramApiKeyInput.value);
        localStorage.setItem('voiceName', this.elements.voiceSelect.value);
        localStorage.setItem('sampleRate', this.elements.sampleRateInput.value);
        localStorage.setItem('systemInstructions', this.elements.systemInstructionsInput.value);
        localStorage.setItem('temperature', this.elements.temperatureInput.value);
        localStorage.setItem('top_p', this.elements.topPInput.value);
        localStorage.setItem('top_k', this.elements.topKInput.value);
        
        // Save screen & camera settings
        localStorage.setItem('fps', this.elements.fpsInput.value);
        localStorage.setItem('resizeWidth', this.elements.resizeWidthInput.value);
        localStorage.setItem('quality', this.elements.qualityInput.value);

        // Save safety settings
        localStorage.setItem('harassmentThreshold', this.elements.harassmentInput.value);
        localStorage.setItem('dangerousContentThreshold', this.elements.dangerousInput.value);
        localStorage.setItem('sexuallyExplicitThreshold', this.elements.sexualInput.value);
        localStorage.setItem('civicIntegrityThreshold', this.elements.civicInput.value);
    }

    updateDisplayValues() {
        if (this.elements.sampleRateValue) this.elements.sampleRateValue.textContent = this.elements.sampleRateInput.value + ' Hz';
        if (this.elements.temperatureValue) this.elements.temperatureValue.textContent = this.elements.temperatureInput.value;
        if (this.elements.topPValue) this.elements.topPValue.textContent = this.elements.topPInput.value;
        if (this.elements.topKValue) this.elements.topKValue.textContent = this.elements.topKInput.value;
        if (this.elements.fpsValue) this.elements.fpsValue.textContent = this.elements.fpsInput.value + ' FPS';
        if (this.elements.resizeWidthValue) this.elements.resizeWidthValue.textContent = this.elements.resizeWidthInput.value + 'px';
        if (this.elements.qualityValue) this.elements.qualityValue.textContent = this.elements.qualityInput.value;
        if (this.elements.harassmentValue) this.elements.harassmentValue.textContent = this.getThresholdLabel(this.elements.harassmentInput.value);
        if (this.elements.dangerousValue) this.elements.dangerousValue.textContent = this.getThresholdLabel(this.elements.dangerousInput.value);
        if (this.elements.sexualValue) this.elements.sexualValue.textContent = this.getThresholdLabel(this.elements.sexualInput.value);
        if (this.elements.civicValue) this.elements.civicValue.textContent = this.getThresholdLabel(this.elements.civicInput.value);
    }

    getThresholdLabel(value) {
        const labels = {
            '0': 'None',
            '1': 'Low',
            '2': 'Medium',
            '3': 'High'
        };
        return labels[value] || value;
    }

    toggleCollapsible(toggle, content) {
        const isActive = content.classList.contains('active');
        content.classList.toggle('active');
        toggle.textContent = toggle.textContent.replace(isActive ? '▼' : '▲', isActive ? '▲' : '▼');
    }

    show() {
        this.dialog.classList.add('active');
        this.overlay.classList.add('active');
    }

    hide() {
        this.dialog.classList.remove('active');
        this.overlay.classList.remove('active');
    }
}

export default new SettingsManager();
