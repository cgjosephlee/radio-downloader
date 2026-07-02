<script setup>
import fixWebmDuration from 'fix-webm-duration'

const isRecording = ref(false)
const recordingScheduled = ref(false)
const scheduleStart = ref('')
const scheduleEnd = ref('')
const recordingStatus = ref('')
const recordedBlobUrl = ref('')
const recordedFileName = ref('')
const formattedDuration = ref('00:00')

let mediaStream = null
let mediaRecorder = null
let audioChunks = []
let recordedBlob = null
let scheduleTimeout = null
let stopTimeout = null
let startTime = 0
let durationInterval = null

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
    mediaStream = null
  }
}

function getBestMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('[Recorder] Using MIME type:', type)
      return type
    }
  }
  console.warn('[Recorder] WebM MIME type not supported, using browser default')
  return ''
}

function makeFileName(ext) {
  return `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`
}

async function finishRecording() {
  console.log('[Recorder] onstop fired, chunks:', audioChunks.length)
  clearInterval(durationInterval)

  const mimeType = (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm'
  let blob = new Blob(audioChunks, { type: mimeType })
  console.log('[Recorder] Original Blob created, size:', blob.size, 'type:', blob.type)

  if (blob.size === 0) {
    console.error('[Recorder] Empty blob — no audio data captured')
    recordingStatus.value = 'Error: No audio data captured.'
    stopAllTracks()
    isRecording.value = false
    recordingScheduled.value = false
    return
  }

  const duration = Date.now() - startTime
  formattedDuration.value = formatDuration(duration)

  // Fix WebM duration if it's webm
  if (blob.type.includes('webm')) {
    console.log('[Recorder] Fixing webm duration:', duration, 'ms')
    try {
      blob = await fixWebmDuration(blob, duration)
      console.log('[Recorder] Fixed blob created, size:', blob.size)
    } catch (err) {
      console.error('[Recorder] Failed to fix webm duration:', err)
    }
  }

  // Clean up old recording
  if (recordedBlobUrl.value) {
    URL.revokeObjectURL(recordedBlobUrl.value)
  }

  const fileName = makeFileName('webm')

  recordedBlob = blob
  recordedBlobUrl.value = URL.createObjectURL(blob)
  recordedFileName.value = fileName

  stopAllTracks()
  isRecording.value = false
  recordingScheduled.value = false
  recordingStatus.value = `Recording complete. Total duration: ${formattedDuration.value}.`
}

async function saveRecording() {
  if (!recordedBlob) return

  // Use File System Access API (showSaveFilePicker) — gives a proper Save As dialog
  if (window.showSaveFilePicker) {
    try {
      // showSaveFilePicker requires base MIME type without codec params
      // e.g. 'audio/webm' not 'audio/webm;codecs=opus'
      const baseMimeType = recordedBlob.type.split(';')[0]
      const handle = await window.showSaveFilePicker({
        suggestedName: recordedFileName.value,
        types: [
          {
            description: 'Audio file',
            accept: { [baseMimeType]: ['.webm'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(recordedBlob)
      await writable.close()
      console.log('[Recorder] File saved via showSaveFilePicker')
      recordingStatus.value = 'File saved!'
      return
    } catch (err) {
      // User cancelled the dialog — that's fine
      if (err.name === 'AbortError') return
      console.warn('[Recorder] showSaveFilePicker failed:', err)
    }
  }

  // Fallback: this shouldn't normally be reached in Chrome
  console.warn('[Recorder] showSaveFilePicker not available')
}

function clearRecording() {
  if (recordedBlobUrl.value) {
    URL.revokeObjectURL(recordedBlobUrl.value)
    recordedBlobUrl.value = ''
    recordedFileName.value = ''
    recordedBlob = null
    recordingStatus.value = ''
  }
}

function setupMediaRecorder(audioTracks) {
  const audioStream = new MediaStream(audioTracks)
  const mimeType = getBestMimeType()
  const options = mimeType ? { mimeType } : undefined
  mediaRecorder = new MediaRecorder(audioStream, options)
  audioChunks = []

  console.log('[Recorder] MediaRecorder created, mimeType:', mediaRecorder.mimeType)

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data)
    }
  }

  mediaRecorder.onstop = finishRecording

  mediaRecorder.onerror = (event) => {
    console.error('[Recorder] MediaRecorder error:', event.error)
    clearInterval(durationInterval)
    recordingStatus.value = `Error: ${event.error?.message || 'Unknown error'}`
    stopAllTracks()
    isRecording.value = false
    recordingScheduled.value = false
  }
}

async function startRecording() {
  try {
    clearRecording()
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    const audioTracks = mediaStream.getAudioTracks()
    console.log('[Recorder] Audio tracks:', audioTracks.length)
    if (audioTracks.length === 0) {
      throw new Error('No audio track found. Please make sure to check "Share audio".')
    }

    // Stop video tracks — we only need audio
    mediaStream.getVideoTracks().forEach((track) => {
      console.log('[Recorder] Stopping video track:', track.label)
      track.stop()
    })

    setupMediaRecorder(audioTracks)
    mediaRecorder.start(1000)
    startTime = Date.now()
    formattedDuration.value = '00:00'
    isRecording.value = true
    recordingStatus.value = 'Recording... (00:00)'
    console.log('[Recorder] Recording started')

    clearInterval(durationInterval)
    durationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      formattedDuration.value = formatDuration(elapsed)
      recordingStatus.value = `Recording... (${formattedDuration.value})`
    }, 500)
  } catch (error) {
    console.error('[Recorder] startRecording failed:', error)
    alert(error.message)
    stopAllTracks()
  }
}

function stopRecording() {
  console.log('[Recorder] stopRecording called, state:', mediaRecorder?.state)
  clearTimeout(scheduleTimeout)
  clearTimeout(stopTimeout)
  clearInterval(durationInterval)

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  } else {
    stopAllTracks()
    isRecording.value = false
    recordingScheduled.value = false
    recordingStatus.value = ''
  }
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
    clearRecording()
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })

    const audioTracks = mediaStream.getAudioTracks()
    if (audioTracks.length === 0) {
      throw new Error('No audio track found. Please make sure to check "Share audio".')
    }

    recordingScheduled.value = true
    recordingStatus.value = 'Scheduled...'

    const timeUntilStart = Math.max(0, start - now)
    const timeUntilEnd = end - now
    console.log('[Recorder] Scheduled: start in', timeUntilStart, 'ms, end in', timeUntilEnd, 'ms')

    scheduleTimeout = setTimeout(() => {
      try {
        if (audioTracks.some((t) => t.readyState === 'ended')) {
          throw new Error('Screen sharing was stopped before recording could start.')
        }

        mediaStream.getVideoTracks().forEach((track) => track.stop())

        setupMediaRecorder(audioTracks)
        mediaRecorder.start(1000)
        startTime = Date.now()
        formattedDuration.value = '00:00'
        isRecording.value = true
        recordingScheduled.value = false
        recordingStatus.value = 'Recording... (00:00)'
        console.log('[Recorder] Scheduled recording started')

        clearInterval(durationInterval)
        durationInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          formattedDuration.value = formatDuration(elapsed)
          recordingStatus.value = `Recording... (${formattedDuration.value})`
        }, 500)
      } catch (err) {
        console.error('[Recorder] Scheduled recording failed:', err)
        alert(err.message)
        stopAllTracks()
        isRecording.value = false
        recordingScheduled.value = false
        recordingStatus.value = ''
      }
    }, timeUntilStart)

    stopTimeout = setTimeout(() => {
      console.log('[Recorder] Scheduled stop triggered')
      stopRecording()
    }, timeUntilEnd)
  } catch (error) {
    console.error('[Recorder] Failed to schedule recording:', error)
    alert(error.message)
    stopAllTracks()
  }
}
</script>

<template>
  <div>
    <!-- Web Audio Recorder Section -->
    <v-divider class="my-10" />
    <v-row justify="center">
      <v-col cols="auto">
        <div class="text-h4">Web Audio Recorder</div>
        <div class="text-subtitle-1 text-center text-medium-emphasis">Record audio from any tab</div>
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

    <v-row v-if="recordedBlobUrl" justify="center" class="mt-4">
      <v-col cols="auto">
        <v-btn class="mr-4" color="success" @click="saveRecording">
          Save Recording
        </v-btn>
        <v-btn color="secondary" variant="outlined" @click="clearRecording">
          Clear
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="recordedBlobUrl" justify="center" class="mt-2">
      <v-col cols="auto" class="text-center">
        <div class="text-caption text-medium-emphasis">{{ recordedFileName }}</div>
      </v-col>
    </v-row>
  </div>
</template>
