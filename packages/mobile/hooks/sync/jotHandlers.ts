import { File as ExpoFile } from 'expo-file-system';
import type {
  SyncWireMessage,
  JotDownloadRequest,
  JotClearRequest,
  JotManifest,
  JotPayload,
  ImagePayload,
  FilePayload,
  FileRequest,
  JotMeta,
  ImageMeta,
  AudioMeta,
  FileMeta,
} from '@jotbunker/shared';
import { JOT_COUNT, syncLog } from '@jotbunker/shared';
import { useJotsStore } from '../../stores/jotsStore';

export function buildJotManifest(): JotManifest {
  const noteState = useJotsStore.getState();
  const jots = [];
  for (let i = 1; i <= JOT_COUNT; i++) {
    const jot = noteState.jots[i];
    const imageIds = (jot?.images || []).map((img) => img.id);
    const audioIds = (jot?.recordings || []).map((rec) => rec.id);
    const fileIds = (jot?.files || []).map((f) => f.id);
    jots.push({
      id: i,
      hasText: (jot?.text || '').trim().length > 0,
      hasDrawing: jot?.drawing !== null && jot?.drawing !== undefined,
      imageIds,
      audioIds,
      fileIds,
    });
  }
  syncLog('MANIFEST', `Built manifest: ${jots.filter(s => s.hasText || s.hasDrawing || s.imageIds.length > 0 || s.audioIds.length > 0 || s.fileIds.length > 0).length}/${jots.length} non-empty`);
  return { type: 'jot_manifest', jots };
}

export function buildSingleJotMeta(jotId: number): JotMeta | null {
  const noteState = useJotsStore.getState();
  const jot = noteState.jots[jotId];
  if (!jot) return null;
  const images: ImageMeta[] = (jot.images || []).map((img) => ({
    id: img.id,
    format: img.format,
    createdAt: img.createdAt,
  }));
  const recordings: AudioMeta[] = (jot.recordings || []).map((rec) => ({
    id: rec.id,
    duration: rec.duration,
    format: 'm4a',
    createdAt: rec.createdAt,
  }));
  const files: FileMeta[] = (jot.files || []).map((f) => ({
    id: f.id,
    fileName: f.fileName,
    mimeType: f.mimeType,
    size: f.size,
    createdAt: f.createdAt,
  }));
  syncLog('META', `Built jot ${jotId} meta: ${images.length} img, ${recordings.length} audio, ${files.length} files`);
  return {
    id: jotId,
    text: jot.text,
    drawing: jot.drawing,
    images,
    recordings,
    files,
    textUpdatedAt: jot.textUpdatedAt || 0,
    drawingUpdatedAt: jot.drawingUpdatedAt || 0,
  };
}

export function buildJotMetadata(): JotMeta[] {
  const noteState = useJotsStore.getState();
  const jots: JotMeta[] = [];
  for (let i = 1; i <= JOT_COUNT; i++) {
    const jot = noteState.jots[i];
    if (!jot) continue;
    const images: ImageMeta[] = (jot.images || []).map((img) => ({
      id: img.id,
      format: img.format,
      createdAt: img.createdAt,
    }));
    const recordings: AudioMeta[] = (jot.recordings || []).map((rec) => ({
      id: rec.id,
      duration: rec.duration,
      format: 'm4a',
      createdAt: rec.createdAt,
    }));
    const files: FileMeta[] = (jot.files || []).map((f) => ({
      id: f.id,
      fileName: f.fileName,
      mimeType: f.mimeType,
      size: f.size,
      createdAt: f.createdAt,
    }));
    jots.push({
      id: i,
      text: jot.text,
      drawing: jot.drawing,
      images,
      recordings,
      files,
      textUpdatedAt: jot.textUpdatedAt || 0,
      drawingUpdatedAt: jot.drawingUpdatedAt || 0,
    });
  }
  return jots;
}

