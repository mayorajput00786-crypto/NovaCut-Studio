/**
 * Robust CSV / TSV parser adhering to RFC-4180
 * Handles escaped quotes (""), embedded commas/newlines, BOM markers, and variable delimiters (, \t ;)
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  delimiter: string;
  rowCount: number;
}

export function parseCsvText(rawText: string): ParsedCsvResult {
  if (!rawText || !rawText.trim()) {
    return { headers: [], rows: [], rawRows: [], delimiter: ',', rowCount: 0 };
  }

  // Strip UTF-8 BOM if present (common in Microsoft Excel exports)
  let text = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Auto-detect delimiter from first line: comma, tab, or semicolon
  const firstLine = text.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount >= semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  // Tokenize character by character
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' || char === "'") {
      if (insideQuotes && nextChar === char) {
        // Escaped quote ("" or '')
        currentField += char;
        i++; // skip next char
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Flush remaining field
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], rawRows: [], delimiter, rowCount: 0 };
  }

  const rawHeaders = rows[0];
  // Sanitize headers: make non-empty and unique
  const headers: string[] = [];
  const seenHeaders: Record<string, number> = {};

  rawHeaders.forEach((h, idx) => {
    let clean = h.trim();
    if (!clean) clean = `Column_${idx + 1}`;
    if (seenHeaders[clean]) {
      seenHeaders[clean]++;
      headers.push(`${clean}_${seenHeaders[clean]}`);
    } else {
      seenHeaders[clean] = 1;
      headers.push(clean);
    }
  });

  const parsedRows: Record<string, string>[] = [];
  const rawDataRows = rows.slice(1);

  for (let r = 0; r < rawDataRows.length; r++) {
    const rowCells = rawDataRows[r];
    const rowObj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      rowObj[header] = rowCells[colIdx] !== undefined ? rowCells[colIdx] : '';
    });
    parsedRows.push(rowObj);
  }

  return {
    headers,
    rows: parsedRows,
    rawRows: rawDataRows,
    delimiter,
    rowCount: parsedRows.length,
  };
}

/**
 * Generates sample CSV template content for download
 */
export function generateSampleCsvContent(type: 'medical_quiz' | 'viral_quotes' | 'general' = 'medical_quiz'): string {
  if (type === 'medical_quiz') {
    return `Question,Option_A,Option_B,Correct_Answer,Background_Prompt
Which organ pumps blood throughout the entire body?,Heart,Lungs,Heart,3D human beating heart anatomical visualization with glowing red blood flow cinematic 4k
How many bones are in the adult human body?,206 Bones,350 Bones,206 Bones,Human skeletal system glowing bone structure in medical laboratory volumetric light
What is the largest internal organ in the human body?,Liver,Kidneys,Liver,3D human liver anatomical model glowing hepatic vessels clean scientific rendering
Which gas do human red blood cells transport?,Oxygen,Nitrogen,Oxygen,Red blood cells flowing through transparent capillary vessel glowing oxygen molecules
What is the powerhouse organelle of the human cell?,Mitochondria,Ribosome,Mitochondria,Microscopic cell interior glowing mitochondria power production golden energy sparks`;
  }

  if (type === 'viral_quotes') {
    return `Hook,Quote,Author,Background_Prompt
3 Rules for Life,Discipline equals freedom,Jocko Willink,Dark moody athletic training gym with neon blue volumetric light
The Hard Truth,You become what you think about most,Earl Nightingale,Deep philosophical starry cosmos nebula timelapse 8k
Daily Mindset,Small habits compound into massive success,James Clear,Minimalist architectural zen garden with sun rays through bamboo`;
  }

  return `Title,Subtitle,Call_To_Action,Background_Prompt
Transform Your Life Today,Take the first step towards greatness,Start Now,Abstract futuristic glowing cyber wave landscape neon cyan and violet
Master Video Editing in Minutes,Create viral short reels effortlessly,Try Free,High-tech creative workstation dual monitor with vibrant color grading`;
}
