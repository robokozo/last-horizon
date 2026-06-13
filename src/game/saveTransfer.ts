/**
 * Save-transfer codec. The meta store's `exportSave()` produces a base64-JSON
 * "v1" code that grows with the paragon board — a fully unlocked tree overflows
 * what a QR code can hold and what a phone camera can reliably read. So for
 * sharing we deflate that code and base64url it behind a short prefix, which
 * keeps the QR small and dense-enough to scan in one shot.
 *
 * Decoding is symmetric and also accepts a plain v1 code untouched, so pasting
 * an old text code (or a freshly scanned compact one) both flow into the same
 * `importSave()`.
 */

const TRANSFER_PREFIX = 'LH1~'

function bytesToBase64Url({ bytes }: { bytes: Uint8Array }): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes({ value }: { value: string }): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function deflate({ text }: { text: string }): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const buffer = await new Response(stream).arrayBuffer()
  return new Uint8Array(buffer)
}

async function inflate({ bytes }: { bytes: Uint8Array<ArrayBuffer> }): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return await new Response(stream).text()
}

/** wrap a v1 save code into the compact, QR-friendly transfer form */
export async function encodeTransferCode({ rawCode }: { rawCode: string }): Promise<string> {
  // very old browsers without the Compression Streams API still get a working
  // (longer) code — the QR just needs a higher version to hold it
  if (typeof CompressionStream === 'undefined') {
    return rawCode
  }
  const bytes = await deflate({ text: rawCode })
  return `${TRANSFER_PREFIX}${bytesToBase64Url({ bytes })}`
}

/** turn any transfer code (compact or plain v1) back into the v1 code importSave expects */
export async function decodeTransferCode({ input }: { input: string }): Promise<string> {
  const trimmed = input.trim()
  if (trimmed.startsWith(TRANSFER_PREFIX) === false) {
    return trimmed
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot read compressed save codes')
  }
  const bytes = base64UrlToBytes({ value: trimmed.slice(TRANSFER_PREFIX.length) })
  return await inflate({ bytes })
}
