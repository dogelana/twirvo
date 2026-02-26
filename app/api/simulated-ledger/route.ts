import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const filePath = path.resolve(process.cwd(), 'simulated_twirvo_ledger.txt');

// GET: How your frontend reads the simulated posts
export async function GET() {
  try {
    if (!fs.existsSync(filePath)) return NextResponse.json({ signatures: [] });
    const content = fs.readFileSync(filePath, 'utf8');
    const signatures = content.split('\n').filter(sig => sig.trim().length > 0);
    return NextResponse.json({ signatures });
  } catch (error) {
    return NextResponse.json({ signatures: [] });
  }
}

// POST: How your Python script injects new simulated posts
export async function POST(request: Request) {
  // The Security Bouncer
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { signature } = await request.json();
    fs.appendFileSync(filePath, `${signature}\n`, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
  }
}