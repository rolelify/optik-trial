import prisma from './prisma';
import { RunRecord } from './types';
import { Prisma } from '@prisma/client';

// We map our RunRecord domain type to Prisma interactions

export const saveRun = async (record: RunRecord) => {
  await prisma.run.upsert({
    where: { id: record.id },
    create: {
      id: record.id,
      url: record.url,
      timestamp: new Date(record.timestamp),
      diffText: record.diffText,
      intentMode: record.intentMode,
      status: record.status,
      error: record.error,
      mobileResult: record.mobileResult as unknown as Prisma.InputJsonValue,
      desktopResult: record.desktopResult as unknown as Prisma.InputJsonValue
    },
    update: {
      status: record.status,
      error: record.error,
      mobileResult: record.mobileResult as unknown as Prisma.InputJsonValue,
      desktopResult: record.desktopResult as unknown as Prisma.InputJsonValue
    }
  });
};

export const getRun = async (id: string): Promise<RunRecord | undefined> => {
  const result = await prisma.run.findUnique({
    where: { id }
  });
  if (!result) return undefined;

  return {
    id: result.id,
    url: result.url,
    timestamp: result.timestamp.toISOString(),
    diffText: result.diffText || undefined,
    intentMode: result.intentMode,
    status: result.status as RunRecord['status'],
    error: result.error || undefined,
    mobileResult: result.mobileResult as unknown as NonNullable<RunRecord['mobileResult']>,
    desktopResult: result.desktopResult as unknown as NonNullable<RunRecord['desktopResult']>
  };
};

export const getAllRuns = async (): Promise<RunRecord[]> => {
  const results = await prisma.run.findMany({
    orderBy: { timestamp: 'desc' }
  });

  return results.map(result => ({
    id: result.id,
    url: result.url,
    timestamp: result.timestamp.toISOString(),
    diffText: result.diffText || undefined,
    intentMode: result.intentMode,
    status: result.status as RunRecord['status'],
    error: result.error || undefined,
    mobileResult: result.mobileResult as unknown as NonNullable<RunRecord['mobileResult']>,
    desktopResult: result.desktopResult as unknown as NonNullable<RunRecord['desktopResult']>
  }));
};
