<script setup>
const isDark = ref(false)
const activeTab = ref('downloader')

onMounted(() => {
  // Detect system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
  }
})

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <div class="apple-theme" :class="{ 'dark': isDark }">
    <div class="apple-app-container">
      <!-- Top header bar for tools -->
      <header class="apple-header">
        <a href="/" class="icon-btn" aria-label="Home">
          <span class="icon-mask logo-icon"/>
        </a>
        <button class="icon-btn" aria-label="Toggle theme" @click="toggleTheme">
          <!-- Sun Icon (for Dark mode) -->
          <Icon v-if="isDark" name="lucide:sun" size="20" />
          <!-- Moon Icon (for Light mode) -->
          <Icon v-else name="lucide:moon" size="20" />
        </button>
      </header>

      <main class="apple-main">
        <!-- Main Apple-style Card -->
        <div class="apple-card">
          <div class="card-header">
            <h1 class="app-title">Radio Downloader</h1>
            <p class="app-subtitle">Download radio program streams and record tab audio with ease</p>
          </div>

          <!-- Segmented Tab Control -->
          <div class="segmented-control">
            <button 
              class="segment-button" 
              :class="{ 'active': activeTab === 'downloader' }"
              @click="activeTab = 'downloader'"
            >
              <Icon name="lucide:download" size="18" class="tab-icon" />
              Downloader
            </button>
            <button 
              class="segment-button" 
              :class="{ 'active': activeTab === 'recorder' }"
              @click="activeTab = 'recorder'"
            >
              <Icon name="lucide:mic" size="18" class="tab-icon" />
              Web Recorder
            </button>
          </div>

          <!-- Content Panels using v-show to preserve recorder state -->
          <div class="card-body">
            <AudioDownloader v-show="activeTab === 'downloader'" />
            <WebAudioRecorder v-show="activeTab === 'recorder'" />
          </div>
        </div>
      </main>

      <footer class="apple-footer">
        <p>
          © 2024 Joseph Lee • 
          <a href="https://github.com/cgjosephlee/radio-downloader" target="_blank" rel="noopener noreferrer" class="footer-link">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  </div>
</template>

<style>
/* Global style reset & variables */
:root {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
}

/* Global Shared Apple UI Components */
.apple-theme .apple-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
  box-sizing: border-box;
}

.apple-theme .apple-btn.primary {
  background: var(--accent-color);
  color: #ffffff;
}

.apple-theme .apple-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.apple-theme .apple-btn.primary:active:not(:disabled) {
  transform: translateY(0);
}

.apple-theme .apple-btn.success {
  background: var(--success-color);
  color: #ffffff;
}

.apple-theme .apple-btn.success:hover:not(:disabled) {
  background: var(--success-hover);
  transform: translateY(-1px);
}

.apple-theme .apple-btn.success:active:not(:disabled) {
  transform: translateY(0);
}

.apple-theme .apple-btn.secondary {
  background: var(--button-secondary-bg);
  color: var(--button-secondary-text);
  border: 1px solid var(--card-border);
}

.apple-theme .apple-btn.secondary:hover:not(:disabled) {
  background: var(--button-secondary-hover);
  transform: translateY(-1px);
}

.apple-theme .apple-btn.secondary:active:not(:disabled) {
  transform: translateY(0);
}

.apple-theme .apple-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apple-theme .apple-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 0.95rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
  border-radius: 12px;
  outline: none;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-sizing: border-box;
}

.apple-theme .apple-input:focus {
  background: var(--tab-active-bg);
  border-color: var(--input-focus);
  box-shadow: 0 0 0 4px var(--focus-ring);
}

