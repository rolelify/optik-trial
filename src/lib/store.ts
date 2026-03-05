import fs from 'fs';
import path from 'path';
import { RunRecord } from './types';

// In-memory cache
const _store = new Map<string, RunRecord>();

const getLogFilePath = () => {
  const dir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'runs.jsonl');
};

// Initialize store from disk if needed
const initStore = () => {
  if (_store.size > 0) return;
  const file = getLogFilePath();
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      try {
        const record = JSON.parse(line) as RunRecord;
        _store.set(record.id, record);
      } catch (e) {
        console.error('Failed to parse log line', e);
      }
    }
  }
};

export const saveRun = (record: RunRecord) => {
  initStore();
  _store.set(record.id, record);
  
  // Rewrite JSONL (for demo purposes we just append, but to update, we rewrite the whole file for simplicity in this size)
  const file = getLogFilePath();
  const allRecords = Array.from(_store.values());
  const fileContent = allRecords.map((r) => JSON.stringify(r)).join('\n');
  fs.writeFileSync(file, fileContent, 'utf-8');
};

export const getRun = (id: string): RunRecord | undefined => {
  initStore();
  return _store.get(id);
};

export const getAllRuns = (): RunRecord[] => {
  initStore();
  return Array.from(_store.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
