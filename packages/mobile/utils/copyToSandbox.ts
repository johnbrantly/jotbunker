import { Directory, File, Paths } from 'expo-file-system';

/**
 * Ensure the named subdirectory exists inside `Paths.document` and return it.
 * Idempotent — safe to call every pick.
 */
function ensureSubdir(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Copy a picked file into the app's document sandbox and return the new URI.
 *
 * Why: `expo-file-system` v19+ enforces a sandbox security model on
 * `new File(uri).base64()`. Image/Document-picker URIs on Android (content://
 * via MediaStore / SAF) have a transient READ grant that expires after app
 * restart or picker-process death. Storing those URIs in jotsStore and trying
 * to base64 them later during sync throws `Missing 'READ' permission`.
 *
 * By copying the picked file into `Paths.document/<subdir>/...` at pick time,
 * we get a file the app fully owns — readable indefinitely by later sync
 * operations.
 */
export function copyToSandbox(sourceUri: string, subdir: string, ext: string): string {
  const dir = ensureSubdir(subdir);
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const filename = `${Date.now()}_${Math.floor(Math.random() * 1e9)}.${safeExt}`;
  const dest = new File(dir, filename);
  new File(sourceUri).copy(dest);
  return dest.uri;
}

/**
 * Best-effort delete of a sandbox-owned file. Silently swallows errors —
 * callers must not depend on the file being gone. Used when removing an
 * attachment from jotsStore so the sandbox subdirs do not leak disk.
 */
export function deleteSandboxFile(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    /* file may be missing or outside sandbox — best effort */
  }
}
