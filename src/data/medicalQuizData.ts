/**
 * NovaCut Studio - Medical Quiz & Clinical Trivia Knowledge Base
 * Extracted directly from 30_short_medical_quizzes_with_background_prompts.csv
 * Includes instant offline high-res scientific backgrounds and layer mappings
 */

import {
  BulkDataColumn,
  BulkDataRow,
  TextOverlay,
  TemplatePreset,
  StickerOverlay,
  VideoEffectsConfig,
} from '../types';

export interface MedicalQuizItem {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: string;
  backgroundPrompt: string;
}

export const MEDICAL_QUIZZES_LIST: MedicalQuizItem[] = [
  {
    id: 1,
    question: "Which organ pumps blood around the body?",
    optionA: "Heart",
    optionB: "Lungs",
    correctAnswer: "Heart",
    backgroundPrompt: "Clean 3D medical illustration of a human heart, soft red and blue lighting, dark navy clinical background, subtle glowing particles, no text, no labels, vertical 4:5 composition"
  },
  {
    id: 2,
    question: "How many lungs does a typical person have?",
    optionA: "One",
    optionB: "Two",
    correctAnswer: "Two",
    backgroundPrompt: "Pair of realistic anatomical lungs with soft blue highlights, minimal modern medical studio background, gentle gradient, no text, no labels, vertical 4:5 composition"
  },
  {
    id: 3,
    question: "Which vitamin can the body make from sunlight?",
    optionA: "Vitamin D",
    optionB: "Vitamin C",
    correctAnswer: "Vitamin D",
    backgroundPrompt: "Sunlight beams falling across a medical vitamin D concept with a subtle human silhouette, warm golden and cool blue palette, clean healthcare aesthetic, no text, vertical 4:5 composition"
  },
  {
    id: 4,
    question: "What is the normal adult body temperature often quoted as?",
    optionA: "About 37°C",
    optionB: "About 40°C",
    correctAnswer: "About 37°C",
    backgroundPrompt: "Close-up digital thermometer showing a neutral temperature concept without readable numbers, clean white and pale blue clinic background, no text, vertical 4:5 composition"
  },
  {
    id: 5,
    question: "Which part of the body helps us breathe?",
    optionA: "Lungs",
    optionB: "Stomach",
    correctAnswer: "Lungs",
    backgroundPrompt: "Anatomical illustration of lungs and airways, soft teal background with gentle light, polished educational medical graphic, no text, vertical 4:5 composition"
  },
  {
    id: 6,
    question: "Which blood cells help fight infection?",
    optionA: "White blood cells",
    optionB: "Red blood cells",
    correctAnswer: "White blood cells",
    backgroundPrompt: "Microscopic white blood cells moving through a bloodstream, vivid but realistic scientific 3D style, deep blue background, no text, vertical 4:5 composition"
  },
  {
    id: 7,
    question: "Which organ helps filter waste from the blood?",
    optionA: "Kidneys",
    optionB: "Ears",
    correctAnswer: "Kidneys",
    backgroundPrompt: "Pair of anatomical kidneys with subtle glowing filtration effect, clean dark blue medical background, realistic 3D render, no text, vertical 4:5 composition"
  },
  {
    id: 8,
    question: "What should you do before preparing food?",
    optionA: "Wash your hands",
    optionB: "Touch your face",
    correctAnswer: "Wash your hands",
    backgroundPrompt: "Hands being washed with soap under running water, bright clean kitchen sink, fresh blue-white palette, no text, vertical 4:5 composition"
  },
  {
    id: 9,
    question: "Which nutrient is a main source of energy for the body?",
    optionA: "Carbohydrates",
    optionB: "Water",
    correctAnswer: "Carbohydrates",
    backgroundPrompt: "Healthy wholegrain bread, oats and fruit arranged on a clean surface, modern nutrition photography, soft natural light, no text, vertical 4:5 composition"
  },
  {
    id: 10,
    question: "Which organ controls thoughts and memory?",
    optionA: "Brain",
    optionB: "Liver",
    correctAnswer: "Brain",
    backgroundPrompt: "Detailed human brain anatomical model with subtle neural glow, dark indigo scientific background, crisp educational 3D style, no text, vertical 4:5 composition"
  },
  {
    id: 11,
    question: "Which mineral is important for strong bones?",
    optionA: "Calcium",
    optionB: "Iron",
    correctAnswer: "Calcium",
    backgroundPrompt: "Healthy bone cross-section with milk and leafy greens subtly in the scene, bright clinical background, realistic medical illustration, no text, vertical 4:5 composition"
  },
  {
    id: 12,
    question: "What is the best everyday drink for hydration?",
    optionA: "Water",
    optionB: "Soft drink",
    correctAnswer: "Water",
    backgroundPrompt: "Clear glass of water with fresh droplets and soft daylight, minimal pale aqua wellness background, premium realistic photography, no text, vertical 4:5 composition"
  },
  {
    id: 13,
    question: "Which organ produces insulin?",
    optionA: "Pancreas",
    optionB: "Lung",
    correctAnswer: "Pancreas",
    backgroundPrompt: "Anatomical pancreas highlighted within a subtle torso outline, clean blue medical infographic style, no labels or text, vertical 4:5 composition"
  },
  {
    id: 14,
    question: "Which sense organ detects sound?",
    optionA: "Ear",
    optionB: "Eye",
    correctAnswer: "Ear",
    backgroundPrompt: "Detailed human ear anatomical illustration with gentle sound-wave rings, soft lavender and blue clinical background, no text, vertical 4:5 composition"
  },
  {
    id: 15,
    question: "Which vitamin is commonly found in citrus fruits?",
    optionA: "Vitamin C",
    optionB: "Vitamin B12",
    correctAnswer: "Vitamin C",
    backgroundPrompt: "Fresh oranges and lemons with a subtle vitamin concept, bright citrus colours against a clean white background, no text, vertical 4:5 composition"
  },
  {
    id: 16,
    question: "What protects the brain?",
    optionA: "Skull",
    optionB: "Rib cage",
    correctAnswer: "Skull",
    backgroundPrompt: "Side-view anatomical skull protecting a softly highlighted brain, professional medical 3D render, neutral grey-blue background, no text, vertical 4:5 composition"
  },
  {
    id: 17,
    question: "Which body system includes the heart and blood vessels?",
    optionA: "Circulatory system",
    optionB: "Digestive system",
    correctAnswer: "Circulatory system",
    backgroundPrompt: "Human circulatory system with heart and branching blood vessels, red and blue anatomical glow, dark clean background, no text, vertical 4:5 composition"
  },
  {
    id: 18,
    question: "Which food group is a good source of protein?",
    optionA: "Eggs",
    optionB: "Candy",
    correctAnswer: "Eggs",
    backgroundPrompt: "Fresh eggs, beans and lentils arranged as a healthy protein food still life, warm natural light, clean background, no text, vertical 4:5 composition"
  },
  {
    id: 19,
    question: "What is the main function of teeth?",
    optionA: "Chewing food",
    optionB: "Pumping blood",
    correctAnswer: "Chewing food",
    backgroundPrompt: "Healthy human teeth in a clean dental-care 3D illustration, soft mint and white background, friendly clinical style, no text, vertical 4:5 composition"
  },
  {
    id: 20,
    question: "Which organ stores bile?",
    optionA: "Gallbladder",
    optionB: "Bladder",
    correctAnswer: "Gallbladder",
    backgroundPrompt: "Anatomical liver and gallbladder highlighted in a simplified torso, polished educational medical render, muted teal background, no text, vertical 4:5 composition"
  },
  {
    id: 21,
    question: "What does sunscreen help protect against?",
    optionA: "UV rays",
    optionB: "Bacteria in food",
    correctAnswer: "UV rays",
    backgroundPrompt: "Sunscreen bottle beside sunglasses under bright sunlight, subtle sunbeam motif, clean summer healthcare photography, no brand names or text, vertical 4:5 composition"
  },
  {
    id: 22,
    question: "Which habit supports good dental health?",
    optionA: "Brushing twice daily",
    optionB: "Eating sweets before bed",
    correctAnswer: "Brushing twice daily",
    backgroundPrompt: "Toothbrush and toothpaste beside a clean sink, fresh bright bathroom, soft blue-white palette, no logos or text, vertical 4:5 composition"
  },
  {
    id: 23,
    question: "Which part of the eye controls how much light enters?",
    optionA: "Pupil",
    optionB: "Eyelash",
    correctAnswer: "Pupil",
    backgroundPrompt: "Macro anatomical eye illustration highlighting the pupil and iris, elegant dark blue scientific background, no labels or text, vertical 4:5 composition"
  },
  {
    id: 24,
    question: "Which nutrient helps the body build and repair tissues?",
    optionA: "Protein",
    optionB: "Added sugar",
    correctAnswer: "Protein",
    backgroundPrompt: "Healthy protein foods including fish, beans and tofu on a neutral tabletop, bright modern nutrition photography, no text, vertical 4:5 composition"
  },
  {
    id: 25,
    question: "What is the body's largest organ?",
    optionA: "Skin",
    optionB: "Heart",
    correctAnswer: "Skin",
    backgroundPrompt: "Close-up detailed human skin layers medical illustration, warm natural skin tones with clean pale background, no labels or text, vertical 4:5 composition"
  },
  {
    id: 26,
    question: "Which organ is mainly responsible for detoxifying many substances?",
    optionA: "Liver",
    optionB: "Heart",
    correctAnswer: "Liver",
    backgroundPrompt: "Anatomical human liver highlighted in a translucent torso, rich burgundy and blue medical lighting, no text, vertical 4:5 composition"
  },
  {
    id: 27,
    question: "What can regular physical activity help improve?",
    optionA: "Heart health",
    optionB: "Tooth colour",
    correctAnswer: "Heart health",
    backgroundPrompt: "Person walking briskly in a green park at sunrise, subtle wellness and movement theme, realistic photography, no text, vertical 4:5 composition"
  },
  {
    id: 28,
    question: "Which blood component carries oxygen?",
    optionA: "Red blood cells",
    optionB: "Platelets",
    correctAnswer: "Red blood cells",
    backgroundPrompt: "Microscopic red blood cells floating through a vessel, realistic scientific 3D image, bright crimson against deep blue, no text, vertical 4:5 composition"
  },
  {
    id: 29,
    question: "Which practice can help reduce the spread of germs?",
    optionA: "Covering coughs and sneezes",
    optionB: "Sharing used tissues",
    correctAnswer: "Covering coughs and sneezes",
    backgroundPrompt: "Close-up of a person covering a cough with their elbow, clean bright healthcare setting, respectful realistic photography, no text, vertical 4:5 composition"
  },
  {
    id: 30,
    question: "Which part of the skeleton protects the heart and lungs?",
    optionA: "Rib cage",
    optionB: "Kneecap",
    correctAnswer: "Rib cage",
    backgroundPrompt: "Front-view anatomical rib cage protecting heart and lungs, elegant educational 3D medical illustration, soft charcoal and blue background, no text, vertical 4:5 composition"
  }
];

