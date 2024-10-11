<script setup>
import { ref } from 'vue'
import { getAudioLinks } from './getAudioLinks'
import { concatAndDownloadAudio } from './concatAudio'

const url = ref('')
const audioLinks = ref([])
const errorMessage = ref('')
const dlRangeStart = ref(1)
const dlRangeEnd = ref(350)
const isLoading = ref(false)
const isDownloading = ref(false)

async function fetchAudioLinks() {
  isLoading.value = true;
  try {
    errorMessage.value = '';
    audioLinks.value = await getAudioLinks(url.value);
  } catch (error) {
    errorMessage.value = error.message;
    audioLinks.value = [];
  } finally {
    isLoading.value = false;
  }
}

function clearInput() {
  url.value = '';
  audioLinks.value = [];
  errorMessage.value = '';
}

async function downloadMultipleAudio() {
  isDownloading.value = true;
  try {
    const start = parseInt(dlRangeStart.value);
    const end = parseInt(dlRangeEnd.value);
    const links = audioLinks.value.slice(start - 1, end);
    await concatAndDownloadAudio(links);
  } catch (error) {
    console.error('Download error:', error);
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <header>
    <div>Radio Downloader</div>
  </header>

  <main>
    <section>
      <h2>Supported Sites</h2>
      <ul>
        <li><a href="https://www.voh.com.tw" target="_blank">漢聲廣播電臺</a></li>
        <li><a href="https://www.ner.gov.tw" target="_blank">國立教育廣播電臺</a></li>
        <li><a href="https://tradio.gov.taipei" target="_blank">聽台北 Tradio</a></li>
      </ul>
    </section>
    <div style="height: 2rem"></div>
    <div class="input-container">
      <input v-model="url" placeholder="Enter URL" class="url-input" />
      <div class="button-group">
        <button @click="fetchAudioLinks" class="btn" :disabled="isLoading">
          <span v-if="isLoading" class="loader"></span>
          <span v-else>Get</span>
        </button>
        <button @click="clearInput" class="btn">Clear</button>
      </div>
    </div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    <ul v-if="audioLinks.length" class="audio-list">
      <li v-for="link in audioLinks.slice(0, 5)" :key="link">
        <a :href="link" target="_blank">{{ link }}</a>
      </li>
    </ul>
    <div v-if="audioLinks.length > 1">
      <div style="height: 1rem"></div>
      <div style="display: flex; gap: 1rem">
        <input v-model="dlRangeStart" type="number" min="1" max="350" />
        <input v-model="dlRangeEnd" type="number" min="1" max="350" />
        <button @click="downloadMultipleAudio" class="btn" :disabled="isDownloading">
          <span v-if="isDownloading" class="loader"></span>
          <span v-else>Download</span>
        </button>
      </div>
    </div>
  </main>

  <footer>
    <p>© 2024 Joseph Lee, <a href="https://github.com/cgjosephlee/">GitHub</a></p>
  </footer>
</template>

<style scoped>
header {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1.5;
  text-align: center;
  padding: 1rem 0;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.url-input {
  width: 200%;
  max-width: 600px;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: var(--color-primary-dark);
}

.btn:disabled {
  background-color: var(--color-primary-light);
  cursor: not-allowed;
}

.loader {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  color: var(--color-error);
  margin-top: 1rem;
}

.audio-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.audio-list li {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

footer {
  text-align: center;
  padding: 1rem 0;
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

footer a {
  color: var(--color-link);
  text-decoration: none;
}

footer a:hover {
  text-decoration: underline;
}
</style>
