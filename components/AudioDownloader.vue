<script setup>
const url = ref('')
const audioLinks = ref([])
const errorMessage = ref('')
const dlRangeStart = ref(1)
const dlRangeEnd = ref(350)
const isLoading = ref(false)
const isDownloading = ref(false)

async function fetchAudioLinks() {
  isLoading.value = true
  try {
    errorMessage.value = ''
    audioLinks.value = await getAudioLinks(url.value)
  } catch (error) {
    errorMessage.value = error.message
    audioLinks.value = []
  } finally {
    isLoading.value = false
  }
}

function clearInput() {
  url.value = ''
  audioLinks.value = []
  errorMessage.value = ''
}

async function downloadMultipleAudio() {
  isDownloading.value = true
  try {
    const start = parseInt(dlRangeStart.value)
    const end = parseInt(dlRangeEnd.value)
    const links = audioLinks.value.slice(start - 1, end)
    await concatAndDownloadAudio(links)
  } catch (error) {
    console.error('Download error:', error)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="downloader-container">
    <!-- Supported Sites Section -->
    <div class="section-title">Supported Sites</div>
    <div class="sites-grid">
      <a 
        href="https://www.voh.com.tw" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="site-card"
      >
        <span class="site-status-dot"/>
        <div class="site-info">
          <div class="site-name">漢聲廣播電臺</div>
          <div class="site-url">voh.com.tw</div>
        </div>
        <Icon name="lucide:chevron-right" size="16" class="site-arrow" />
      </a>

      <a 
        href="https://www.ner.gov.tw" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="site-card"
      >
        <span class="site-status-dot"/>
        <div class="site-info">
          <div class="site-name">國立教育廣播電臺</div>
          <div class="site-url">ner.gov.tw</div>
        </div>
        <Icon name="lucide:chevron-right" size="16" class="site-arrow" />
      </a>

      <a 
        href="https://tradio.gov.taipei" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="site-card"
      >
        <span class="site-status-dot"/>
        <div class="site-info">
          <div class="site-name">聽台北 Tradio</div>
          <div class="site-url">tradio.gov.taipei</div>
        </div>
        <Icon name="lucide:chevron-right" size="16" class="site-arrow" />
      </a>
    </div>

    <!-- URL Input Section -->
    <div class="input-section">
      <div class="input-wrapper">
        <span class="input-icon">
          <Icon name="lucide:link" size="20" />
        </span>
        <input 
          v-model="url" 
          type="text" 
          placeholder="Paste program URL here (e.g. https://...)" 
          class="apple-input"
          @keyup.enter="fetchAudioLinks"
        >
        <button 
          v-if="url" 
          class="clear-input-btn" 
          aria-label="Clear input"
          @click="clearInput"
        >
          <Icon name="lucide:x" size="16" />
        </button>
      </div>

      <div class="action-buttons">
        <button 
          class="apple-btn primary" 
          :disabled="isLoading || !url" 
          @click="fetchAudioLinks"
        >
          <span v-if="isLoading" class="spinner"/>
          <span v-else>Get Links</span>
        </button>
        <button 
          class="apple-btn secondary" 
          @click="clearInput"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Error Alert Box -->
    <div v-if="errorMessage" class="error-alert">
      <Icon name="lucide:alert-circle" size="20" class="alert-icon" />
      <div class="alert-content">
        <div class="alert-title">Unable to fetch links</div>
        <div class="alert-message">{{ errorMessage }}</div>
      </div>
      <button class="alert-close" @click="errorMessage = ''">
        <Icon name="lucide:x" size="14" />
      </button>
    </div>

    <!-- Found Audio Links Preview -->
    <div v-if="audioLinks.length" class="results-section">
      <div class="section-title">Fetched Streams (Total: {{ audioLinks.length }})</div>
      <div class="links-preview-card">
        <div class="preview-header">
          <span class="preview-badge">Preview</span>
          <span class="preview-description">Showing first 5 sample streams</span>
        </div>
        <ul class="links-list">
          <li v-for="(link, idx) in audioLinks.slice(0, 5)" :key="idx" class="link-item">
            <span class="link-index">{{ idx + 1 }}</span>
            <a :href="link" target="_blank" class="link-url">{{ link }}</a>
            <Icon name="lucide:external-link" size="14" class="link-external" />
          </li>
        </ul>
      </div>

      <!-- Batch Download Range Settings -->
      <div v-if="audioLinks.length > 1" class="batch-download-card">
        <div class="batch-title">
          <Icon name="lucide:download" size="20" class="batch-icon" />
          Batch Concatenation & Download
        </div>
        <p class="batch-subtitle">Select the segment range to concatenate and download as a single MP3 file.</p>
        
        <div class="batch-form">
          <div class="range-inputs">
            <div class="input-group">
              <label class="input-label">Start Segment</label>
              <input 
                v-model="dlRangeStart" 
                type="number" 
                min="1" 
                :max="audioLinks.length" 
                class="apple-input small"
              >
            </div>
            <div class="range-divider">to</div>
            <div class="input-group">
              <label class="input-label">End Segment</label>
              <input 
                v-model="dlRangeEnd" 
                type="number" 
                min="1" 
                :max="audioLinks.length" 
                class="apple-input small"
              >
            </div>
          </div>
          
          <button 
            class="apple-btn primary download-btn" 
            :disabled="isDownloading" 
            @click="downloadMultipleAudio"
          >
            <span v-if="isDownloading" class="spinner"/>
            <span v-else>Download Concatenated MP3</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.downloader-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

/* Supported Sites Grid */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.site-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.site-card:hover {
  transform: translateY(-2px);
  background: var(--button-secondary-hover);
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.site-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--success-color);
  margin-right: 12px;
  box-shadow: 0 0 8px var(--success-color);
}

.site-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.site-name {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.site-url {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.site-arrow {
  color: var(--text-secondary);
  opacity: 0.5;
  transition: transform 0.2s ease;
}

.site-card:hover .site-arrow {
  opacity: 1;
  transform: translateX(2px);
  color: var(--accent-color);
}

/* URL Input Section */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: var(--text-secondary);
  opacity: 0.8;
  display: flex;
  align-items: center;
}

.input-wrapper .apple-input {
  padding-left: 48px;
}

.clear-input-btn {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 0.6;
}

.clear-input-btn:hover {
  opacity: 1;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* Error Alert Box */
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 59, 48, 0.08);
  border: 1px solid rgba(255, 59, 48, 0.15);
  border-radius: 12px;
  color: var(--danger-color);
  position: relative;
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.alert-message {
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 2px;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

/* Results section */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.links-preview-card {
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 18px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--accent-color);
  color: white;
  padding: 2px 8px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.preview-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.links-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-bg);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  font-size: 0.85rem;
}

.link-index {
  color: var(--text-secondary);
  font-weight: 600;
  width: 16px;
}

.link-url {
  flex: 1;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-url:hover {
  color: var(--accent-color);
  text-decoration: underline;
}

.link-external {
  color: var(--text-secondary);
  opacity: 0.6;
}

/* Batch Concatenate Box */
.batch-download-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.batch-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}

.batch-icon {
  color: var(--accent-color);
}

.batch-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.batch-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.range-inputs {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.apple-input.small {
  padding: 10px 12px;
  font-size: 0.9rem;
  text-align: center;
  border-radius: 8px;
}

.range-divider {
  padding-bottom: 10px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.download-btn {
  width: 100%;
}

/* CSS Native Loading Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.secondary .spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--text-primary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

