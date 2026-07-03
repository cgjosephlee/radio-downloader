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
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `recording-${year}-${month}-${date}T${hours}-${minutes}-${seconds}.${ext}`
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
  recordingStatus.value = 'Recording complete.'
}

async function saveRecording() {
  if (!recordedBlob) return

  // Use File System Access API (showSaveFilePicker) — gives a proper Save As dialog
  // if (window.showSaveFilePicker) {
  //   try {
  //     // showSaveFilePicker requires base MIME type without codec params
  //     // e.g. 'audio/webm' not 'audio/webm;codecs=opus'
  //     const baseMimeType = recordedBlob.type.split(';')[0]
  //     const handle = await window.showSaveFilePicker({
  //       suggestedName: recordedFileName.value,
  //       types: [
  //         {
  //           description: 'Audio file',
  //           accept: { [baseMimeType]: ['.webm'] },
  //         },
  //       ],
  //     })
  //     const writable = await handle.createWritable()
  //     await writable.write(recordedBlob)
  //     await writable.close()
  //     console.log('[Recorder] File saved via showSaveFilePicker')
  //     recordingStatus.value = 'File saved!'
  //     return
  //   } catch (err) {
  //     // User cancelled the dialog — that's fine
  //     if (err.name === 'AbortError') return
  //     console.warn('[Recorder] showSaveFilePicker failed:', err)
  //   }
  // }

  // Fallback: native download method for unsupported browsers
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = recordedBlobUrl.value
  a.download = recordedFileName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  console.log('[Recorder] File saved via native download fallback')
  recordingStatus.value = 'File saved!'
}

function clearRecording() {
  if (recordedBlobUrl.value) {
    URL.revokeObjectURL(recordedBlobUrl.value)
  }
  recordedBlobUrl.value = ''
  recordedFileName.value = ''
  recordedBlob = null
  recordingStatus.value = ''
  formattedDuration.value = '00:00'
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
    recordingStatus.value = 'Recording...'
    console.log('[Recorder] Recording started')

    clearInterval(durationInterval)
    durationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      formattedDuration.value = formatDuration(elapsed)
      recordingStatus.value = 'Recording...'
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
        recordingStatus.value = 'Recording...'
        console.log('[Recorder] Scheduled recording started')

        clearInterval(durationInterval)
        durationInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          formattedDuration.value = formatDuration(elapsed)
          recordingStatus.value = 'Recording...'
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
  <div class="recorder-container">
    <!-- Schedule Recording Section -->
    <div class="schedule-section">
      <div class="section-title">Schedule Recording</div>
      <p class="section-subtitle">Set a time window to automatically capture system/tab audio.</p>
      
      <div class="schedule-grid">
        <div class="input-group">
          <label class="input-label">Start Time</label>
          <div class="datetime-input-wrapper">
            <Icon name="lucide:calendar" size="16" class="input-icon" />
            <input 
              v-model="scheduleStart" 
              type="datetime-local" 
              class="apple-datetime-input"
            >
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">End Time</label>
          <div class="datetime-input-wrapper">
            <Icon name="lucide:calendar" size="16" class="input-icon" />
            <input 
              v-model="scheduleEnd" 
              type="datetime-local" 
              class="apple-datetime-input"
            >
          </div>
        </div>

        <div class="input-group button-group">
          <label class="input-label">&nbsp;</label>
          <button 
            class="apple-btn secondary schedule-btn" 
            :disabled="isRecording || recordingScheduled"
            @click="scheduleRecording"
          >
            <Icon name="lucide:clock" size="16" />
            Schedule
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="apple-divider"/>

    <!-- Live Recording Controls -->
    <div class="live-record-section">
      <div class="section-title">Manual Capture</div>
      
      <!-- Recording Status Display / Visualizer -->
      <div class="recorder-console" :class="{ 'recording': isRecording }">
        <!-- Siri / Voice Memos Style Waveform -->
        <div class="visualizer-container">
          <div v-if="isRecording" class="voice-wave">
            <span class="bar bar-1"/>
            <span class="bar bar-2"/>
            <span class="bar bar-3"/>
            <span class="bar bar-4"/>
            <span class="bar bar-5"/>
            <span class="bar bar-6"/>
            <span class="bar bar-7"/>
          </div>
          <div v-else class="idle-mic">
            <Icon name="lucide:mic" size="32" />
          </div>
        </div>

        <!-- Duration Indicator -->
        <div class="timer-display">{{ formattedDuration }}</div>
        
        <!-- Interactive Controls -->
        <div class="console-controls">
          <button 
            class="record-trigger-btn" 
            :class="{ 'active': isRecording, 'scheduled': recordingScheduled }"
            :disabled="isRecording || recordingScheduled"
            aria-label="Start recording"
            @click="startRecording"
          >
            <span class="record-inner-circle"/>
          </button>
          
          <button 
            class="stop-trigger-btn" 
            :disabled="!isRecording && !recordingScheduled"
            aria-label="Stop recording"
            @click="stopRecording"
          >
            <span class="stop-inner-square"/>
          </button>
        </div>
      </div>

      <!-- Recording Status Text (iOS Pill) -->
      <div v-if="recordingStatus" class="status-pill-container">
        <span 
          class="status-pill" 
          :class="{ 'recording': isRecording, 'scheduled': recordingScheduled }"
        >
          <span class="status-indicator-dot"/>
          {{ recordingStatus }}
        </span>
      </div>
    </div>

    <!-- Post Recording Outputs -->
    <div v-if="recordedBlobUrl" class="output-section">
      <div class="section-title">Saved Recording</div>
      <div class="output-card">
        <!-- Audio preview player -->
        <div class="audio-player-wrapper">
          <audio :src="recordedBlobUrl" controls class="apple-audio-player"/>
        </div>

        <div class="output-meta">
          <div class="file-name-label">
            <Icon name="lucide:file-audio" size="14" />
            {{ recordedFileName }}
          </div>
        </div>

        <div class="output-actions">
          <button class="apple-btn success" @click="saveRecording">
            <Icon name="lucide:save" size="16" />
            Save File
          </button>
          <button class="apple-btn secondary" @click="clearRecording">
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recorder-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.section-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

/* Schedule Section */
.schedule-grid {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
}

.input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.datetime-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.datetime-input-wrapper .input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
  pointer-events: none;
  opacity: 0.8;
}