// Helper to generate dynamic SVG data URI for prompts
export function createThematicSvgBackground(topic: string, promptText: string): string {
  const p = promptText.toLowerCase();

  let primaryColor = '#0f172a';
  let accent1 = '#06b6d4';
  let accent2 = '#3b82f6';
  let iconPath = '';

  if (p.includes('heart') || p.includes('blood')) {
    accent1 = '#ef4444';
    accent2 = '#ec4899';
    // Anatomical Heart pulse curve
    iconPath = `
      <path d="M 540 700 C 440 600, 360 720, 360 840 C 360 1020, 540 1180, 540 1260 C 540 1180, 720 1020, 720 840 C 720 720, 640 600, 540 700 Z" fill="url(#grad2)" filter="url(#glow)" opacity="0.85"/>
      <path d="M 200 960 L 400 960 L 460 860 L 520 1080 L 580 920 L 640 980 L 880 980" fill="none" stroke="${accent1}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
    `;
  } else if (p.includes('lung') || p.includes('breathe') || p.includes('respiratory')) {
    accent1 = '#06b6d4';
    accent2 = '#38bdf8';
    // Lungs silhouette
    iconPath = `
      <path d="M 460 760 C 420 800, 340 880, 340 1060 C 340 1200, 440 1260, 480 1240 C 500 1200, 500 860, 460 760 Z" fill="url(#grad2)" opacity="0.8"/>
      <path d="M 620 760 C 660 800, 740 880, 740 1060 C 740 1200, 640 1260, 600 1240 C 580 1200, 580 860, 620 760 Z" fill="url(#grad2)" opacity="0.8"/>
      <path d="M 540 640 L 540 840 M 540 800 L 460 860 M 540 800 L 620 860" fill="none" stroke="#e0f2fe" stroke-width="12" stroke-linecap="round"/>
    `;
  } else if (p.includes('brain') || p.includes('thought') || p.includes('memory') || p.includes('skull')) {
    accent1 = '#a855f7';
    accent2 = '#6366f1';
    // Brain neural lobes
    iconPath = `
      <circle cx="540" cy="940" r="260" fill="url(#grad2)" opacity="0.4" filter="url(#glow)"/>
      <path d="M 420 840 C 360 840, 340 960, 400 1040 C 360 1100, 440 1220, 540 1200 C 640 1220, 720 1100, 680 1040 C 740 960, 720 840, 660 840 C 600 780, 480 780, 420 840 Z" fill="none" stroke="${accent1}" stroke-width="10"/>
      <circle cx="480" cy="920" r="14" fill="#f43f5e"/>
      <circle cx="600" cy="960" r="16" fill="#06b6d4"/>
      <circle cx="540" cy="1060" r="14" fill="#a855f7"/>
      <line x1="480" y1="920" x2="600" y2="960" stroke="#a855f7" stroke-width="4" opacity="0.8"/>
      <line x1="600" y1="960" x2="540" y2="1060" stroke="#06b6d4" stroke-width="4" opacity="0.8"/>
    `;
  } else if (p.includes('cell') || p.includes('infection') || p.includes('microscopic')) {
    accent1 = '#06b6d4';
    accent2 = '#10b981';
    iconPath = `
      <circle cx="540" cy="940" r="160" fill="url(#grad2)" filter="url(#glow)" opacity="0.85"/>
      <circle cx="340" cy="800" r="70" fill="url(#grad2)" opacity="0.6"/>
      <circle cx="740" cy="1100" r="90" fill="url(#grad2)" opacity="0.6"/>
      <circle cx="380" cy="1160" r="50" fill="url(#grad2)" opacity="0.5"/>
      <circle cx="700" cy="780" r="60" fill="url(#grad2)" opacity="0.5"/>
    `;
  } else if (p.includes('sunlight') || p.includes('vitamin') || p.includes('warm') || p.includes('energy')) {
    accent1 = '#f59e0b';
    accent2 = '#ef4444';
    iconPath = `
      <circle cx="540" cy="860" r="180" fill="url(#grad2)" filter="url(#glow)"/>
      <line x1="540" y1="560" x2="540" y2="640" stroke="#fef08a" stroke-width="12" stroke-linecap="round"/>
      <line x1="540" y1="1080" x2="540" y2="1160" stroke="#fef08a" stroke-width="12" stroke-linecap="round"/>
      <line x1="240" y1="860" x2="320" y2="860" stroke="#fef08a" stroke-width="12" stroke-linecap="round"/>
      <line x1="760" y1="860" x2="840" y2="860" stroke="#fef08a" stroke-width="12" stroke-linecap="round"/>
    `;
  } else if (p.includes('water') || p.includes('hydration') || p.includes('kidney')) {
    accent1 = '#0284c7';
    accent2 = '#38bdf8';
    iconPath = `
      <path d="M 540 680 C 440 840, 380 980, 380 1100 C 380 1240, 450 1320, 540 1320 C 630 1320, 700 1240, 700 1100 C 700 980, 640 840, 540 680 Z" fill="url(#grad2)" filter="url(#glow)" opacity="0.8"/>
    `;
  } else {
    // Default high-tech clinical grid & DNA spiral
    accent1 = '#38bdf8';
    accent2 = '#6366f1';
    iconPath = `
      <path d="M 440 700 Q 540 820, 640 940 T 440 1180" fill="none" stroke="${accent1}" stroke-width="14" stroke-linecap="round" opacity="0.75"/>
      <path d="M 640 700 Q 540 820, 440 940 T 640 1180" fill="none" stroke="${accent2}" stroke-width="14" stroke-linecap="round" opacity="0.75"/>
      <line x1="480" y1="780" x2="600" y2="780" stroke="#ffffff" stroke-width="6" opacity="0.6"/>
      <line x1="520" y1="940" x2="560" y2="940" stroke="#ffffff" stroke-width="6" opacity="0.6"/>
      <line x1="480" y1="1100" x2="600" y2="1100" stroke="#ffffff" stroke-width="6" opacity="0.6"/>
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="40%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="${accent1}" stop-opacity="0.18"/>
      <stop offset="65%" stop-color="#020617" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.98"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="28" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" stroke-width="1" opacity="0.25"/>
    </pattern>
  </defs>

  <!-- Deep Background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)"/>
  <rect width="1080" height="1920" fill="url(#grid)"/>

  <!-- Atmospheric Aura -->
  <circle cx="540" cy="900" r="580" fill="url(#vignette)"/>

  <!-- Anatomical / Scientific Subject Graphic -->
  <g transform="translate(0, 40)">
    ${iconPath}
  </g>

  <!-- Floating Glowing Particles -->
  <circle cx="280" cy="560" r="4" fill="${accent1}" opacity="0.6" filter="url(#glow)"/>
  <circle cx="820" cy="680" r="5" fill="${accent2}" opacity="0.7" filter="url(#glow)"/>
  <circle cx="340" cy="1340" r="4" fill="${accent1}" opacity="0.5"/>
  <circle cx="780" cy="1420" r="6" fill="${accent2}" opacity="0.8" filter="url(#glow)"/>
  <circle cx="540" cy="440" r="3" fill="#ffffff" opacity="0.7"/>

  <!-- Soft Studio Border Lighting -->
  <rect x="20" y="20" width="1040" height="1880" rx="36" fill="none" stroke="${accent1}" stroke-width="2" opacity="0.15"/>
</svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Convert 30 Quizzes to Canva Bulk Rows
export function getMedicalQuizzesAsBulkRows(): { columns: BulkDataColumn[]; rows: BulkDataRow[] } {
  const columns: BulkDataColumn[] = [
    { id: 'col_id', name: 'Quiz ID', key: 'Quiz_ID', type: 'text' },
    { id: 'col_q', name: 'Question', key: 'Question', mappedOverlayId: 'txt_question', type: 'text' },
    { id: 'col_a', name: 'Option A', key: 'Option_A', mappedOverlayId: 'txt_opt_a', type: 'text' },
    { id: 'col_b', name: 'Option B', key: 'Option_B', mappedOverlayId: 'txt_opt_b', type: 'text' },
    { id: 'col_ans', name: 'Correct Answer', key: 'Correct_Answer', mappedOverlayId: 'txt_correct', type: 'text' },
    { id: 'col_prompt', name: 'Background Prompt', key: 'Background_Prompt', type: 'background_prompt' },
  ];

  const rows: BulkDataRow[] = MEDICAL_QUIZZES_LIST.map((q) => {
    const bgUrl = createThematicSvgBackground(q.question, q.backgroundPrompt);
    return {
      id: `quiz_row_${q.id}`,
      data: {
        Quiz_ID: String(q.id),
        Question: q.question,
        Option_A: q.optionA,
        Option_B: q.optionB,
        Correct_Answer: q.correctAnswer,
        Background_Prompt: q.backgroundPrompt,
      },
      backgroundPrompt: q.backgroundPrompt,
      generatedBackgroundUrl: bgUrl,
    };
  });

  return { columns, rows };
}

// Canva/CapCut Default Text Overlays for Medical Quiz (12-Second Pro Reels / Shorts)
export const MEDICAL_QUIZ_OVERLAYS: TextOverlay[] = [
  {
    id: 'txt_badge',
    text: '🩺 MEDICAL QUIZ',
    startTime: 0,
    endTime: 12,
    color: '#38bdf8',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    fontSize: 22,
    position: 'custom',
    x: 50,
    y: 12,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'pop',
    role: 'badge',
    boxStyle: 'badge',
  },
  {
    id: 'txt_question',
    text: 'Which organ pumps blood around the body?',
    startTime: 0,
    endTime: 12,
    color: '#ffffff',
    backgroundColor: 'rgba(10, 15, 29, 0.94)',
    fontSize: 34,
    position: 'custom',
    x: 50,
    y: 28,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'fade',
    role: 'question',
    boxStyle: 'card',
  },
  {
    id: 'txt_opt_a',
    text: '[A] Heart',
    startTime: 2.0,
    endTime: 12,
    color: '#f8fafc',
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    fontSize: 28,
    position: 'custom',
    x: 50,
    y: 50,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'bounce',
    role: 'option_a',
    isCorrectAnswer: true,
    revealedAt: 7.5, // highlights green at 7.5s after 5s countdown
    boxStyle: 'pill',
  },
  {
    id: 'txt_opt_b',
    text: '[B] Lungs',
    startTime: 2.5,
    endTime: 12,
    color: '#cbd5e1',
    backgroundColor: 'rgba(30, 41, 59, 0.88)',
    fontSize: 28,
    position: 'custom',
    x: 50,
    y: 64,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'bounce',
    role: 'option_b',
    isCorrectAnswer: false,
    revealedAt: 7.5,
    boxStyle: 'pill',
  },
  {
    id: 'txt_timer',
    text: '⏱️ 5s Countdown',
    startTime: 3.0,
    endTime: 7.5,
    color: '#facc15',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    fontSize: 20,
    position: 'custom',
    x: 50,
    y: 78,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'fade',
    role: 'timer',
    boxStyle: 'pill',
  },
  {
    id: 'txt_correct',
    text: '✅ CORRECT: Heart',
    startTime: 7.5,
    endTime: 12,
    color: '#10b981',
    backgroundColor: 'rgba(6, 78, 59, 0.96)',
    fontSize: 26,
    position: 'custom',
    x: 50,
    y: 78,
    fontFamily: 'Plus Jakarta Sans',
    animation: 'pop',
    role: 'answer_reveal',
    boxStyle: 'neon',
  },
];

// CapCut Viral Stickers (Badges, Timer, Fire, Winner Checkmark)
export const DEFAULT_QUIZ_STICKERS: StickerOverlay[] = [
  {
    id: 'stk_badge',
    type: 'badge',
    content: '🩺',
    label: 'MEDICAL QUIZ',
    x: 50,
    y: 8,
    scale: 1.0,
    animation: 'pulse',
    startTime: 0,
    endTime: 12.0,
  },
  {
    id: 'stk_viral',
    type: 'fire',
    content: '🔥',
    label: 'VIRAL TEST',
    x: 88,
    y: 8,
    scale: 0.9,
    animation: 'bounce',
    startTime: 0,
    endTime: 12.0,
  },
  {
    id: 'stk_timer_clock',
    type: 'timer',
    content: '⏱️',
    label: 'THINK FAST',
    x: 50,
    y: 72,
    scale: 1.1,
    animation: 'pulse',
    startTime: 3.0,
    endTime: 7.5,
  },
  {
    id: 'stk_winner',
    type: 'checkmark',
    content: '💯',
    label: 'CORRECT ANSWER',
    x: 50,
    y: 72,
    scale: 1.2,
    animation: 'bounce',
    startTime: 7.5,
    endTime: 12.0,
  },
];

export const DEFAULT_EFFECTS_CONFIG: VideoEffectsConfig = {
  autoMode: true,
  vignette: true,
  particles: true,
  cameraPushIn: true,
  neonGlow: true,
  soundSync: true,
  autoVoiceover: true,
  voiceLanguage: 'en',
  durationSeconds: 12,
  soundEffects: true,
};
