import { NextResponse } from 'next/server';
import { getAllRuns } from '@/lib/store';

export async function GET() {
  const runs = await getAllRuns();
  return NextResponse.json(runs);
}
