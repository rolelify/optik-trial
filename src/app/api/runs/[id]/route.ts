import { NextRequest, NextResponse } from 'next/server';
import { getRun } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const run = getRun(resolvedParams.id);
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(run);
}
