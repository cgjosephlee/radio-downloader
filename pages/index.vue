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

// Web Audio Recorder variables
const isRecording = ref(false)
const recordingScheduled = ref(false)
const scheduleStart = ref('')
const scheduleEnd = ref('')
const recordingStatus = ref('')

let mediaStream = null
let mediaRecorder = null
let audioChunks = []
let scheduleTimeout = null
let stopTimeout = null

onMounted(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  scheduleStart.value = now.toISOString().slice(0, 16)
  
  const end = new Date(now.getTime() + 60 * 60 * 1000)
  scheduleEnd.value = end.toISOString().slice(0, 16)
})

function stopAllTracks() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }
}

function downloadRecording(blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  a.href = url
  a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
    
    const audioTracks = mediaStream.getAudioTracks()
    if (audioTracks.length === 0) {
      throw new Error('No audio track found. Please make sure to check "Share audio".')
    }

    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' })
    audioChunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      downloadRecording(blob)
      stopAllTracks()
      isRecording.value = false
      recordingStatus.value = ''
    }
    
    mediaRecorder.start()
    isRecording.value = true
    recordingStatus.value = 'Recording...'
    
  } catch (error) {
    console.error('Recording failed:', error)
    alert(error.message)
    stopAllTracks()
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  } else {
    stopAllTracks()
  }
  isRecording.value = false
  recordingScheduled.value = false
  recordingStatus.value = ''
  clearTimeout(scheduleTimeout)
  clearTimeout(stopTimeout)
}

async function scheduleRecording() {
  const start = new Date(scheduleStart.value).getTime()
  const end = new Date(scheduleEnd.value).getTime()
  const now = Date.now()
  
  if (end <= start) {
    alert('End time must be after start time.')
    return
  }
  
  if (end <= now) {
    alert('End time must be in the future.')
    return
  }
  
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    })
    
    const audioTracks = mediaStream.getAudioTracks()
    if (audioTracks.length === 0) {
      throw new Error('No audio track found. Please make sure to check "Share audio".')
    }

    recordingScheduled.value = true
    recordingStatus.value = 'Scheduled...'
    
    const timeUntilStart = Math.max(0, start - now)
    const timeUntilEnd = end - now
    
    scheduleTimeout = setTimeout(() => {
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' })
      audioChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        downloadRecording(blob)
        stopAllTracks()
        isRecording.value = false
        recordingScheduled.value = false
        recordingStatus.value = ''
      }
      
      mediaRecorder.start()
      isRecording.value = true
      recordingScheduled.value = false
      recordingStatus.value = 'Recording...'
      
    }, timeUntilStart)
    
    stopTimeout = setTimeout(() => {
      stopRecording()
    }, timeUntilEnd)
    
  } catch (error) {
    console.error('Failed to schedule recording:', error)
    alert(error.message)
    stopAllTracks()
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

        <!-- Web Audio Recorder Section -->
        <v-divider class="my-10" />
        <v-row justify="center">
          <v-col cols="auto">
            <div class="text-h4">Web Audio Recorder</div>
            <div class="text-subtitle-1 text-center text-medium-emphasis">Record audio from any tab (WebM)</div>
          </v-col>
        </v-row>
        
        <v-row justify="center" align="center" class="mt-4">
          <v-col cols="auto">
            <v-text-field
              v-model="scheduleStart"
              type="datetime-local"
              label="Start Time"
              density="compact"
              width="250px"
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model="scheduleEnd"
              type="datetime-local"
              label="End Time"
              density="compact"
              width="250px"
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="info"
              :disabled="isRecording || recordingScheduled"
              @click="scheduleRecording"
            >
              Schedule
            </v-btn>
          </v-col>
        </v-row>
        
        <v-row justify="center" class="mt-4">
          <v-col cols="auto">
            <v-btn
              class="mr-4"
              color="error"
              :disabled="isRecording || recordingScheduled"
              @click="startRecording"
            >
              Record Now
            </v-btn>
            <v-btn
              color="secondary"
              :disabled="!isRecording && !recordingScheduled"
              @click="stopRecording"
            >
              Stop
            </v-btn>
          </v-col>
        </v-row>
        
        <v-row v-if="recordingStatus" justify="center" class="mt-4">
          <v-col cols="auto">
            <v-chip :color="isRecording ? 'error' : 'info'" variant="flat">
              {{ recordingStatus }}
            </v-chip>
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