.apple-datetime-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  font-size: 0.9rem;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--text-primary);
  border-radius: 10px;
  outline: none;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.apple-datetime-input:focus {
  background: var(--tab-active-bg);
  border-color: var(--input-focus);
  box-shadow: 0 0 0 4px var(--focus-ring);
}

.schedule-btn {
  width: 100%;
}

/* Divider */
.apple-divider {
  height: 1px;
  background: var(--card-divider);
  width: 100%;
}

/* Manual Capture Panel */
.live-record-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.recorder-console {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.recorder-console.recording {
  background: rgba(255, 59, 48, 0.03);
  border-color: rgba(255, 59, 48, 0.2);
  box-shadow: 0 8px 24px rgba(255, 59, 48, 0.05);
}

.visualizer-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.idle-mic {
  color: var(--text-secondary);
  opacity: 0.5;
}

/* Animated Siri/Voice Memo Waveform */
.voice-wave {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
}

.bar {
  width: 3px;
  height: 100%;
  background-color: var(--danger-color);
  border-radius: 2px;
  animation: bounce 1s ease-in-out infinite alternate;
}

.bar-1 { animation-delay: 0.1s; height: 30%; }
.bar-2 { animation-delay: 0.3s; height: 60%; }
.bar-3 { animation-delay: 0.6s; height: 40%; }
.bar-4 { animation-delay: 0.2s; height: 80%; }
.bar-5 { animation-delay: 0.5s; height: 50%; }
.bar-6 { animation-delay: 0.8s; height: 70%; }
.bar-7 { animation-delay: 0.4s; height: 30%; }

@keyframes bounce {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1.1); }
}

.timer-display {
  font-family: -apple-system-monospace, "SF Mono", Menlo, Courier, monospace;
  font-size: 2.2rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.console-controls {
  display: flex;
  align-items: center;
  gap: 28px;
}

/* Voice Memo Style Recording Trigger */
.record-trigger-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--text-primary);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
}

.record-trigger-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.record-trigger-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.record-inner-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--danger-color);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}



.record-trigger-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: var(--text-secondary);
}

.record-trigger-btn:disabled .record-inner-circle {
  background-color: var(--text-secondary);
}

/* Stop Button */
.stop-trigger-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--card-border);
  background: var(--button-secondary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  outline: none;
}

.stop-trigger-btn:hover:not(:disabled) {
  background: var(--button-secondary-hover);
  transform: scale(1.05);
}

.stop-trigger-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.stop-inner-square {
  width: 16px;
  height: 16px;
  background-color: var(--text-primary);
  border-radius: 2px;
  transition: all 0.2s ease;
}

.stop-trigger-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stop-trigger-btn:disabled .stop-inner-square {
  background-color: var(--text-secondary);
}

/* Status Pill */
.status-pill-container {
  display: flex;
  justify-content: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.status-pill.recording {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.2);
  color: var(--danger-color);
}

.status-pill.scheduled {
  background: rgba(0, 113, 227, 0.1);
  border-color: rgba(0, 113, 227, 0.2);
  color: var(--accent-color);
}

.status-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--text-secondary);
}

.recording .status-indicator-dot {
  background-color: var(--danger-color);
  animation: pulse 1s infinite alternate;
}

.scheduled .status-indicator-dot {
  background-color: var(--accent-color);
  animation: pulse 1.5s infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.4; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

/* Post Recording Output Section */
.output-section {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.output-card {
  background: var(--button-secondary-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.audio-player-wrapper {
  width: 100%;
}

.apple-audio-player {
  width: 100%;
  height: 40px;
  outline: none;
}

.output-meta {
  width: 100%;
  text-align: center;
}

.file-name-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  word-break: break-all;
  max-width: 100%;
}

.output-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.output-actions .apple-btn {
  flex: 1;
}

</style>

