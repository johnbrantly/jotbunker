import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { InputModeId } from '@jotbunker/shared';
import { JOT_COUNT } from '@jotbunker/shared';
import { deleteSandboxFile } from '../utils/copyToSandbox';

export interface AudioRecording {
  id: string;
  uri: string;
  duration: number; // seconds
  createdAt: number;
}

export interface FileAttachment {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface JotData {
  text: string;
  textUpdatedAt: number;
  drawing: string | null; // JSON-serialized SVG path data
  drawingUpdatedAt: number;
  images: { id: string; uri: string; format: string; createdAt: number }[];
  recordings: AudioRecording[];
  files: FileAttachment[];
}

function emptyJot(): JotData {
  return { text: '', textUpdatedAt: 0, drawing: null, drawingUpdatedAt: 0, images: [], recordings: [], files: [] };
}

interface JotsState {
  jots: Record<number, JotData>;
  activeJotId: number;
  activeMode: InputModeId;
  setActiveJot: (id: number) => void;
  setActiveMode: (mode: InputModeId) => void;
  updateText: (jotId: number, text: string) => void;
  setDrawing: (jotId: number, uri: string | null) => void;
  addImage: (jotId: number, uri: string, format: string) => void;
  removeImage: (jotId: number, imageId: string) => void;
  addAudio: (jotId: number, uri: string, duration: number) => void;
  removeAudio: (jotId: number, audioId: string) => void;
  addFile: (jotId: number, uri: string, fileName: string, mimeType: string, size: number) => void;
  removeFile: (jotId: number, fileId: string) => void;
  clearJot: (jotId: number) => void;
}

function initJots(): Record<number, JotData> {
  const jots: Record<number, JotData> = {};
  for (let i = 1; i <= JOT_COUNT; i++) {
    jots[i] = emptyJot();
  }
  return jots;
}

export const useJotsStore = create<JotsState>()(
    persist(
      (set, get) => ({
      jots: initJots(),
      activeJotId: 1,
      activeMode: 'type',

      setActiveJot: (id) => set({ activeJotId: id }),
      setActiveMode: (mode) => set({ activeMode: mode }),

      updateText: (jotId, text) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: { ...state.jots[jotId], text, textUpdatedAt: Date.now() },
          },
        })),

      setDrawing: (jotId, uri) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: { ...state.jots[jotId], drawing: uri, drawingUpdatedAt: Date.now() },
          },
        })),

      addImage: (jotId, uri, format) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              images: [
                ...state.jots[jotId].images,
                { id: Crypto.randomUUID(), uri, format, createdAt: Date.now() },
              ],
            },
          },
        })),

      removeImage: (jotId, imageId) =>
        set((state) => {
          const doomed = state.jots[jotId].images.find((img) => img.id === imageId);
          if (doomed) deleteSandboxFile(doomed.uri);
          return {
            jots: {
              ...state.jots,
              [jotId]: {
                ...state.jots[jotId],
                images: state.jots[jotId].images.filter((img) => img.id !== imageId),
              },
            },
          };
        }),

      addAudio: (jotId, uri, duration) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              recordings: [
                ...(state.jots[jotId].recordings || []),
                { id: Crypto.randomUUID(), uri, duration, createdAt: Date.now() },
              ],
            },
          },
        })),

      removeAudio: (jotId, audioId) =>
        set((state) => {
          const doomed = (state.jots[jotId].recordings || []).find((r) => r.id === audioId);
          if (doomed) deleteSandboxFile(doomed.uri);
          return {
            jots: {
              ...state.jots,
              [jotId]: {
                ...state.jots[jotId],
                recordings: (state.jots[jotId].recordings || []).filter((r) => r.id !== audioId),
              },
            },
          };
        }),

      addFile: (jotId, uri, fileName, mimeType, size) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              files: [
                ...(state.jots[jotId].files || []),
                { id: Crypto.randomUUID(), uri, fileName, mimeType, size, createdAt: Date.now() },
              ],
            },
          },
        })),

      removeFile: (jotId, fileId) =>
        set((state) => {
          const doomed = (state.jots[jotId].files || []).find((f) => f.id === fileId);
          if (doomed) deleteSandboxFile(doomed.uri);
          return {
            jots: {
              ...state.jots,
              [jotId]: {
                ...state.jots[jotId],
                files: (state.jots[jotId].files || []).filter((f) => f.id !== fileId),
              },
            },
          };
        }),

      clearJot: (jotId) =>
        set((state) => {
          const jot = state.jots[jotId];
          if (jot) {
            jot.images.forEach((img) => deleteSandboxFile(img.uri));
            (jot.recordings || []).forEach((r) => deleteSandboxFile(r.uri));
            (jot.files || []).forEach((f) => deleteSandboxFile(f.uri));
          }
          return { jots: { ...state.jots, [jotId]: emptyJot() } };
        }),
    }),
      {
        name: 'jotbunker-jots',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          jots: state.jots,
          activeJotId: state.activeJotId,
          activeMode: state.activeMode,
        }),
      },
    ),
);
