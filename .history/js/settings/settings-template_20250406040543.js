export const settingsTemplate = `
<div class="settings-tabs">
    <button class="settings-tab active" data-tab="api">API</button>
    <button class="settings-tab" data-tab="audio">Audio</button>
    <button class="settings-tab" data-tab="camera">Camera</button>
    <button class="settings-tab" data-tab="screen">Screen</button>
    <button class="settings-tab" data-tab="prompt">System Prompt</button>
    <button class="settings-tab" data-tab="advanced">Advanced</button>
    <button class="settings-tab" data-tab="safety">Safety</button>
</div>

<div class="settings-content">
    <!-- API Settings Panel -->
    <div class="settings-panel active" data-panel="api">
        <div class="settings-group">
            <label for="apiKey">Gemini API Key</label>
            <input type="password" id="apiKey" placeholder="Enter your Gemini API key">
        </div>
        <div class="settings-group">
            <label for="deepgramApiKey">Deepgram API Key (Optional)</label>
            <input type="password" id="deepgramApiKey" placeholder="Enter your Deepgram API key">
        </div>
    </div>

    <!-- Audio Settings Panel -->
    <div class="settings-panel" data-panel="audio">
        <div class="settings-group">
            <label for="voice">Voice</label>
            <select id="voice">
                <option value="Puck">Puck</option>
                <option value="Charon">Charon</option>
                <option value="Kore">Kore</option>
                <option value="Fenrir">Fenrir</option>
                <option value="Aoede">Aoede</option>
            </select>
        </div>
        <div class="settings-group">
            <label for="sampleRate">Sample Rate</label>
            <input type="range" id="sampleRate" min="8000" max="48000" step="1000">
            <span id="sampleRateValue"></span>
        </div>
    </div>

    <!-- Camera Settings Panel -->
    <div class="settings-panel" data-panel="camera">
        <div class="settings-group">
            <label for="cameraFps">Camera FPS (1-10)</label>
            <input type="range" id="cameraFps" min="1" max="10" step="1">
            <span id="cameraFpsValue"></span>
        </div>
        <div class="settings-group">
            <label for="cameraQuality">Camera Quality (0.1-1)</label>
            <input type="range" id="cameraQuality" min="0.1" max="1" step="0.1">
            <span id="cameraQualityValue"></span>
        </div>
    </div>

    <!-- Screen Settings Panel -->
    <div class="settings-panel" data-panel="screen">
        <div class="settings-group">
            <label for="screenFps">Screen FPS (1-10)</label>
            <input type="range" id="screenFps" min="1" max="10" step="1">
            <span id="screenFpsValue"></span>
        </div>
        <div class="settings-group">
            <label for="screenQuality">Screen Quality (0.1-1)</label>
            <input type="range" id="screenQuality" min="0.1" max="1" step="0.1">
            <span id="screenQualityValue"></span>
        </div>
        <div class="settings-group">
            <label for="resizeWidth">Resize Width (640-1920)</label>
            <input type="range" id="resizeWidth" min="640" max="1920" step="80">
            <span id="resizeWidthValue"></span>
        </div>
    </div>

    <!-- System Prompt Panel -->
    <div class="settings-panel" data-panel="prompt">
        <div class="settings-group">
            <label for="systemInstructions">System Instructions</label>
            <textarea id="systemInstructions" rows="8" placeholder="Enter system instructions"></textarea>
        </div>
    </div>

    <!-- Advanced Settings Panel -->
    <div class="settings-panel" data-panel="advanced">
        <div class="settings-group">
            <label for="temperature">Temperature (0-2)</label>
            <input type="range" id="temperature" min="0" max="2" step="0.1">
            <span id="temperatureValue"></span>
        </div>
        <div class="settings-group">
            <label for="topP">Top P (0-1)</label>
            <input type="range" id="topP" min="0" max="1" step="0.05">
            <span id="topPValue"></span>
        </div>
        <div class="settings-group">
            <label for="topK">Top K (1-100)</label>
            <input type="range" id="topK" min="1" max="100" step="1">
            <span id="topKValue"></span>
        </div>
    </div>

    <!-- Safety Settings Panel -->
    <div class="settings-panel" data-panel="safety">
        <div class="settings-group">
            <label for="harassmentThreshold">Harassment (0-3)</label>
            <input type="range" id="harassmentThreshold" min="0" max="3" step="1">
            <span id="harassmentValue"></span>
        </div>
        <div class="settings-group">
            <label for="dangerousContentThreshold">Dangerous Content (0-3)</label>
            <input type="range" id="dangerousContentThreshold" min="0" max="3" step="1">
            <span id="dangerousValue"></span>
        </div>
        <div class="settings-group">
            <label for="sexuallyExplicitThreshold">Sexually Explicit (0-3)</label>
            <input type="range" id="sexuallyExplicitThreshold" min="0" max="3" step="1">
            <span id="sexualValue"></span>
        </div>
        <div class="settings-group">
            <label for="civicIntegrityThreshold">Civic Integrity (0-3)</label>
            <input type="range" id="civicIntegrityThreshold" min="0" max="3" step="1">
            <span id="civicValue"></span>
        </div>
    </div>
</div>

<button id="settingsSaveBtn" class="settings-save-btn">Save Settings</button>`;