export async function handleDownloadRequest(
  req: JotDownloadRequest,
  send: (msg: SyncWireMessage) => boolean,
): Promise<void> {
  syncLog('DOWNLOAD', `Download request for jots [${req.jotIds.join(',')}]`);
  const noteState = useJotsStore.getState();
  const jots: JotPayload[] = [];

  for (const jotId of req.jotIds) {
    const jot = noteState.jots[jotId];
    if (!jot) continue;

    let drawing: string | null = null;
    if (jot.drawing) {
      try {
        drawing = await new ExpoFile(jot.drawing).base64();
      } catch (e) { console.warn('[useSync] drawing read failed:', e); }
    }

    const images: ImagePayload[] = [];
    for (const img of jot.images) {
      try {
        const data = await new ExpoFile(img.uri).base64();
        images.push({ id: img.id, data, format: img.format });
      } catch (e) { console.warn('[useSync] image read failed:', e); }
    }

    const recordings: { id: string; data: string; format: string; duration: number }[] = [];
    for (const rec of (jot.recordings || [])) {
      try {
        const data = await new ExpoFile(rec.uri).base64();
        recordings.push({ id: rec.id, data, format: 'm4a', duration: rec.duration });
      } catch (e) { console.warn('[useSync] audio read failed:', e); }
    }

    const files: FilePayload[] = [];
    for (const f of (jot.files || [])) {
      try {
        const data = await new ExpoFile(f.uri).base64();
        files.push({ id: f.id, data, fileName: f.fileName, mimeType: f.mimeType, size: f.size });
      } catch (e) { console.warn('[useSync] file read failed:', e); }
    }

    jots.push({ id: jotId, text: jot.text, drawing, images, recordings, files });
  }

  syncLog('DOWNLOAD', `Sending response: ${jots.length} jots, ${jots.reduce((n,s) => n + s.images.length, 0)} img, ${jots.reduce((n,s) => n + s.recordings.length, 0)} audio, ${jots.reduce((n,s) => n + s.files.length, 0)} files`);
  send({ type: 'jot_download_response', jots });
}

export function handleClearRequest(
  req: JotClearRequest,
  send: (msg: SyncWireMessage) => boolean,
): void {
  syncLog('CLEAR', `Clear request for jots [${req.jotIds.join(',')}]`);
  const cleared: number[] = [];
  for (const jotId of req.jotIds) {
    useJotsStore.getState().clearJot(jotId);
    cleared.push(jotId);
  }
  syncLog('CLEAR', `Cleared ${cleared.length} jots, sending ACK`);
  send({ type: 'jot_clear_ack', cleared });
}

export async function handleFileRequest(
  req: FileRequest,
  send: (msg: SyncWireMessage) => boolean,
): Promise<void> {
  syncLog('FILE', `Received file_request ${req.fileType} ${req.fileId} jot=${req.jotId}`);
  const noteState = useJotsStore.getState();
  const jot = noteState.jots[req.jotId];
  if (!jot) {
    syncLog('FILE', `file_request FAILED: Jot ${req.jotId} not found`);
    send({
      type: 'file_response', jotId: req.jotId, fileId: req.fileId,
      fileType: req.fileType, data: '', format: '', error: `Jot ${req.jotId} not found`,
    });
    return;
  }

  try {
    if (req.fileType === 'image') {
      const img = jot.images.find((im) => im.id === req.fileId);
      if (!img) throw new Error(`Image ${req.fileId} not found in jot ${req.jotId}`);
      const data = await new ExpoFile(img.uri).base64();
      syncLog('FILE', `Sending file_response ${req.fileType} ${req.fileId} (${data.length} chars base64)`);
      const sent = send({ type: 'file_response', jotId: req.jotId, fileId: req.fileId, fileType: 'image', data, format: img.format });
      syncLog('FILE', `file_response send ${sent ? 'OK' : 'FAILED'}`);
    } else if (req.fileType === 'audio') {
      const rec = (jot.recordings || []).find((r) => r.id === req.fileId);
      if (!rec) throw new Error(`Audio ${req.fileId} not found in jot ${req.jotId}`);
      const data = await new ExpoFile(rec.uri).base64();
      syncLog('FILE', `Sending file_response ${req.fileType} ${req.fileId} (${data.length} chars base64)`);
      const sent = send({ type: 'file_response', jotId: req.jotId, fileId: req.fileId, fileType: 'audio', data, format: 'm4a' });
      syncLog('FILE', `file_response send ${sent ? 'OK' : 'FAILED'}`);
    } else {
      const file = (jot.files || []).find((f) => f.id === req.fileId);
      if (!file) throw new Error(`File ${req.fileId} not found in jot ${req.jotId}`);
      const data = await new ExpoFile(file.uri).base64();
      syncLog('FILE', `Sending file_response ${req.fileType} ${req.fileId} (${data.length} chars base64)`);
      const sent = send({ type: 'file_response', jotId: req.jotId, fileId: req.fileId, fileType: 'file', data, format: file.mimeType });
      syncLog('FILE', `file_response send ${sent ? 'OK' : 'FAILED'}`);
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    syncLog('FILE', `file_request FAILED: ${errMsg}`);
    console.warn('[useSync] file_request failed:', errMsg);
    send({ type: 'file_response', jotId: req.jotId, fileId: req.fileId, fileType: req.fileType, data: '', format: '', error: errMsg });
  }
}
