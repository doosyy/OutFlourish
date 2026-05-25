// Photos helper — wraps @capacitor/camera + @capacitor/filesystem so the rest
// of the app can call a single function to pick or capture a plant portrait
// and get back a persistent URI that survives app restart.
//
// On iOS: writes the JPEG into Filesystem.Directory.Data/plants/<id>.jpg and
// returns a Capacitor-convertible URI ready to drop into <img src>.
//
// On web (dev server): falls back to a file <input> and returns an object-URL
// so the photo at least renders during preview testing. Object-URLs do NOT
// persist across reloads — that's fine, this path is for development only.

import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'

export type PhotoSource = 'camera' | 'photos'

interface CapturedPhoto {
  /** URI safe to assign to <img src>. */
  src: string
  /** Path relative to Directory.Data, for cleanup later. Web fallback uses an object-URL with no path. */
  path?: string
}

/**
 * Capture or pick a plant portrait. Returns null if the user cancels or the
 * platform denies permission.
 */
export async function capturePlantPhoto(plantId: string, source: PhotoSource): Promise<CapturedPhoto | null> {
  const native = Capacitor.isNativePlatform()

  if (!native) {
    return webFallback()
  }

  try {
    const photo = await Camera.getPhoto({
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      resultType: CameraResultType.Base64,
      quality: 78,
      width: 720,
      height: 720,
      allowEditing: true,
      correctOrientation: true,
    })

    if (!photo.base64String) return null

    const filename = `plants/${plantId}-${Date.now()}.jpg`
    await Filesystem.writeFile({
      path: filename,
      data: photo.base64String,
      directory: Directory.Data,
      recursive: true,
    })

    const uri = await Filesystem.getUri({ path: filename, directory: Directory.Data })
    return { src: Capacitor.convertFileSrc(uri.uri), path: filename }
  } catch (err) {
    // User cancelled or permission denied — return null so caller can fall back gracefully
    console.warn('[photos] capture failed:', err)
    return null
  }
}

/**
 * Web fallback — opens a hidden <input type="file"> and returns an object URL.
 * Cannot persist across reload but renders correctly during dev.
 */
function webFallback(): Promise<CapturedPhoto | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { resolve(null); return }
      resolve({ src: URL.createObjectURL(file) })
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

/**
 * Delete a previously stored plant photo on native platforms. Safe to call with
 * any URL — if it's not a Filesystem path we own, this is a no-op.
 */
export async function removeStoredPhoto(path?: string): Promise<void> {
  if (!path || !Capacitor.isNativePlatform()) return
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Data })
  } catch { /* already gone */ }
}
