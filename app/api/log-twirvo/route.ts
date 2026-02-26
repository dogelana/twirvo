import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// FORCE DYNAMIC: This prevents Next.js from caching the "Empty" state
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { signature } = await request.json();
    
    // Path to your txt file
    const filePath = path.resolve(process.cwd(), 'twirvo_ledger.txt');

    // Append the signature and a newline
    fs.appendFileSync(filePath, `${signature}\n`, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to log' }, { status: 500 });
  }
}

// We also need a way to READ the list for the feed
export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), 'twirvo_ledger.txt');
    if (!fs.existsSync(filePath)) return NextResponse.json({ signatures: [] });

    const content = fs.readFileSync(filePath, 'utf8');
    const signatures = content.split('\n').filter(sig => sig.trim().length > 0);

    return NextResponse.json({ signatures });
  } catch (error) {
    return NextResponse.json({ signatures: [] });
  }
}