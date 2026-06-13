<script setup lang="ts">
import jsQR from 'jsqr'
import { toDataURL } from 'qrcode'
import { nextTick, onUnmounted, ref } from 'vue'

import { decodeTransferCode, encodeTransferCode } from '@/game/saveTransfer'
import { useMetaStore } from '@/stores/metaStore'

const metaStore = useMetaStore()

const exportedCode = ref('')
const importCode = ref('')
const status = ref('')

// ── export + QR display ───────────────────────────────────────────────
const qrDataUrl = ref('')
const showQr = ref(false)

/** the compact, QR-friendly code for the current save — generated once, reused */
async function currentTransferCode(): Promise<string> {
  const code = await encodeTransferCode({ rawCode: metaStore.exportSave() })
  exportedCode.value = code
  return code
}

async function generateQr(): Promise<void> {
  const code = await currentTransferCode()
  qrDataUrl.value = await toDataURL(code, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 288,
    // standard dark-on-light polarity scans reliably on any phone camera
    color: { dark: '#0f172aff', light: '#f8fafcff' },
  })
}

async function onExport(): Promise<void> {
  const code = await currentTransferCode()
  try {
    await navigator.clipboard.writeText(code)
    status.value = 'Save code copied to clipboard'
  } catch {
    status.value = 'Copy the code below manually'
  }
  if (showQr.value === true) {
    await generateQr()
  }
}

async function toggleQr(): Promise<void> {
  showQr.value = showQr.value === false
  if (showQr.value === true && qrDataUrl.value === '') {
    await generateQr()
  }
}

// ── import (paste or scan) ────────────────────────────────────────────
async function applyImport({ raw }: { raw: string }): Promise<void> {
  try {
    const code = await decodeTransferCode({ input: raw })
    const didImport = metaStore.importSave({ code })
    status.value = didImport === true ? 'Save imported!' : 'That code is not a valid save'
    if (didImport === true) {
      importCode.value = ''
      // a freshly imported save changes what the QR would encode
      qrDataUrl.value = ''
      exportedCode.value = ''
    }
  } catch {
    status.value = 'That code could not be read'
  }
}

function onImport(): void {
  if (importCode.value.trim() === '') {
    return
  }
  void applyImport({ raw: importCode.value })
}

// ── camera scanning ───────────────────────────────────────────────────
const isScanning = ref(false)
const scanError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
let stream: MediaStream | null = null
let rafId = 0
let scanCanvas: HTMLCanvasElement | null = null
let scanCtx: CanvasRenderingContext2D | null = null

async function startScan(): Promise<void> {
  scanError.value = ''
  status.value = ''
  if (navigator.mediaDevices?.getUserMedia === undefined) {
    scanError.value = 'This device has no camera support'
    return
  }
  try {
    // the rear camera is the natural choice for scanning another screen
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
  } catch {
    scanError.value = 'Could not open the camera — check permissions'
    return
  }
  isScanning.value = true
  await nextTick()
  const video = videoRef.value
  if (video === null) {
    stopScan()
    return
  }
  video.srcObject = stream
  video.setAttribute('playsinline', 'true')
  try {
    await video.play()
  } catch {
    scanError.value = 'Could not start the camera preview'
    stopScan()
    return
  }
  scanCanvas = document.createElement('canvas')
  scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true })
  scanFrame()
}

function scanFrame(): void {
  const video = videoRef.value
  if (isScanning.value === false || video === null || scanCanvas === null || scanCtx === null) {
    return
  }
  if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
    scanCanvas.width = video.videoWidth
    scanCanvas.height = video.videoHeight
    scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height)
    const frame = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height)
    const result = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })
    if (result !== null && result.data !== '') {
      const data = result.data
      stopScan()
      void applyImport({ raw: data })
      return
    }
  }
  rafId = requestAnimationFrame(scanFrame)
}

function stopScan(): void {
  isScanning.value = false
  if (rafId !== 0) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (stream !== null) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
    stream = null
  }
  if (videoRef.value !== null) {
    videoRef.value.srcObject = null
  }
  scanCanvas = null
  scanCtx = null
}

onUnmounted(() => {
  stopScan()
})
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-slate-800 pt-3">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        @click="onExport()"
      >
        Export save
      </button>
      <button
        type="button"
        class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        :class="
          showQr === true
            ? 'bg-sky-500/20 text-sky-300'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        "
        @click="toggleQr()"
      >
        ▦ Show QR {{ showQr === true ? '▴' : '▾' }}
      </button>
      <button
        type="button"
        class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        :class="
          isScanning === true
            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        "
        @click="isScanning === true ? stopScan() : startScan()"
      >
        {{ isScanning === true ? '■ Stop camera' : '⛶ Scan QR' }}
      </button>
    </div>

    <p class="text-[11px] leading-snug text-slate-500">
      Show the QR on one device and point the other's camera at it with “Scan QR” to copy your save
      across — no typing.
    </p>

    <div v-if="showQr === true" class="flex flex-col items-center gap-2">
      <img
        v-if="qrDataUrl !== ''"
        :src="qrDataUrl"
        alt="Save code QR"
        width="288"
        height="288"
        class="rounded-lg border border-slate-700 bg-slate-50 p-2"
      />
      <p v-else class="text-xs text-slate-500">Generating QR…</p>
    </div>

    <div v-if="isScanning === true" class="flex flex-col items-center gap-2">
      <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
      <video
        ref="videoRef"
        class="aspect-square w-full max-w-[288px] rounded-lg border border-sky-500/40 bg-slate-950 object-cover"
        muted
        playsinline
      />
      <p class="text-xs text-slate-500">Point the camera at the other device's QR…</p>
    </div>
    <p v-if="scanError !== ''" class="text-xs text-red-400">{{ scanError }}</p>

    <div class="flex gap-2">
      <input
        v-model="importCode"
        type="text"
        placeholder="…or paste a save code"
        class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600"
      />
      <button
        type="button"
        class="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
        @click="onImport()"
      >
        Import
      </button>
    </div>

    <textarea
      v-if="exportedCode !== ''"
      :value="exportedCode"
      readonly
      rows="2"
      class="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[10px] text-slate-400"
      @focus="($event.target as HTMLTextAreaElement).select()"
    />
    <p v-if="status !== ''" class="text-xs text-slate-500">{{ status }}</p>
  </div>
</template>
