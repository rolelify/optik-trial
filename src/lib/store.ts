import prisma from './prisma';
import { RunRecord, MoatScoreResult } from './types';
import { Prisma } from '@prisma/client';

// In-memory fallback for environments without DB
const memoryStore = new Map<string, RunRecord>();

export const saveRun = async (record: RunRecord) => {
  memoryStore.set(record.id, record);
  
  try {
    await prisma.run.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        url: record.url,
        timestamp: new Date(record.timestamp),
        diffText: record.diffText,
        intentMode: false, // Legacy field
        status: record.status,
        error: record.error,
        mobileResult: {
          result: record.result,
          mobileScreenshot: record.mobileScreenshot,
          desktopScreenshot: record.desktopScreenshot
        } as unknown as Prisma.InputJsonValue,
        desktopResult: {} as Prisma.InputJsonValue
      },
      update: {
        status: record.status,
        error: record.error,
        mobileResult: {
          result: record.result,
          mobileScreenshot: record.mobileScreenshot,
          desktopScreenshot: record.desktopScreenshot
        } as unknown as Prisma.InputJsonValue
      }
    });
  } catch (err) {
    console.warn('Prisma save failed, using memory store only', err);
  }
};

export const getRun = async (id: string): Promise<RunRecord | undefined> => {
  if (memoryStore.has(id)) return memoryStore.get(id);

  try {
    const result = await prisma.run.findUnique({
      where: { id }
    });
    if (!result) return undefined;

    const json = result.mobileResult as { result: MoatScoreResult; mobileScreenshot?: string; desktopScreenshot?: string };
    return {
      id: result.id,
      url: result.url,
      timestamp: result.timestamp.toISOString(),
      diffText: result.diffText || undefined,
      status: result.status as RunRecord['status'],
      error: result.error || undefined,
      result: json.result,
      mobileScreenshot: json.mobileScreenshot,
      desktopScreenshot: json.desktopScreenshot
    };
  } catch {
    return undefined;
  }
};

export const getAllRuns = async (): Promise<RunRecord[]> => {
  const memRuns = Array.from(memoryStore.values());
  
  try {
    const results = await prisma.run.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    const dbRuns = results.map(result => {
      const json = result.mobileResult as { result: MoatScoreResult; mobileScreenshot?: string; desktopScreenshot?: string };
      return {
        id: result.id,
        url: result.url,
        timestamp: result.timestamp.toISOString(),
        diffText: result.diffText || undefined,
        status: result.status as RunRecord['status'],
        error: result.error || undefined,
        result: json.result as MoatScoreResult,
        mobileScreenshot: json.mobileScreenshot,
        desktopScreenshot: json.desktopScreenshot
      };
    });

    // Merge and dedupe by ID
    const all = [...memRuns, ...dbRuns];
    const unique = Array.from(new Map(all.map(r => [r.id, r])).values());
    return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return memRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
