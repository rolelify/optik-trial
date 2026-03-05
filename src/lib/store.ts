import prisma from './prisma';
import { RunRecord } from './types';
import { Prisma } from '@prisma/client';

// singleton for memoryStore to survive HMR/Fast Refresh/Different Routes in dev
const globalForStore = globalThis as unknown as { memoryStore: Map<string, RunRecord> };
const memoryStore = globalForStore.memoryStore || new Map<string, RunRecord>();
if (process.env.NODE_ENV !== 'production') globalForStore.memoryStore = memoryStore;

export const saveRun = async (record: RunRecord) => {
  memoryStore.set(record.id, record);
  
  try {
    const mobileResultJson = {
      result: record.result || null,
      mobileScreenshot: record.mobileScreenshot || null,
      desktopScreenshot: record.desktopScreenshot || null
    };

    await prisma.run.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        url: record.url,
        timestamp: new Date(record.timestamp),
        diffText: record.diffText || null,
        intentMode: false,
        status: record.status,
        error: record.error || null,
        mobileResult: mobileResultJson as unknown as Prisma.InputJsonValue,
        desktopResult: {} as Prisma.InputJsonValue
      },
      update: {
        status: record.status,
        error: record.error || null,
        mobileResult: mobileResultJson as unknown as Prisma.InputJsonValue
      }
    });
  } catch {
    // Silently handle if DATABASE_URL is missing
  }
};

export const getRun = async (id: string): Promise<RunRecord | undefined> => {
  const mem = memoryStore.get(id);
  if (mem) return mem;

  try {
    const result = await prisma.run.findUnique({
      where: { id }
    });
    if (!result) return undefined;

    const json = result.mobileResult as Record<string, unknown>;
    return {
      id: result.id,
      url: result.url,
      timestamp: result.timestamp.toISOString(),
      diffText: result.diffText || undefined,
      status: result.status as RunRecord['status'],
      error: result.error || undefined,
      result: json.result as RunRecord['result'],
      mobileScreenshot: json.mobileScreenshot as string | undefined,
      desktopScreenshot: json.desktopScreenshot as string | undefined
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
      const json = result.mobileResult as Record<string, unknown>;
      return {
        id: result.id,
        url: result.url,
        timestamp: result.timestamp.toISOString(),
        diffText: result.diffText || undefined,
        status: result.status as RunRecord['status'],
        error: result.error || undefined,
        result: json.result as RunRecord['result'],
        mobileScreenshot: json.mobileScreenshot as string | undefined,
        desktopScreenshot: json.desktopScreenshot as string | undefined
      };
    });

    const all = [...memRuns, ...dbRuns];
    const unique = Array.from(new Map(all.map(r => [r.id, r])).values());
    return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return memRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
