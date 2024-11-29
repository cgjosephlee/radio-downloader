<script setup>
const url = ref('')
const audioLinks = ref([])
// const audioLinks = ref(Array(10).fill('https://www.voh.com.tw/audio/2022/03/20220325_1.mp3'))
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
  <v-main>
    <v-container
      class="d-flex flex-column justify-space-between"
      max-width="960px"
      min-height="100vh"
    >
      <v-container>
        <v-row justify="center">
          <v-col cols="auto">
            <div class="text-h3">Radio Downloader</div>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <div class="text-h4">Supported Sites</div>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-list
              :items="[
                {
                  title: '漢聲廣播電臺',
                  props: { href: 'https://www.voh.com.tw', 'prepend-icon': 'mdi-check-circle' }
                },
                {
                  title: '國立教育廣播電臺',
                  props: { href: 'https://www.ner.gov.tw', 'prepend-icon': 'mdi-check-circle' }
                },
                {
                  title: '聽台北 Tradio',
                  props: { href: 'https://tradio.gov.taipei', 'prepend-icon': 'mdi-check-circle' }
                }
              ]"
              density="compact"
            />
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-text-field
              v-model="url"
              label="URL"
              placeholder="https://..."
              outlined
              dense
              width="400px"
            />
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="auto">
            <v-btn class="mr-4" color="primary" :loading="isLoading" @click="fetchAudioLinks">
              Get
            </v-btn>
            <v-btn class="mr-4" color="secondary" @click="clearInput">Clear</v-btn>
          </v-col>
        </v-row>
        <v-row v-if="errorMessage" justify="center">
          <v-col>
            <v-alert type="error" dismissible>
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>
        <v-row v-if="audioLinks.length" justify="center">
          <v-col cols="auto">
            <v-list
              :items="audioLinks.slice(0, 5).map((i) => ({ title: i, props: { href: i } }))"
            />
          </v-col>
        </v-row>
        <v-row v-if="audioLinks.length > 1" class="mt-4" justify="center" align="start">
          <v-col cols="auto">
            <v-text-field
              v-model="dlRangeStart"
              type="number"
              label="Start"
              min="1"
              max="350"
              density="compact"
            />
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model="dlRangeEnd"
              type="number"
              label="End"
              min="1"
              max="350"
              density="compact"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn :loading="isDownloading" color="primary" @click="downloadMultipleAudio">
              Download
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <v-row justify="center">
          <v-col cols="auto" class="text-center">
            <p>
              © 2024 Joseph Lee,
              <a href="https://github.com/cgjosephlee/radio-downloader">GitHub</a>
            </p>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </v-main>
</template>

<style scoped></style>
