import { NextResponse } from 'next/server';
import { getAllRuns } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getAllRuns());
}