/* CSS Native Loading Spinner */
.apple-theme .spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.apple-theme .apple-btn.secondary .spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--text-primary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<style scoped>
.apple-theme {
  --bg-gradient: linear-gradient(135deg, #e5e5ea 0%, #f5f5f7 50%, #d1d1d6 100%);
  --card-bg: rgba(255, 255, 255, 0.65);
  --card-border: rgba(0, 0, 0, 0.06);
  --card-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --accent-color: #0071e3;
  --accent-hover: #0077ed;
  --input-bg: rgba(0, 0, 0, 0.03);
  --input-border: rgba(0, 0, 0, 0.08);
  --input-focus: #0071e3;
  --button-secondary-bg: rgba(0, 0, 0, 0.05);
  --button-secondary-text: #1d1d1f;
  --button-secondary-hover: rgba(0, 0, 0, 0.08);
  --danger-color: #ff3b30;
  --danger-hover: #ff453a;
  --success-color: #34c759;
  --success-hover: #30d158;
  --tab-bg: rgba(0, 0, 0, 0.05);
  --tab-active-bg: #ffffff;
  --tab-active-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --card-divider: rgba(0, 0, 0, 0.06);
  --link-color: #0071e3;
  --focus-ring: rgba(0, 113, 227, 0.3);
}

.apple-theme.dark {
  --bg-gradient: linear-gradient(135deg, #0b0b0c 0%, #121214 50%, #1c1c1e 100%);
  --card-bg: rgba(28, 28, 30, 0.65);
  --card-border: rgba(255, 255, 255, 0.06);
  --card-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  --text-primary: #f5f5f7;
  --text-secondary: #86868b;
  --accent-color: #2997ff;
  --accent-hover: #47a6ff;
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-border: rgba(255, 255, 255, 0.1);
  --input-focus: #2997ff;
  --button-secondary-bg: rgba(255, 255, 255, 0.08);
  --button-secondary-text: #f5f5f7;
  --button-secondary-hover: rgba(255, 255, 255, 0.12);
  --danger-color: #ff453a;
  --danger-hover: #ff5247;
  --success-color: #30d158;
  --success-hover: #32de65;
  --tab-bg: rgba(255, 255, 255, 0.06);
  --tab-active-bg: rgba(255, 255, 255, 0.15);
  --tab-active-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  --card-divider: rgba(255, 255, 255, 0.08);
  --link-color: #2997ff;
  --focus-ring: rgba(41, 151, 255, 0.4);
}

.apple-app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-gradient);
  color: var(--text-primary);
  transition: background 0.4s ease, color 0.3s ease;
  padding: 0 16px;
}

.apple-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 0 12px;
}

.icon-btn {
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  color: var(--text-primary);
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-btn:hover {
  background: var(--button-secondary-hover);
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.95);
}

.apple-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 0 60px;
}

.apple-card {
  max-width: 900px;
  width: 100%;
  background: var(--card-bg);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid var(--card-border);
  border-radius: 24px;
  box-shadow: var(--card-shadow);
  padding: 40px;
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

@media (max-width: 600px) {
  .apple-card {
    padding: 20px 16px;
    border-radius: 18px;
  }
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-title {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.app-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Segmented Control (Apple Tabs) */
.segmented-control {
  display: flex;
  background: var(--tab-bg);
  padding: 4px;
  border-radius: 12px;
  margin: 0 auto 36px;
  max-width: 320px;
  width: 100%;
  border: 1px solid var(--card-border);
}

.segment-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  outline: none;
}

.segment-button.active {
  background: var(--tab-active-bg);
  color: var(--text-primary);
  box-shadow: var(--tab-active-shadow);
}

.tab-icon {
  opacity: 0.7;
}

.segment-button.active .tab-icon {
  color: var(--accent-color);
  opacity: 1;
}

.card-body {
  min-height: 200px;
}

.apple-footer {
  text-align: center;
  padding: 24px 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.footer-link {
  color: var(--link-color);
  text-decoration: none;
  font-weight: 500;
}

.footer-link:hover {
  text-decoration: underline;
}

/* Icon Masks */
.icon-mask {
  background-color: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  display: inline-block;
}

.logo-icon {
  width: 22px;
  height: 22px;
  mask-image: url('/logo.svg');
  -webkit-mask-image: url('/logo.svg');
}

</style>

