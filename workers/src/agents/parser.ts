import type { Env } from '@/types';
import type { Question } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/utils/db';
import { R2Bucket } from '@cloudflare/workers-types';
import xlsx from 'xlsx';
import csvParse from 'csv-parse/lib/sync';
import pdfParse from 'pdf-parse';

/**
 * Helper to convert an Excel sheet to an array of Question objects.
 * Assumes a simple layout where columns include:
 *   - Section, Number, Question, Type, Required, Options (optional)
 */
function parseExcel(buffer: Buffer, questionnaireId: string): Question[] {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]]; // first sheet
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { defval: '' });
  const questions: Question[] = [];
  for (const row of rows) {
    const q: Question = {
      id: uuidv4(),
      questionnaireId,
      section: row['Section'] || row['section'] || '',
      subsection: row['Subsection'] || row['subsection'] || undefined,
      number: row['Number']?.toString() || row['number']?.toString() || '',
      text: row['Question']?.toString() || row['question']?.toString() || '',
      type: (row['Type']?.toString() || 'unknown') as any,
      required: row['Required']?.toString().toLowerCase() === 'yes' ? 1 : 0,
      options: row['Options'] ? row['Options'].toString().split(/[,;|]/).map((s: string) => s.trim()) : undefined,
      context: row['Context']?.toString() || undefined,
      rowIndex: undefined,
      columnMapping: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questions.push(q);
  }
  return questions;
}

/**
 * Helper to parse a CSV file into questions.
 * Expects a header row with similar column names as Excel.
 */
function parseCsv(buffer: Buffer, questionnaireId: string): Question[] {
  const text = buffer.toString('utf-8');
  const records = csvParse(text, {
    columns: true,
    skip_empty_lines: true,
  });
  const questions: Question[] = [];
  for (const row of records) {
    const q: Question = {
      id: uuidv4(),
      questionnaireId,
      section: row['Section'] || row['section'] || '',
      subsection: row['Subsection'] || row['subsection'] || undefined,
      number: row['Number']?.toString() || row['number']?.toString() || '',
      text: row['Question']?.toString() || row['question']?.toString() || '',
      type: (row['Type']?.toString() || 'unknown') as any,
      required: row['Required']?.toString().toLowerCase() === 'yes' ? 1 : 0,
      options: row['Options'] ? row['Options'].toString().split(/[,;|]/).map((s: string) => s.trim()) : undefined,
      context: row['Context']?.toString() || undefined,
      rowIndex: undefined,
      columnMapping: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questions.push(q);
  }
  return questions;
}

/**
 * Helper to parse a PDF questionnaire. This uses pdf-parse to extract raw text,
 * then applies a very naive line‑by‑line regex to find questions. For MVP we
 * assume the PDF is simple and each question starts on a new line with a
 * numbering like "1.1". In production you would replace this with an LLM‑based
 * extractor.
 */
async function parsePdf(buffer: Buffer, questionnaireId: string): Promise<Question[]> {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions: Question[] = [];
  const questionRegex = /^(\d+(?:\.\d+)*)(?:\s+|\.|\))\s*(.+)$/; // e.g., "1.2 Some question"
  for (const line of lines) {
    const match = line.match(questionRegex);
    if (match) {
      const q: Question = {
        id: uuidv4(),
        questionnaireId,
        section: '',
        subsection: undefined,
        number: match[1],
        text: match[2].trim(),
        type: 'free_text' as any,
        required: 1,
        options: undefined,
        context: undefined,
        rowIndex: undefined,
        columnMapping: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      questions.push(q);
    }
  }
  return questions;
}

/**
 * Main entry point used by the upload route or the background queue.
 * It reads the uploaded file from R2, determines its MIME type, parses it,
 * stores the questions in D1, and updates the questionnaire status.
 */
export async function processQuestionnaireFile(env: Env, questionnaireId: string, fileKey: string, fileName: string, mimeType: string) {
  // Fetch file from R2
  const object = await env.R2.get(fileKey);
  if (!object) throw new Error('File not found in R2');
  const arrayBuffer = await object.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let questions: Question[] = [];
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx')) {
    questions = parseExcel(buffer, questionnaireId);
  } else if (mimeType.includes('csv') || fileName.endsWith('.csv')) {
    questions = parseCsv(buffer, questionnaireId);
  } else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    questions = await parsePdf(buffer, questionnaireId);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Insert questions into D1 in a transaction (simple loop for MVP)
  const insertStmt = env.DB.prepare(`INSERT INTO questions (id, questionnaire_id, section, subsection, number, text, type, required, options, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const q of questions) {
    await insertStmt.run(
      q.id,
      q.questionnaireId,
      q.section,
      q.subsection,
      q.number,
      q.text,
      q.type,
      q.required,
      q.options ? JSON.stringify(q.options) : null,
      q.context || null,
      q.createdAt,
      q.updatedAt,
    );
  }

  // Update questionnaire status to "ready"
  await env.DB.prepare(`UPDATE questionnaires SET status = 'ready', progress_total = ?, progress_parsed = ?, updated_at = ? WHERE id = ?`).run(
    questions.length,
    questions.length,
    new Date().toISOString(),
    questionnaireId,
  );

  return questions;
}
