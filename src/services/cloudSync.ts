import { ProjectState } from '../types';
import {
  MEDICAL_QUIZ_OVERLAYS,
  getMedicalQuizzesAsBulkRows,
  DEFAULT_QUIZ_STICKERS,
  DEFAULT_EFFECTS_CONFIG,
} from '../data/medicalQuizData';

const LOCAL_PROJECT_KEY = 'novacut_active_project_v1';
const LOCAL_PROJECTS_LIST_KEY = 'novacut_saved_projects_v1';

const { columns: medicalCols, rows: medicalRows } = getMedicalQuizzesAsBulkRows();

export const DEFAULT_BULK_CREATE_CONFIG = {
  enabled: true,
  columns: medicalCols,
  rows: medicalRows,
  bgRotationMode: 'prompt_ai' as const,
  selectedMediaPoolIds: ['sample_1', 'sample_2', 'sample_3', 'sample_4'],
  activePreviewIndex: 0,
};

export function getDefaultProject(): ProjectState {
  return {
    id: `proj_${Date.now()}`,
    title: '30 Short Medical Quizzes (Canva + CapCut Suite)',
    aspectRatio: '9:16', // Default 9:16 for viral Reels/Shorts
    fitMode: 'fill',
    clips: [],
    textOverlays: MEDICAL_QUIZ_OVERLAYS,
    stickers: DEFAULT_QUIZ_STICKERS,
    effectsConfig: DEFAULT_EFFECTS_CONFIG,
    filters: {
      brightness: 104,
      contrast: 108,
      saturation: 115,
      sepia: 0,
      blur: 0,
      hueRotate: 0,
      preset: 'crisp_hdr',
    },
    antiCopyright: {
      enabled: true, // Default ON for protection!
      tempoShift: 1.02, // 1.02x micro tempo
      microPitchVariance: true,
      microZoom: 1.03, // 3% zoom
      horizontalFlip: false,
      filmGrain: true,
      colorShiftLut: true,
      subtleAudioDither: true,
    },
    superResolution: {
      autoEnhanceLowRes: true,
      sharpness: 35,
      denoise: 20,
      edgeClarity: 40,
      upscaleTarget: '1080p',
    },
    bulkCreate: DEFAULT_BULK_CREATE_CONFIG,
    transition: {
      type: 'crossfade',
      duration: 0.8,
      triggerTime: 3.5, // split cue point matching the scene shift
      direction: 'left',
    },
    currentTime: 0,
    duration: 12,
    isCloudSynced: false,
    lastSavedAt: new Date().toISOString(),
  };
}

export function getInitialProject(): ProjectState {
  const defaults = getDefaultProject();
  try {
    const raw = localStorage.getItem(LOCAL_PROJECT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        bulkCreate: {
          ...defaults.bulkCreate,
          ...(parsed.bulkCreate || {}),
          columns:
            parsed.bulkCreate?.columns && parsed.bulkCreate.columns.length > 0
              ? parsed.bulkCreate.columns
              : defaults.bulkCreate.columns,
          rows:
            parsed.bulkCreate?.rows && parsed.bulkCreate.rows.length > 0
              ? parsed.bulkCreate.rows
              : defaults.bulkCreate.rows,
          bgRotationMode: parsed.bulkCreate?.bgRotationMode || defaults.bulkCreate.bgRotationMode,
          selectedMediaPoolIds:
            parsed.bulkCreate?.selectedMediaPoolIds || defaults.bulkCreate.selectedMediaPoolIds,
        },
        antiCopyright: {
          ...defaults.antiCopyright,
          ...(parsed.antiCopyright || {}),
        },
        superResolution: {
          ...defaults.superResolution,
          ...(parsed.superResolution || {}),
        },
        filters: {
          ...defaults.filters,
          ...(parsed.filters || {}),
        },
        transition: {
          ...defaults.transition,
          ...(parsed.transition || {}),
        },
        stickers: parsed.stickers || defaults.stickers,
        effectsConfig: {
          ...defaults.effectsConfig,
          ...(parsed.effectsConfig || {}),
        },
      };
    }
  } catch (e) {
    // fallback
  }

  return defaults;
}

export function saveProjectLocally(project: ProjectState): void {
  try {
    localStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(project));
    
    // Also save into multi-project list
    const listRaw = localStorage.getItem(LOCAL_PROJECTS_LIST_KEY);
    const list: ProjectState[] = listRaw ? JSON.parse(listRaw) : [];
    const filtered = list.filter((p) => p.id !== project.id);
    localStorage.setItem(LOCAL_PROJECTS_LIST_KEY, JSON.stringify([project, ...filtered].slice(0, 20)));
  } catch (e) {
    console.error('Failed to save project locally', e);
  }
}

export async function syncProjectToCloud(project: ProjectState, userEmail: string): Promise<boolean> {
  saveProjectLocally(project);

  if (!navigator.onLine) {
    return false; // Stays saved offline
  }

  try {
    const res = await fetch('/api/sync/save-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, email: userEmail }),
    });
    if (res.ok) {
      return true;
    }
  } catch (e) {
    console.warn('Cloud sync error, saved offline.', e);
  }
  return false;
}

export function exportProjectFile(project: ProjectState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.novaproject`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProjectFromFile(file: File): Promise<ProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json && json.id && json.aspectRatio) {
          const defaults = getDefaultProject();
          resolve({
            ...defaults,
            ...json,
            bulkCreate: {
              ...defaults.bulkCreate,
              ...(json.bulkCreate || {}),
            },
            antiCopyright: {
              ...defaults.antiCopyright,
              ...(json.antiCopyright || {}),
            },
            superResolution: {
              ...defaults.superResolution,
              ...(json.superResolution || {}),
            },
            filters: {
              ...defaults.filters,
              ...(json.filters || {}),
            },
            transition: {
              ...defaults.transition,
              ...(json.transition || {}),
            },
          });
        } else {
          reject(new Error('Invalid project file format'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
